import re
import subprocess
import json
import os


def extract_video_id(url: str) -> str | None:
    url = url.strip()
    # YouTube patterns
    yt_patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/shorts/)([a-zA-Z0-9_-]{11})',
        r'youtube\.com/embed/([a-zA-Z0-9_-]{11})',
    ]
    for pattern in yt_patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)

    # SoundCloud pattern
    sc_match = re.search(r'soundcloud\.com/([a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+)', url)
    if sc_match:
        return f"sc_{sc_match.group(1).replace('/', '_')}"

    # Mixcloud pattern
    mc_match = re.search(r'mixcloud\.com/([a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+)', url)
    if mc_match:
        return f"mc_{mc_match.group(1).replace('/', '_')}"

    return None


def fetch_video_metadata(identifier: str, full_url: str | None = None) -> dict:
    """Use yt-dlp subprocess to fetch metadata without downloading."""
    if full_url and full_url.startswith("http"):
        url = full_url
    elif identifier.startswith("http"):
        url = identifier
    elif identifier.startswith("sc_") or identifier.startswith("mc_"):
        url = full_url or identifier
    else:
        url = f"https://www.youtube.com/watch?v={identifier}"
    ffmpeg_dir = os.path.dirname(os.environ.get("FFMPEG_PATH", ""))
    cmd = [
        "yt-dlp",
        "--dump-json",
        "--no-download",
        "--no-warnings",
        "--force-ipv4",
        "--extractor-args", "youtube:player_client=android,web",
    ]
    if ffmpeg_dir:
        cmd += ["--ffmpeg-location", ffmpeg_dir]
    if os.environ.get("YOUTUBE_COOKIES"):
        cmd += ["--cookies", os.environ["YOUTUBE_COOKIES"]]
    cmd.append(url)
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            # Fallback with iOS player client
            fallback_cmd = [
                "yt-dlp",
                "--dump-json",
                "--no-download",
                "--no-warnings",
                "--force-ipv4",
                "--extractor-args", "youtube:player_client=ios,mweb",
                url
            ]
            result = subprocess.run(fallback_cmd, capture_output=True, text=True, timeout=30)
            if result.returncode != 0:
                return {
                    "video_title": None,
                    "channel_name": None,
                    "thumbnail_url": None,
                    "video_duration": None,
                }
        data = json.loads(result.stdout)
        # Pick best thumbnail
        thumbnails = data.get("thumbnails", [])
        thumbnail_url = None
        if thumbnails:
            for t in reversed(thumbnails):
                if t.get("url"):
                    thumbnail_url = t["url"]
                    break
        return {
            "video_title": data.get("title"),
            "channel_name": data.get("uploader") or data.get("channel"),
            "thumbnail_url": thumbnail_url or data.get("thumbnail"),
            "video_duration": data.get("duration"),
        }
    except Exception:
        return {
            "video_title": None,
            "channel_name": None,
            "thumbnail_url": None,
            "video_duration": None,
        }
