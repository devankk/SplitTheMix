import re
import urllib.parse
import httpx
import logging
import asyncio

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}


def clean_title(title: str) -> str:
    if not title:
        return ""
    # Remove parenthetical extras like (feat. ...), [Remix], (From "..."), etc.
    t = re.sub(r'\(.*?\)|\[.*?\]', '', title)
    t = re.sub(r'[^a-zA-Z0-9\s]', ' ', t)
    return ' '.join(t.split())


async def fetch_apple_music_artwork(client: httpx.AsyncClient, query: str) -> str | None:
    """Fetch official 600x600 Apple Music cover art via official iTunes Search JSON API."""
    try:
        itunes_headers = {
            "User-Agent": "iTunes/12.11.3 (Windows; Microsoft Windows 10 x64)",
            "Accept": "application/json",
        }
        r = await client.get(
            "https://itunes.apple.com/search",
            params={"term": query, "entity": "song", "limit": 3},
            headers=itunes_headers,
            timeout=3.0
        )
        if r.status_code == 200:
            results = r.json().get("results", [])
            for res in results:
                art = res.get("artworkUrl100")
                if art:
                    # Upgrade to official 600x600 high-res
                    return art.replace("100x100bb.jpg", "600x600bb.jpg")
    except Exception:
        pass
    return None


async def fetch_cover_art(title: str, artist: str = "") -> str | None:
    """
    Fast, reliable cover art fetching using official iTunes API.
    Zero scraping, zero bot blocks.
    """
    if not title or title.lower() in ("unknown track", "unknown", "untitled"):
        return None

    c_title = clean_title(title) or title
    c_artist = clean_title(artist)

    queries = []
    if c_artist and c_artist.lower() not in ("unknown artist", "unknown", ""):
        queries.append(f"{c_artist} {c_title}".strip())
    queries.append(c_title.strip())

    try:
        async with httpx.AsyncClient(timeout=3.5, headers=HEADERS) as client:
            for q in queries:
                if not q:
                    continue
                art = await fetch_apple_music_artwork(client, q)
                if art:
                    return art
    except Exception as e:
        logger.debug(f"Cover art fetch error for {title}: {e}")

    return None
