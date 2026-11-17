import asyncio
import logging
import os
import itertools
import uuid
import httpx
from shazamio import Shazam
from shazamio.converter import Converter
from shazamio.misc import ShazamUrl, Device
from api.services.recognition.base import BaseRecognizer, RecognitionResult

from shazamio.client import HTTPClient
from aiohttp_retry import ExponentialRetry

logger = logging.getLogger(__name__)

OFFICIAL_HEADERS = [
    {
        "X-Shazam-Platform": "IPHONE",
        "X-Shazam-AppVersion": "15.3.0",
        "User-Agent": "Shazam/15.3.0 (iPhone; iOS 16.5; Scale/3.00)",
        "Accept": "*/*",
        "Accept-Language": "en-US",
    },
    {
        "X-Shazam-Platform": "IPHONE",
        "X-Shazam-AppVersion": "15.0.0",
        "User-Agent": "Shazam/15.0.0 (iPhone; iOS 15.4; Scale/3.00)",
        "Accept": "*/*",
        "Accept-Language": "en-US",
    },
    {
        "X-Shazam-Platform": "IPHONE",
        "X-Shazam-AppVersion": "15.5.0",
        "User-Agent": "Shazam/15.5.0 (iPhone; iOS 17.0; Scale/3.00)",
        "Accept": "*/*",
        "Accept-Language": "en-US",
    }
]


class OfficialShazam(Shazam):
    """Shazam client using verified official modern iOS headers and instant retry policy."""
    def __init__(self, *args, **kwargs):
        if "endpoint_country" not in kwargs:
            kwargs["endpoint_country"] = "US"
        super().__init__(*args, **kwargs)
        self._hdr_cycle = itertools.cycle(OFFICIAL_HEADERS)

    def headers(self) -> dict:
        return next(self._hdr_cycle)


class ShazamRecognizer(BaseRecognizer):
    def __init__(self):
        retry = ExponentialRetry(attempts=1, max_timeout=2.0, statuses={500, 502, 503, 504})
        http_client = HTTPClient(retry_options=retry)
        self.shazam = OfficialShazam(http_client=http_client)
        raw_proxies = os.environ.get("SHAZAM_PROXY") or ""
        self.proxies = [p.strip() for p in raw_proxies.split(",") if p.strip() and not p.startswith("your_")]

        # Also load bundled high-speed rotating proxy pool if available
        bundle_path = os.path.join(os.path.dirname(__file__), "proxies.txt")
        if os.path.exists(bundle_path):
            try:
                with open(bundle_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and line.startswith("http") and line not in self.proxies:
                            self.proxies.append(line)
            except Exception as e:
                logger.debug(f"Could not load bundled proxies: {e}")

        self.dead_proxies = set()
        pool = [p for p in self.proxies if p not in self.dead_proxies] or [None]
        self._proxy_cycle = itertools.cycle(pool)

    def is_configured(self) -> bool:
        return True

    def _get_proxy(self) -> str | None:
        active = [p for p in self.proxies if p not in self.dead_proxies]
        if not active:
            return None
        return next(self._proxy_cycle)

    async def recognize_chunk(self, audio_path: str, offset: float) -> list[RecognitionResult]:
        candidates = []
        for _ in range(min(4, len(self.proxies) or 1)):
            p = self._get_proxy()
            if p and p not in candidates:
                candidates.append(p)
        # Always include direct connection as candidate
        if None not in candidates:
            candidates.append(None)

        for proxy in candidates:
            try:
                out = await asyncio.wait_for(
                    self.shazam.recognize(audio_path, proxy=proxy),
                    timeout=4.0
                )
                track = out.get("track")
                if not track:
                    return []

                title = track.get("title", "Unknown Track")
                artist = track.get("subtitle", "Unknown Artist")
                images = track.get("images", {})
                album_art = images.get("coverarthq") or images.get("coverart")

                matches = out.get("matches", [])
                match_offset = None
                if matches and isinstance(matches, list) and len(matches) > 0:
                    try:
                        match_offset = float(matches[0].get("offset", 0.0))
                    except (ValueError, TypeError):
                        match_offset = None

                return [
                    RecognitionResult(
                        title=title,
                        artist=artist,
                        confidence=95,
                        absolute_timestamp=offset,
                        album_art=album_art,
                        match_offset=match_offset
                    )
                ]
            except Exception as e:
                err_str = str(e)
                if proxy and ("402" in err_str or "407" in err_str or "429" in err_str or "Payment Required" in err_str or "RateLimited" in err_str or "Timeout" in err_str):
                    logger.debug(f"Evicting failed proxy {proxy}: {e}")
                    self.dead_proxies.add(proxy)
                    active = [p for p in self.proxies if p not in self.dead_proxies]
                    if active:
                        self._proxy_cycle = itertools.cycle(active)
                else:
                    logger.debug(f"Shazam recognition error (proxy={proxy}) for {audio_path}: {e}")
                continue

        return []
