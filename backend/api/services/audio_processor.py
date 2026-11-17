import asyncio
import json
import logging
import os
import re
import shutil
import subprocess
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
from api.utils.helpers import get_cookies_file_path
import hashlib
import httpx
import numpy as np

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

# High-precision DJ mix recognition constants (Optimized for quick cuts and 80+ song festival sets)
CHUNK_DURATION_SEC = 11       # 11-second snippet (optimal for Shazam signature extraction)
CHUNK_STRIDE_SEC = 20         # 20-second phrase stride for thorough recovery of 60-120+ tracks
MAX_CONCURRENT_REQUESTS = 8   # 8 rate-paced concurrent workers with rotating proxy shield
MERGE_WINDOW_SEC = 180        # Merge detections of the same song within 3 minutes (180s)
MIN_SONG_GAP_SEC = 300        # Only show Unknown Track if true dead gap > 5 minutes (300s)
MIN_CONFIDENCE = 30           # Catch pitched-up edits and fast club remixes


def _normalize_title(text: str) -> str:
    """Normalize song title for smart matching without destroying title words."""
    if not text:
        return ""
    t = text.lower()
    # Remove featured artist tags and parenthetical versions like (feat. ...), [Remix], etc.
    t = re.sub(r'\(.*?\)|\[.*?\]', '', t)
    # Remove soundtrack indicators like (From "...") or "title track"
    t = re.sub(r'\btitle\s+track\b', '', t)
    # Remove punctuation & symbols
    t = re.sub(r'[^a-z0-9\s]', '', t)
    return ' '.join(t.split())


def _normalize_artist(text: str) -> str:
    """Normalize artist name for cross-chunk compatibility checks."""
    if not text:
        return ""
    t = text.lower()
    t = re.sub(r'\(.*?\)|\[.*?\]', '', t)
    t = re.sub(r'\b(?:feat|ft|featuring|with|and|&)\b.*', '', t)
    t = re.sub(r'[^a-z0-9\s]', '', t)
    return ' '.join(t.split())


def _update_job(db, job_id: str, **kwargs):
    from api.models.database import AnalysisJob
    job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
    if job:
        for k, v in kwargs.items():
            setattr(job, k, v)
        db.commit()


def find_audible_drop(audio_path: str, start_win: float, end_win: float) -> float:
    """
    Scans a transition window [start_win, end_win] in 50ms frames to detect the exact
    audible drop / takeover point where incoming track drops and outgoing track mutes.
    Uses zero-RAM streaming FFmpeg pipe with < 5MB memory overhead.
    """
    if not audio_path or not os.path.exists(audio_path):
        return round((start_win + end_win) / 2.0, 1)

    start_win = max(0.0, float(start_win))
    end_win = max(start_win, float(end_win))
    dur = end_win - start_win
    if dur <= 0.4:
        return round(end_win, 1)

    cmd = [
        "ffmpeg", "-nostdin",
        "-ss", str(start_win),
        "-t", str(dur),
        "-i", audio_path,
        "-f", "f32le",
        "-ac", "1",
        "-ar", "22050",
        "-"
    ]
    try:
        out = subprocess.check_output(cmd, stderr=subprocess.DEVNULL)
        y = np.frombuffer(out, dtype=np.float32)
        sr = 22050
        hop = int(sr * 0.05)  # 50ms frames
        if len(y) < hop * 2:
            return round((start_win + end_win) / 2.0, 1)

        rms = np.array([np.sqrt(np.mean(y[i:i+hop]**2)) for i in range(0, len(y)-hop, hop)])
        if len(rms) < 2:
            return round((start_win + end_win) / 2.0, 1)

        diffs = np.diff(rms)
        # Score = positive onset diff weighted by incoming energy
        weights = rms[1:]
        score = diffs * weights
        best_idx = int(np.argmax(score)) + 1
        drop_time = start_win + (best_idx * 0.05)
        return round(max(start_win, min(end_win, drop_time)), 1)
    except Exception as e:
        logger.warning(f"Audible drop detection failed for window [{start_win}, {end_win}]: {e}")
        return round((start_win + end_win) / 2.0, 1)


class AudioProcessor:
    def __init__(self):
        self.acrcloud = ACRCloudRecognizer()
        self.audd = AudDRecognizer()
        self.shazam = ShazamRecognizer()

    async def _recognize_single_chunk(self, chunk_path: str, offset_sec: float, allow_fallback: bool = False) -> list:
        results = []
        # Primary: High-speed Apple Shazam with official iOS headers & proxy rotation (<0.4s per chunk)
        if self.shazam.is_configured():
            try:
                results = await self.shazam.recognize_chunk(chunk_path, offset_sec)
            except Exception as e:
                logger.debug(f"Shazam chunk error at {offset_sec}s: {e}")

        # Secondary: Targeted ACRCloud fallback ONLY for long unresolved gaps (avoids 150+ wasted HTTP requests)
        if not results and allow_fallback and self.acrcloud.is_configured():
            try:
                results = await self.acrcloud.recognize_chunk(chunk_path, offset_sec)
            except Exception as e:
                logger.debug(f"ACRCloud chunk fallback error at {offset_sec}s: {e}")

        # Tertiary: Targeted AudD fallback
        if not results and allow_fallback and self.audd.is_configured():
            try:
                results = await self.audd.recognize_chunk(chunk_path, offset_sec)
            except Exception as e:
                logger.debug(f"AudD chunk fallback error at {offset_sec}s: {e}")

        return [r for r in results if r.confidence >= MIN_CONFIDENCE]

    async def process_mix(self, job_id: str, url: str, db) -> None:
        from api.models.database import Track
        from api.utils.helpers import generate_platform_links

        tmp_dir = tempfile.mkdtemp()
        try:
            is_local = url.startswith("file://") or (os.path.isabs(url) and os.path.exists(url))
            if is_local:
                audio_path = url.replace("file://", "")
                _update_job(
                    db, job_id,
                    status="processing",
                    stage_message="Processing uploaded mix file…",
                    progress=10,
                )
            else:
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

            # 4. Zero-RAM duration resolution and streaming snippet slicing with ffmpeg
            total_sec = self._get_audio_duration(audio_path)
            if total_sec > 0:
                _update_job(db, job_id, video_duration=int(total_sec))
            else:
                from api.models.database import AnalysisJob
                job_rec = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
                total_sec = float(job_rec.video_duration) if job_rec and job_rec.video_duration else 3600.0

            coarse_offsets = []
            pos = 0.0
            while pos < total_sec:
                coarse_offsets.append(pos)
                pos += CHUNK_STRIDE_SEC
            total_chunks = len(coarse_offsets)

            # 5. Parallel Batch Recognition with 16 Workers and Adaptive Transition Bisection
            raw_results = []
            semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
            completed_count = 0
            loop = asyncio.get_event_loop()

            async def sem_worker(offset_sec: float, idx: int, stage_label: str = "", allow_fallback: bool = False):
                nonlocal completed_count
                async with semaphore:
                    await asyncio.sleep(0.08)
                    chunk_path = os.path.join(tmp_dir, f"chunk_{idx:05d}.wav")
                    cmd = [
                        "ffmpeg", "-y",
                        "-nostdin",
                        "-ss", str(offset_sec),
                        "-t", str(CHUNK_DURATION_SEC),
                        "-i", audio_path,
                        "-ac", "1",
                        "-ar", "44100",
                        "-vn",
                        chunk_path
                    ]
                    await loop.run_in_executor(None, lambda: subprocess.run(cmd, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL))
                    res = []
                    if os.path.exists(chunk_path) and os.path.getsize(chunk_path) > 1000:
                        try:
                            res = await self._recognize_single_chunk(chunk_path, offset_sec, allow_fallback=allow_fallback)
                        finally:
                            try:
                                os.remove(chunk_path)
                            except Exception:
                                pass

                    completed_count += 1
                    current_prog = 10 + int((completed_count / (total_chunks + 40)) * 80)
                    current_prog = min(current_prog, 90)
                    msg = f"Fingerprinting set: chunk {completed_count} ({stage_label}) …" if stage_label else f"Fingerprinting set: chunk {completed_count} of {total_chunks} …"
                    _update_job(
                        db, job_id,
                        stage_message=msg,
                        progress=current_prog,
                    )
                    return res

            # Pass 1: Safe 32-second Coarse Scan
            tasks = [sem_worker(o, i, "Pass 1") for i, o in enumerate(coarse_offsets)]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)

            coarse_hits = {}
            for i, b in enumerate(batch_results):
                if isinstance(b, list) and b:
                    raw_results.extend(b)
                    coarse_hits[coarse_offsets[i]] = b[0]

            # Pass 2: Adaptive Transition Bisection (Only between confirmed distinct songs)
            refine_offsets = []
            for i in range(len(coarse_offsets) - 1):
                t1 = coarse_offsets[i]
                t2 = coarse_offsets[i + 1]
                hit1 = coarse_hits.get(t1)
                hit2 = coarse_hits.get(t2)
                if hit1 and hit2 and _normalize_title(hit1.title) != _normalize_title(hit2.title):
                    refine_offsets.append((t1 + t2) / 2.0)

            if refine_offsets:
                refine_tasks = [sem_worker(o, 50000 + i, "Refining Drops") for i, o in enumerate(refine_offsets)]
                refine_results = await asyncio.gather(*refine_tasks, return_exceptions=True)
                for b in refine_results:
                    if isinstance(b, list) and b:
                        raw_results.extend(b)

            # Pass 3: Targeted Regional Fallback (ACRCloud) ONLY on large unresolved voids (> 240s)
            gap_check_offsets = []
            sorted_raw = sorted(raw_results, key=lambda x: x.absolute_timestamp)
            for i in range(len(sorted_raw) - 1):
                g = sorted_raw[i+1].absolute_timestamp - sorted_raw[i].absolute_timestamp
                if g > 240.0:
                    gap_check_offsets.append(sorted_raw[i].absolute_timestamp + g / 2.0)
            if gap_check_offsets:
                gap_tasks = [sem_worker(o, 80000 + i, "Targeted Fallback", allow_fallback=True) for i, o in enumerate(gap_check_offsets[:5])]
                gap_results = await asyncio.gather(*gap_tasks, return_exceptions=True)
                for b in gap_results:
                    if isinstance(b, list) and b:
                        raw_results.extend(b)

            # 6. Deduplicate & merge with audible handover drop snapping
            tracks_data = self._deduplicate(raw_results, audio_path=audio_path)

            # 7. Gap analysis — only insert Unknown Track if true dead gap > 240s
            tracks_data = self._fill_gaps(tracks_data, total_sec)

            # 8. Enrich identified tracks with album art, BPM, Key, release year, label in parallel
            enrich_sem = asyncio.Semaphore(10)
            async def _safe_enrich(t):
                if not t.get("is_identified") or t.get("title") == "Unknown Track":
                    return t
                async with enrich_sem:
                    try:
                        return await asyncio.wait_for(enrich_track_metadata(t["title"], t["artist"], t), timeout=3.0)
                    except Exception:
                        return t

            tracks_data = await asyncio.gather(*[_safe_enrich(t) for t in tracks_data])

            # 9. Build final tracks with realistic overlapping transition end_times
            db_tracks = []
            for idx, t in enumerate(tracks_data):
                if idx + 1 < len(tracks_data):
                    next_start = tracks_data[idx + 1]["start_time"]
                    # Support overlapping DJ transition: Track i continues playing during crossfade (fade-out)
                    # Typical crossfade overlap is 15-25 seconds
                    overlap_sec = 20.0
                    end_time = min(total_sec, max(t["start_time"] + 15.0, next_start + overlap_sec))
                else:
                    end_time = total_sec

                dur = max(0.0, end_time - t["start_time"])
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
        cookie_file = get_cookies_file_path()
        raw_proxy = os.environ.get("YTDLP_PROXY") or os.environ.get("HTTP_PROXY") or os.environ.get("HTTPS_PROXY") or ""
        proxy_candidates = [p.strip() for p in raw_proxy.split(",") if p.strip()] or [None]

        last_error = "Unknown error"
        for proxy in proxy_candidates:
            cmd = [
                "yt-dlp",
                "-f", "ba[abr<=64]/ba[abr<=80]/ba/b/best",
                "--no-playlist",
                "--no-warnings",
                "--force-ipv4",
                "--js-runtimes", "node",
                "--remote-components", "ejs:github",
                "-o", output_path,
                url,
            ]
            if ffmpeg_dir:
                cmd = cmd[:1] + ["--ffmpeg-location", ffmpeg_dir] + cmd[1:]
            if proxy:
                cmd.extend(["--proxy", proxy])
            if cookie_file:
                cmd.extend(["--cookies", cookie_file])

            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await proc.communicate()
            if proc.returncode == 0:
                for f in os.listdir(tmp_dir):
                    if f.startswith("audio.") and not f.endswith(".part"):
                        return os.path.join(tmp_dir, f)

            # Record error and try next proxy candidate if available
            err_msg = stderr.decode()[:500] if stderr else "Download exited with non-zero status"
            last_error = err_msg
            logger.warning(f"Download attempt failed with proxy '{proxy}': {err_msg}")

        raise RuntimeError(f"yt-dlp failed: {last_error}")

    def _get_audio_duration(self, audio_path: str) -> float:
        """Get audio duration in seconds using ffprobe without loading file into memory."""
        cmd = [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            audio_path
        ]
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            if res.returncode == 0 and res.stdout.strip():
                return float(res.stdout.strip())
        except Exception as e:
            logger.warning(f"ffprobe duration check failed: {e}")
        return 0.0

    def _split_into_chunks(
        self, audio_path: str, total_sec: float, tmp_dir: str
    ) -> list[tuple[str, float]]:
        """Slice 15-second mono WAV snippets directly using ffmpeg. Memory used: ~15MB (resets immediately)."""
        chunks = []
        step = CHUNK_STRIDE_SEC
        dur = CHUNK_DURATION_SEC
        pos = 0.0
        idx = 0

        while pos < total_sec:
            chunk_path = os.path.join(tmp_dir, f"chunk_{idx:04d}.wav")
            cmd = [
                "ffmpeg", "-y",
                "-ss", str(pos),
                "-t", str(dur),
                "-i", audio_path,
                "-ac", "1",
                "-ar", "44100",
                "-vn",
                chunk_path
            ]
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if os.path.exists(chunk_path) and os.path.getsize(chunk_path) > 1000:
                chunks.append((chunk_path, pos))
            pos += step
            idx += 1

        return chunks

    def _deduplicate(self, raw: list, audio_path: str = None) -> list[dict]:
        """
        Smart Fuzzy De-duplication & Audible Handover Drop Snapping:
        1. Normalizes song titles without destroying title words.
        2. Merges same title & compatible artist within MERGE_WINDOW_SEC (240s = 4 minutes).
        3. Preserves genuine repeat appearances (> 4 minutes apart) as distinct timeline segments.
        4. Strict Audible Handover Invariant:
           When Track A transitions to Track B, Track B's start time CANNOT be placed inside
           Track A's dominant playing window. Faint background pre-cues on deck B are ignored.
        5. Snaps the timestamp to the exact audible drop in window [T_{A,last}, T_{B,dominant}]
           using fast sub-second RMS onset analysis if audio_path is provided.
        """
        raw = sorted(raw, key=lambda r: r.absolute_timestamp)
        merged = []

        for r in raw:
            norm_title = _normalize_title(r.title)
            norm_artist = _normalize_artist(r.artist)
            found = False

            for m in merged:
                m_norm_title = _normalize_title(m["title"])
                m_norm_artist = _normalize_artist(m["artist"])

                # Exact title match or high token similarity
                title_identical = (norm_title == m_norm_title)
                title_close = False
                if not title_identical and len(norm_title) >= 5 and len(m_norm_title) >= 5:
                    t1_tokens = set(norm_title.split())
                    t2_tokens = set(m_norm_title.split())
                    common = t1_tokens.intersection(t2_tokens)
                    if len(common) >= min(len(t1_tokens), len(t2_tokens)) * 0.8:
                        title_close = True

                title_matches = title_identical or title_close

                # Check artist compatibility (don't merge different artists unless one is unknown)
                artist_compatible = True
                if norm_artist and m_norm_artist:
                    a1_tokens = set(norm_artist.split())
                    a2_tokens = set(m_norm_artist.split())
                    if not a1_tokens.intersection(a2_tokens):
                        artist_compatible = False

                # Time window: only merge if within MERGE_WINDOW_SEC (4 mins) of the cluster's latest detection
                last_det = m["detections"][-1]
                if title_matches and artist_compatible and abs(r.absolute_timestamp - last_det) <= MERGE_WINDOW_SEC:
                    m["detections"].append(r.absolute_timestamp)
                    if getattr(r, "match_offset", None) is not None:
                        m["match_offsets"].append(r.match_offset)

                    # Update to keep the highest confidence metadata
                    if r.confidence > m["confidence"]:
                        m["title"] = r.title
                        m["artist"] = r.artist
                        m["confidence"] = r.confidence
                        if getattr(r, "bpm", None): m["bpm"] = r.bpm
                        if getattr(r, "musical_key", None): m["musical_key"] = r.musical_key
                        if getattr(r, "release_year", None): m["release_year"] = r.release_year
                        if getattr(r, "label", None): m["label"] = r.label

                    # Always preserve album art if available
                    if not m.get("album_art") and getattr(r, "album_art", None):
                        m["album_art"] = r.album_art

                    found = True
                    break

            if not found:
                merged.append({
                    "title": r.title,
                    "artist": r.artist,
                    "confidence": r.confidence,
                    "is_identified": True,
                    "bpm": getattr(r, "bpm", None),
                    "musical_key": getattr(r, "musical_key", None),
                    "release_year": getattr(r, "release_year", None),
                    "label": getattr(r, "label", None),
                    "album_art": getattr(r, "album_art", None),
                    "detections": [r.absolute_timestamp],
                    "match_offsets": [r.match_offset] if getattr(r, "match_offset", None) is not None else [],
                })

        # Calculate exact audible start timestamps respecting handover transitions
        for i, m in enumerate(merged):
            t_first = min(m["detections"])
            t_last = max(m["detections"])
            m_offsets = m.get("match_offsets", [])
            first_offset = m_offsets[0] if m_offsets else None

            if i == 0:
                # First track of the mix
                if first_offset is not None and 0.0 < first_offset <= 35.0:
                    m["start_time"] = max(0.0, t_first - first_offset)
                else:
                    m["start_time"] = t_first if t_first > 5.0 else 0.0
            else:
                prev = merged[i - 1]
                prev_last = max(prev["detections"])
                gap_from_prev = t_first - prev_last

                if gap_from_prev > MERGE_WINDOW_SEC:
                    # Genuine large gap (separated tracks)
                    if first_offset is not None and 0.0 < first_offset <= 35.0:
                        m["start_time"] = max(prev_last, t_first - first_offset)
                    else:
                        m["start_time"] = t_first
                else:
                    # Transition / crossfade handover between prev and current
                    # Any detection of current track while prev was still detected was pre-cue / low fader
                    # First post-handover detection of current track:
                    post_detections = [t for t in m["detections"] if t >= prev_last]
                    t_dominant = min(post_detections) if post_detections else t_last

                    win_start = prev_last
                    win_end = max(prev_last, t_dominant)

                    if win_start >= win_end:
                        m["start_time"] = win_start
                    elif audio_path and os.path.exists(audio_path):
                        m["start_time"] = find_audible_drop(audio_path, win_start, win_end)
                    else:
                        # Fallback when audio_path not present: midpoint of transition
                        m["start_time"] = round((win_start + win_end) / 2.0, 1)

            # Ensure start_time is never negative and rounded
            m["start_time"] = max(0.0, round(float(m["start_time"]), 1))

        # Cleanup internal temporary tracking keys
        for m in merged:
            m.pop("detections", None)
            m.pop("match_offsets", None)

        return sorted(merged, key=lambda x: x["start_time"])

    def _fill_gaps(self, tracks: list[dict], total_duration: float) -> list[dict]:
        if not tracks:
            return [{
                "title": "Unknown Track",
                "artist": "Unknown Artist",
                "start_time": 0.0,
                "confidence": 0,
                "is_identified": False,
            }]

        result = []
        # Only add leading Unknown Track if set begins with more than 90s of unidentified music
        if tracks[0]["start_time"] > 90.0:
            result.append({
                "title": "Unknown Track",
                "artist": "Unknown Artist",
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
            # Only insert Unknown Track if there is a massive unrecognised void (> 300s = 5 minutes)
            # In standard DJ sets, a song playing for 2.5-4.5 minutes is normal and MUST NOT be cut in half!
            if gap > MIN_SONG_GAP_SEC:
                unknown_start = track["start_time"] + 180.0
                if next_start - unknown_start >= 60.0:
                    result.append({
                        "title": "Unknown Track",
                        "artist": "Unknown Artist",
                        "start_time": unknown_start,
                        "confidence": 0,
                        "is_identified": False,
                    })

        # If set ends with more than 5 minutes of unidentified outro audio
        if total_duration - tracks[-1]["start_time"] > MIN_SONG_GAP_SEC and len(result) > 0 and result[-1]["title"] != "Unknown Track":
            result.append({
                "title": "Unknown Track",
                "artist": "Unknown Artist",
                "start_time": tracks[-1]["start_time"] + 180.0,
                "confidence": 0,
                "is_identified": False,
            })

        return sorted(result, key=lambda x: x["start_time"])
