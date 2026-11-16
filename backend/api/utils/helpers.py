from urllib.parse import quote_plus


def generate_platform_links(title: str, artist: str) -> dict:
    query = quote_plus(f"{artist} {title}".strip())
    return {
        "spotify_search": f"https://open.spotify.com/search/{query}",
        "youtube_music_search": f"https://music.youtube.com/search?q={query}",
        "apple_music_search": f"https://music.apple.com/search?term={query}",
        "soundcloud_search": f"https://soundcloud.com/search?q={query}",
        "mixcloud_search": f"https://www.mixcloud.com/search/?q={query}",
    }


def format_timestamp(seconds: float) -> str:
    seconds = int(seconds)
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    if h > 0:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m:02d}:{s:02d}"


def parse_timestamp(ts: str) -> float:
    """Parse 'MM:SS' or 'H:MM:SS' to seconds."""
    parts = ts.strip().split(":")
    if len(parts) == 2:
        return int(parts[0]) * 60 + int(parts[1])
    elif len(parts) == 3:
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
    raise ValueError(f"Invalid timestamp format: {ts}")


def calculate_confidence(raw_score) -> int:
    try:
        return min(100, max(0, int(float(raw_score))))
    except (TypeError, ValueError):
        return 0


def get_cookies_file_path() -> str | None:
    import base64
    import os
    import tempfile

    raw = os.environ.get("YOUTUBE_COOKIES")
    if not raw:
        return None
    if os.path.isfile(raw):
        return raw

    content = raw.strip()
    try:
        if not content.startswith("#"):
            decoded = base64.b64decode(content).decode("utf-8")
            if "youtube" in decoded:
                content = decoded
    except Exception:
        pass

    # Unescape literal backslash-n from web dashboard inputs
    if "\\n" in content:
        content = content.replace("\\n", "\n").replace("\\r", "").replace("\\t", "\t")

    if not content.startswith("# Netscape HTTP Cookie File"):
        content = "# Netscape HTTP Cookie File\n" + content

    cookie_path = os.path.join(tempfile.gettempdir(), "yt_cookies.txt")
    with open(cookie_path, "w", encoding="utf-8") as f:
        f.write(content)
    return cookie_path
