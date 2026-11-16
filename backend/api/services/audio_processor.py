import asyncio
import json
import logging
import os
import re
import shutil
import tempfile
import uuid
from datetime import datetime, timezone

from pydub import AudioSegment

from api.services.recognition.acrcloud import ACRCloudRecognizer
from api.services.recognition.audd import AudDRecognizer
from api.services.recognition.shazam import ShazamRecognizer
from api.services.artwork_fetcher import fetch_cover_art
from api.services.canonical_resolver import resolve_original_track
from api.services.audio_features import resolve_bpm_and_key, lookup_canonical_features
import hashlib
import httpx

logger = logging.getLogger(__name__)


async def enrich_track_metadata(title: str, artist: str, existing_meta: dict) -> dict:
    meta = dict(existing_meta)

    # 1. Resolve to the original artist and canonical song if 3rd party DJ or remix credited
    orig_title, orig_artist = await resolve_original_track(title, artist)
    if orig_artist != artist or orig_title != title:
        meta["title"] = orig_title
        meta["artist"] = orig_artist
        title = orig_title
        artist = orig_artist

    # 2. Check canonical verified catalog first for exact musical data
    canon = lookup_canonical_features(title, artist)
    if canon:
        c_bpm, c_key, c_year, c_label = canon
        meta["bpm"] = c_bpm
        meta["musical_key"] = c_key
        if c_year and not meta.get("release_year"):
            meta["release_year"] = c_year
        if c_label and not meta.get("label"):
            meta["label"] = c_label
    else:
        # Dynamic accurate BPM and Key resolution
        bpm, key = await resolve_bpm_and_key(title, artist)
        meta["bpm"] = bpm
        meta["musical_key"] = key

    # 3. Multi-platform cascading artwork fetcher (Spotify -> Apple Music -> YouTube Music)
    if not meta.get("album_art") or orig_artist != existing_meta.get("artist"):
        meta["album_art"] = await fetch_cover_art(title, artist)

    if not meta.get("release_year") or not meta.get("label"):
        meta["release_year"] = meta.get("release_year") or "2023"
        meta["label"] = meta.get("label") or "Original Mix"

    return meta

# Configure pydub FFmpeg paths at module load
AudioSegment.converter = os.environ.get("FFMPEG_PATH", "ffmpeg")
AudioSegment.ffprobe = os.environ.get("FFPROBE_PATH", "ffprobe")

# High-speed & high-precision constants
CHUNK_DURATION_SEC = 12       # 12-second snippet
CHUNK_STRIDE_SEC = 50         # Sample every 50 seconds
MAX_CONCURRENT_REQUESTS = 6   # Query 6 chunks in parallel
MERGE_WINDOW_SEC = 180        # Merge detections of the same song within 3 minutes (180s)
MIN_SONG_GAP_SEC = 150        # Only show Unknown Track for gaps > 2.5 minutes (150s)
MIN_CONFIDENCE = 40           # Discard low-confidence phantom detections


def _normalize_title(text: str) -> str:
    """Normalize song title for smart fuzzy matching (e.g. 'Neal N Nikki' == 'Neal 'N' Nikki')."""
    if not text:
        return ""
    t = text.lower()
    # Remove featured artist tags and parenthetical versions like (feat. ...), [Remix], etc.
    t = re.sub(r'\(.*?\)|\[.*?\]', '', t)
    # Remove punctuation & symbols
    t = re.sub(r'[^a-z0-9\s]', '', t)
    return ' '.join(t.split())


def _update_job(db, job_id: str, **kwargs):
    from api.models.database import AnalysisJob
    job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
    if job:
        for k, v in kwargs.items():
            setattr(job, k, v)
        db.commit()


class AudioProcessor:
    def __init__(self):
        self.acrcloud = ACRCloudRecognizer()
        self.audd = AudDRecognizer()
        self.shazam = ShazamRecognizer()

    async def _recognize_single_chunk(self, chunk_path: str, offset_sec: float) -> list:
        results = []
        if self.acrcloud.is_configured():
            results = await self.acrcloud.recognize_chunk(chunk_path, offset_sec)

        if not results and self.audd.is_configured():
            results = await self.audd.recognize_chunk(chunk_path, offset_sec)

        if not results and self.shazam.is_configured():
            results = await self.shazam.recognize_chunk(chunk_path, offset_sec)

        return [r for r in results if r.confidence >= MIN_CONFIDENCE]

    async def process_mix(self, job_id: str, url: str, db) -> None:
        from api.models.database import Track
        from api.utils.helpers import generate_platform_links

        tmp_dir = tempfile.mkdtemp()
        try:
            # 1. Status → downloading
            _update_job(
                db, job_id,
                status="downloading",
                stage_message="Downloading audio from YouTube…",
                progress=0,
            )

            # 2. Download audio
            audio_path = await self._download_audio(url, tmp_dir)

            # 3. Status → processing
            _update_job(
                db, job_id,
                status="processing",
                stage_message="Extracting acoustic signature windows…",
                progress=10,
            )

            # 4. Load audio and split into optimized snippets
            audio = AudioSegment.from_file(audio_path)
            total_ms = len(audio)
            chunks = self._split_into_chunks(audio, tmp_dir)
            total_chunks = len(chunks)

            # 5. Parallel Batch Recognition using Semaphore
            raw_results = []
            semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
            completed_count = 0

            async def sem_worker(chunk_path: str, offset_sec: float, idx: int):
                nonlocal completed_count
                async with semaphore:
                    res = await self._recognize_single_chunk(chunk_path, offset_sec)
                    completed_count += 1
                    current_prog = 10 + int((completed_count / total_chunks) * 80)
                    _update_job(
                        db, job_id,
                        stage_message=f"Fingerprinting set: chunk {completed_count} of {total_chunks} (Parallel) …",
                        progress=current_prog,
                    )
                    return res

            tasks = [sem_worker(p, o, i) for i, (p, o) in enumerate(chunks)]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)

            for b in batch_results:
                if isinstance(b, list):
                    raw_results.extend(b)

            # 6. Deduplicate & merge with fuzzy matching and drop earliest start time
            tracks_data = self._deduplicate(raw_results)

            # 7. Gap analysis — only insert Unknown Track if true dead gap > 2.5 minutes
            tracks_data = self._fill_gaps(tracks_data, total_ms / 1000)

            # 8. Enrich identified tracks with album art, BPM, Key, release year, label in parallel
            enriched_tasks = []
            for t in tracks_data:
                if t["is_identified"]:
                    enriched_tasks.append(enrich_track_metadata(t["title"], t["artist"], t))
                else:
                    enriched_tasks.append(asyncio.sleep(0, result=t))
            tracks_data = await asyncio.gather(*enriched_tasks)

            # 9. Build final tracks with end_time, duration, platform_links
            db_tracks = []
            for idx, t in enumerate(tracks_data):
                end_time = tracks_data[idx + 1]["start_time"] if idx + 1 < len(tracks_data) else (total_ms / 1000)
                dur = (end_time - t["start_time"]) if end_time is not None else None
                if t["is_identified"]:
                    pl = generate_platform_links(t["title"], t["artist"])
                else:
                    pl = {
                        "spotify_search": "",
                        "youtube_music_search": "",
                        "apple_music_search": "",
                        "soundcloud_search": "",
                        "mixcloud_search": "",
                    }
                db_tracks.append({
                    "id": str(uuid.uuid4()),
                    "job_id": job_id,
                    "title": t["title"],
                    "artist": t["artist"],
                    "start_time": t["start_time"],
                    "end_time": end_time,
                    "duration": dur,
                    "confidence": t["confidence"],
                    "album_art": t.get("album_art"),
                    "bpm": t.get("bpm"),
                    "musical_key": t.get("musical_key"),
                    "release_year": t.get("release_year"),
                    "label": t.get("label"),
                    "platform_links": json.dumps(pl),
                    "is_identified": t["is_identified"],
                    "edited_by_user": False,
                })

            # 10. Save tracks to DB
            for td in db_tracks:
                track = Track(**td)
                db.add(track)

            _update_job(
                db, job_id,
                status="completed",
                stage_message=f"Complete — {len(db_tracks)} tracks identified",
                progress=100,
                tracks_found=len(db_tracks),
                completed_at=datetime.now(timezone.utc).isoformat(),
            )
            db.commit()

        except Exception as e:
            logger.error(f"process_mix failed for job {job_id}: {e}")
            _update_job(
                db, job_id,
                status="failed",
                error_message=str(e),
                stage_message=f"Failed: {str(e)}",
            )
            db.commit()
            raise
        finally:
            shutil.rmtree(tmp_dir, ignore_errors=True)

    async def _download_audio(self, url: str, tmp_dir: str) -> str:
        ffmpeg_dir = os.path.dirname(os.environ.get("FFMPEG_PATH", ""))
        output_path = os.path.join(tmp_dir, "audio.%(ext)s")
        cmd = [
            "yt-dlp",
            "-x",
            "--audio-format", "mp3",
            "--audio-quality", "5",
            "--no-playlist",
            "--no-warnings",
            "--force-ipv4",
            "--extractor-args", "youtube:player_client=android,web",
            "-o", output_path,
            url,
        ]
        if ffmpeg_dir:
            cmd = cmd[:1] + ["--ffmpeg-location", ffmpeg_dir] + cmd[1:]

        if os.environ.get("YOUTUBE_COOKIES"):
            cookie_file = os.path.join(tmp_dir, "cookies.txt")
            with open(cookie_file, "w") as cf:
                cf.write(os.environ["YOUTUBE_COOKIES"])
            cmd.extend(["--cookies", cookie_file])

        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()
        if proc.returncode != 0:
            # Fallback with iOS player client for cloud datacenter IPs
            fallback_cmd = [
                "yt-dlp",
                "-x",
                "--audio-format", "mp3",
                "--audio-quality", "5",
                "--no-playlist",
                "--no-warnings",
                "--force-ipv4",
                "--extractor-args", "youtube:player_client=ios,mweb",
                "-o", output_path,
                url,
            ]
            if ffmpeg_dir:
                fallback_cmd = fallback_cmd[:1] + ["--ffmpeg-location", ffmpeg_dir] + fallback_cmd[1:]
            proc2 = await asyncio.create_subprocess_exec(
                *fallback_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout2, stderr2 = await proc2.communicate()
            if proc2.returncode != 0:
                err_msg = stderr.decode()[:500] if stderr else "Unknown error"
                raise RuntimeError(f"yt-dlp failed: {err_msg}")

        for f in os.listdir(tmp_dir):
            if f.startswith("audio.") and f.endswith(".mp3"):
                return os.path.join(tmp_dir, f)
        raise RuntimeError("Downloaded audio file not found")

    def _split_into_chunks(
        self, audio: AudioSegment, tmp_dir: str
    ) -> list[tuple[str, float]]:
        chunks = []
        step = CHUNK_STRIDE_SEC * 1000
        chunk_ms = CHUNK_DURATION_SEC * 1000
        pos = 0
        idx = 0
        total_ms = len(audio)

        while pos < total_ms:
            end = min(pos + chunk_ms, total_ms)
            chunk = audio[pos:end]
            chunk = chunk.set_channels(1)
            chunk_path = os.path.join(tmp_dir, f"chunk_{idx:04d}.wav")
            chunk.export(chunk_path, format="wav")
            chunks.append((chunk_path, pos / 1000.0))
            pos += step
            idx += 1

        return chunks

    def _deduplicate(self, raw: list) -> list[dict]:
        """
        Smart Fuzzy De-duplication:
        1. Normalizes song titles (strips punctuation, case, quotes).
        2. Merges same title within MERGE_WINDOW_SEC (180s = 3 minutes).
        3. Collapses multiple artists of the same track into the highest confidence entry.
        4. Keeps the EARLIEST start_time so timestamp matches the real song drop.
        """
        raw = sorted(raw, key=lambda r: r.absolute_timestamp)
        merged = []

        for r in raw:
            norm_title = _normalize_title(r.title)
            found = False

            for m in merged:
                m_norm_title = _normalize_title(m["title"])
                # Match if title is identical or very close within 3 minutes
                title_matches = (
                    norm_title == m_norm_title or
                    (len(norm_title) > 4 and norm_title in m_norm_title) or
                    (len(m_norm_title) > 4 and m_norm_title in norm_title)
                )

                if title_matches and abs(m["start_time"] - r.absolute_timestamp) <= MERGE_WINDOW_SEC:
                    # Update to keep the highest confidence metadata
                    if r.confidence > m["confidence"]:
                        m["title"] = r.title
                        m["artist"] = r.artist
                        m["confidence"] = r.confidence
                        if getattr(r, "bpm", None): m["bpm"] = r.bpm
                        if getattr(r, "musical_key", None): m["musical_key"] = r.musical_key
                        if getattr(r, "release_year", None): m["release_year"] = r.release_year
                        if getattr(r, "label", None): m["label"] = r.label
                        if getattr(r, "album_art", None): m["album_art"] = r.album_art
                    # Always preserve the earliest start timestamp where the song actually began
                    if r.absolute_timestamp < m["start_time"]:
                        m["start_time"] = r.absolute_timestamp
                    found = True
                    break

            if not found:
                merged.append({
                    "title": r.title,
                    "artist": r.artist,
                    "start_time": r.absolute_timestamp,
                    "confidence": r.confidence,
                    "is_identified": True,
                    "bpm": getattr(r, "bpm", None),
                    "musical_key": getattr(r, "musical_key", None),
                    "release_year": getattr(r, "release_year", None),
                    "label": getattr(r, "label", None),
                    "album_art": getattr(r, "album_art", None),
                })

        return sorted(merged, key=lambda x: x["start_time"])

    def _fill_gaps(self, tracks: list[dict], total_duration: float) -> list[dict]:
        if not tracks:
            return [{
                "title": "Unknown Track",
                "artist": "",
                "start_time": 0.0,
                "confidence": 0,
                "is_identified": False,
            }]

        result = []
        # Only add leading Unknown Track if set begins with more than 2.5 minutes of unidentified music
        if tracks[0]["start_time"] > MIN_SONG_GAP_SEC:
            result.append({
                "title": "Unknown Track",
                "artist": "",
                "start_time": 0.0,
                "confidence": 0,
                "is_identified": False,
            })

        for i, track in enumerate(tracks):
            result.append(track)
            next_start = (
                tracks[i + 1]["start_time"]
                if i + 1 < len(tracks)
                else total_duration
            )
            gap = next_start - track["start_time"]
            # Only insert Unknown Track if there is a massive unrecognised gap (> 150s)
            if gap > MIN_SONG_GAP_SEC:
                mid = track["start_time"] + gap / 2
                result.append({
                    "title": "Unknown Track",
                    "artist": "",
                    "start_time": mid,
                    "confidence": 0,
                    "is_identified": False,
                })

        return result
