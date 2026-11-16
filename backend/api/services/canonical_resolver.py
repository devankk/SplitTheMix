import re
import urllib.parse
import httpx
import logging

logger = logging.getLogger(__name__)

DJ_PATTERNS = [
    r'\bdj\b', r'\bdj\.', r'\bremix\b', r'\bbootleg\b', r'\bflip\b', r'\bclub mix\b',
    r'\btiktok\b', r'\bviral\b', r'\bking of bass\b', r'\blofi queen\b',
    r'\bmashup\b', r'\brework\b', r'\bedit\b', r'\bproducer\b', r'\bmixx\b',
    r'\bbass\b', r'\bparty\b'
]

# Instant canonical resolution for iconic anthems commonly ripped by bootleg DJs
FAMOUS_ORIGINALS = {
    "dark horse": ("Dark Horse", "Katy Perry"),
    "darkhorse": ("Dark Horse", "Katy Perry"),
    "trap queen": ("Trap Queen", "Fetty Wap"),
    "yeah!": ("Yeah!", "Usher"),
    "yeah": ("Yeah!", "Usher"),
    "glamorous": ("Glamorous", "Fergie"),
    "no pole": ("No Pole", "Don Toliver"),
    "fukumean": ("fukumean", "Gunna"),
    "all the way up": ("All the Way Up", "Fat Joe"),
    "satisfaction": ("Satisfaction", "Benny Benassi"),
    "where are ü now": ("Where Are Ü Now", "Jack Ü, Skrillex, Justin Bieber"),
    "knuck if you buck": ("Knuck If You Buck", "Crime Mob"),
    "mask off": ("Mask Off", "Future"),
    "lean wit it": ("Lean Wit It, Rock Wit It", "Dem Franchize Boyz"),
    "lean wit it, rock wit it": ("Lean Wit It, Rock Wit It", "Dem Franchize Boyz"),
    "laffy taffy": ("Laffy Taffy", "D4L"),
    "crank that": ("Crank That (Soulja Boy)", "Soulja Boy Tell'em"),
    "dilemma": ("Dilemma", "Nelly"),
    "aston martin music": ("Aston Martin Music", "Rick Ross"),
    "my humps": ("My Humps", "The Black Eyed Peas"),
    "get up": ("Get Up", "Ciara"),
    "hotline bling": ("Hotline Bling", "Drake"),
    "pour it up": ("Pour It Up", "Rihanna"),
    "die for you": ("Die For You", "The Weeknd"),
    "kiss kiss": ("Kiss Kiss", "Chris Brown"),
    "watch me": ("Watch Me (Whip / Nae Nae)", "Silento"),
    "sign of the times": ("Sign of the Times", "Harry Styles"),
    "forever": ("Forever", "Drake"),
    "can't tell me nothing": ("Can't Tell Me Nothing", "Kanye West"),
    "take a bow": ("Take A Bow", "Rihanna"),
}


def is_remix_or_dj(title: str, artist: str) -> bool:
    t_lower = (title or "").lower()
    a_lower = (artist or "").lower()
    for p in DJ_PATTERNS:
        if re.search(p, a_lower) or re.search(p, t_lower):
            return True
    return False


def clean_canonical_title(title: str) -> str:
    if not title:
        return ""
    t = re.sub(r'\(.*?(?:official|video|audio|lyrics|music video|prod\.|feat\.|ft\.|remix|bootleg|edit|mix|flip|vip|version|tribute).*?\)', '', title, flags=re.I)
    t = re.sub(r'\[.*?(?:official|video|audio|lyrics|music video|prod\.|feat\.|ft\.|remix|bootleg|edit|mix|flip|vip|version|tribute).*?\]', '', t, flags=re.I)
    t = re.sub(r'feat\..*|ft\..*', '', t, flags=re.I)
    t = re.sub(r'-\s*(?:remix|bootleg|edit|vip|mix|club).*', '', t, flags=re.I)
    t = re.sub(r'\b(?:remix|bootleg|club mix|extended mix|radio edit)\b', '', t, flags=re.I)
    return ' '.join(t.split()).strip()


async def resolve_original_track(title: str, artist: str) -> tuple[str, str]:
    """
    If the track is a remix, bootleg, or credited to a 3rd party DJ,
    resolves and returns (canonical_title, original_artist).
    """
    t_clean = clean_canonical_title(title).lower()
    if t_clean in FAMOUS_ORIGINALS:
        return FAMOUS_ORIGINALS[t_clean]
    title_lower = (title or "").lower().strip()
    if title_lower in FAMOUS_ORIGINALS:
        return FAMOUS_ORIGINALS[title_lower]

    if not is_remix_or_dj(title, artist):
        return title, artist

    c_title = clean_canonical_title(title)
    if not c_title:
        c_title = title

    # Also check if title is inside FAMOUS_ORIGINALS
    for k, v in FAMOUS_ORIGINALS.items():
        if k in c_title.lower() or c_title.lower() in k:
            return v

    # 1. Check if original artist name is inside the title string (e.g. "Usher - Yeah! (DJ Billa Remix)")
    if " - " in title:
        p0, p1 = title.split(" - ", 1)
        if not any(re.search(p, p0.lower()) for p in DJ_PATTERNS):
            return clean_canonical_title(p1) or c_title, p0.strip()

    # 2. Check featured artists (e.g. "DJ Billa ft. Usher")
    feat_match = re.search(r'(?:feat\.|ft\.|with)\s+([a-zA-Z0-9\s]+)', f"{artist} {title}", flags=re.I)
    if feat_match:
        cand_artist = feat_match.group(1).split(',')[0].strip()
        if not any(re.search(p, cand_artist.lower()) for p in DJ_PATTERNS):
            return c_title, cand_artist

    # 3. Look up canonical original song on YouTube Music
    try:
        search_q = f"{c_title} original song audio"
        url = f"https://www.youtube.com/results?search_query={urllib.parse.quote_plus(search_q)}"
        async with httpx.AsyncClient(timeout=4.5, headers={"User-Agent": "Mozilla/5.0"}) as client:
            r = await client.get(url)
            if r.status_code == 200:
                titles = re.findall(r'"title":\{"runs":\[\{"text":"([^"]+)"\}', r.text)
                for t in titles[:6]:
                    if " - " in t:
                        p_art, p_title = t.split(" - ", 1)
                        p_art = p_art.strip()
                        # Ensure candidate artist is not another DJ or compilation channel
                        if not any(re.search(p, p_art.lower()) for p in DJ_PATTERNS) and len(p_art) > 1:
                            clean_t = clean_canonical_title(p_title)
                            return clean_t if clean_t else c_title, p_art
    except Exception as e:
        logger.warning(f"Failed to resolve original track for {title} - {artist}: {e}")

    return c_title, artist
