import re
import subprocess
import json
import os
from api.utils.helpers import get_cookies_file_path


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


def _fetch_oembed_metadata(video_id: str) -> dict:
    import urllib.request
    try:
        oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        req = urllib.request.Request(oembed_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=4) as resp:
            data = json.loads(resp.read().decode())
            return {
                "video_title": data.get("title"),
                "channel_name": data.get("author_name"),
                "thumbnail_url": data.get("thumbnail_url"),
                "video_duration": None,
            }
    except Exception:
        return {}


def fetch_video_metadata(identifier: str, full_url: str | None = None) -> dict:
    """Fetch video metadata with fast oEmbed fallback and yt-dlp duration extraction."""
    meta = {}
    vid = extract_video_id(full_url or identifier)
    if vid and not vid.startswith("sc_") and not vid.startswith("mc_"):
        meta = _fetch_oembed_metadata(vid)

    if full_url and full_url.startswith("http"):
        url = full_url
    elif identifier.startswith("http"):
        url = identifier
    elif identifier.startswith("sc_") or identifier.startswith("mc_"):
        url = full_url or identifier
    else:
        url = f"https://www.youtube.com/watch?v={identifier}"

    ffmpeg_dir = os.path.dirname(os.environ.get("FFMPEG_PATH", ""))
    cookie_file = get_cookies_file_path()
    raw_proxy = os.environ.get("YTDLP_PROXY") or os.environ.get("HTTP_PROXY") or os.environ.get("HTTPS_PROXY") or ""
    proxy_candidates = [p.strip() for p in raw_proxy.split(",") if p.strip()] or [None]

    for proxy in proxy_candidates:
        cmd = [
            "yt-dlp",
            "--dump-json",
            "--no-download",
            "--no-warnings",
            "--force-ipv4",
            "--js-runtimes", "node",
            "--remote-components", "ejs:github",
        ]
        if ffmpeg_dir:
            cmd += ["--ffmpeg-location", ffmpeg_dir]
        if proxy:
            cmd += ["--proxy", proxy]
        if cookie_file:
            cmd += ["--cookies", cookie_file]
        cmd.append(url)
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            if result.returncode == 0:
                data = json.loads(result.stdout)
                thumbnails = data.get("thumbnails", [])
                thumbnail_url = None
                if thumbnails:
                    for t in reversed(thumbnails):
                        if t.get("url"):
                            thumbnail_url = t["url"]
                            break
                return {
                    "video_title": data.get("title") or meta.get("video_title"),
                    "channel_name": data.get("uploader") or data.get("channel") or meta.get("channel_name"),
                    "thumbnail_url": thumbnail_url or data.get("thumbnail") or meta.get("thumbnail_url"),
                    "video_duration": data.get("duration") or meta.get("video_duration"),
                }
        except Exception:
            continue

    if meta.get("video_title"):
        return meta

    return {
        "video_title": None,
        "channel_name": None,
        "thumbnail_url": None,
        "video_duration": None,
    }
