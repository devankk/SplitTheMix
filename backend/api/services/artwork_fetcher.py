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
    t = re.sub(r'\(.*?\)|\[.*?\]', '', title)
    t = re.sub(r'[^a-zA-Z0-9\s]', ' ', t)
    return ' '.join(t.split())


async def fetch_spotify_artwork(client: httpx.AsyncClient, query: str) -> str | None:
    """Fetch official high-res Spotify cover art via search and oEmbed."""
    try:
        url = "https://html.duckduckgo.com/html/"
        params = {"q": f"spotify track {query}"}
        r = await client.get(url, params=params, headers=HEADERS)
        if r.status_code == 200:
            sp_ids = re.findall(r'open\.spotify\.com%2Ftrack%2F([a-zA-Z0-9]+)', r.text)
            if not sp_ids:
                sp_ids = re.findall(r'open\.spotify\.com/track/([a-zA-Z0-9]+)', r.text)
            if sp_ids:
                track_id = sp_ids[0]
                oembed_url = f"https://open.spotify.com/oembed?url=https://open.spotify.com/track/{track_id}"
                oe = await client.get(oembed_url, timeout=3.5)
                if oe.status_code == 200:
                    thumb = oe.json().get("thumbnail_url")
                    if thumb:
                        # Upgrade to 640x640 high-res
                        return thumb.replace("1e02", "b273")
    except Exception:
        pass
    return None


async def fetch_apple_music_artwork(client: httpx.AsyncClient, query: str) -> str | None:
    """Fetch official 600x600 Apple Music cover art via iTunes API."""
    try:
        itunes_headers = {
            "User-Agent": "iTunes/12.11.3 (Windows; Microsoft Windows 10 x64)"
        }
        r = await client.get(
            "https://itunes.apple.com/search",
            params={"term": query, "entity": "song", "limit": 1},
            headers=itunes_headers,
            timeout=3.5
        )
        if r.status_code == 200:
            results = r.json().get("results", [])
            if results and results[0].get("artworkUrl100"):
                return results[0]["artworkUrl100"].replace("100x100bb.jpg", "600x600bb.jpg")
    except Exception:
        pass
    return None


async def fetch_youtube_music_artwork(client: httpx.AsyncClient, query: str) -> str | None:
    """Fallback: Fetch YouTube Music audio thumbnail."""
    try:
        search_q = f"{query} official audio"
        r = await client.get(
            "https://www.youtube.com/results",
            params={"search_query": search_q},
            timeout=4.0
        )
        if r.status_code == 200:
            vids = re.findall(r'watch\?v=([a-zA-Z0-9_-]{11})', r.text)
            if vids:
                return f"https://i.ytimg.com/vi/{vids[0]}/hqdefault.jpg"
    except Exception:
        pass
    return None


async def fetch_cover_art(title: str, artist: str = "") -> str | None:
    """
    Prioritized cover art fetching as requested:
    Priority 1: Spotify
    Priority 2: Apple Music
    Priority 3: YouTube Music (only if not found on Spotify or Apple Music)
    """
    if not title or title.lower() == "unknown track":
        return None

    c_title = clean_title(title) or title
    c_artist = clean_title(artist)

    queries = []
    if c_artist:
        queries.append(f"{c_artist} {c_title}".strip())
    queries.append(c_title.strip())

    async with httpx.AsyncClient(timeout=4.5, headers=HEADERS) as client:
        # Priority 1: Check Spotify first
        for q in queries:
            if not q: continue
            art = await fetch_spotify_artwork(client, q)
            if art:
                return art

        # Priority 2: Check Apple Music
        for q in queries:
            if not q: continue
            art = await fetch_apple_music_artwork(client, q)
            if art:
                return art

        # Priority 3: Fall back to YouTube Music only if Spotify/Apple Music have no cover
        for q in queries:
            if not q: continue
            art = await fetch_youtube_music_artwork(client, q)
            if art:
                return art

    return None
