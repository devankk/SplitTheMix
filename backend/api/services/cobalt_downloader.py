import asyncio
import logging
import os
import httpx

logger = logging.getLogger(__name__)

# List of known Cobalt API instances (community + custom)
DEFAULT_COBALT_INSTANCES = [
    os.environ.get("COBALT_API_URL"),
    "https://cobalt.api.scav.top",
    "https://api.cobalt.canine.tools",
    "https://cobalt-api.kwiatekm.tokyo",
    "https://cobalt.xy2401.com",
    "https://api.cobalt.tools",
]

class CobaltDownloader:
    """
    Open-source Cobalt REST API fallback audio extractor.
    Fetches direct high-speed audio streams without Google bot challenges or ad trackers.
    """
    def __init__(self, custom_api_url: str | None = None):
        self.api_urls = [u.rstrip("/") for u in ([custom_api_url] if custom_api_url else DEFAULT_COBALT_INSTANCES) if u]

    async def download_audio(self, url: str, output_path: str) -> bool:
        """
        Attempts to convert and stream YouTube audio via Cobalt instances.
        Returns True if successful and output_path has valid audio data.
        """
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "SplitTheMix/2.0 (Audio Tracklist Identifier)",
        }
        api_key = os.environ.get("COBALT_API_KEY")
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        payload = {
            "url": url,
            "downloadMode": "audio",
            "audioFormat": "mp3",
        }

        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            for base_url in self.api_urls:
                try:
                    logger.info(f"Attempting Cobalt audio extraction via {base_url}...")
                    # Cobalt v10+ uses / or /api/json
                    for endpoint in ["/", "/api/json"]:
                        target_url = f"{base_url}{endpoint}"
                        resp = await client.post(target_url, json=payload, headers=headers)
                        if resp.status_code != 200:
                            continue

                        data = resp.json()
                        stream_url = data.get("url")
                        status = data.get("status")

                        if status in ("tunnel", "redirect") and stream_url:
                            logger.info(f"Cobalt stream URL acquired from {base_url}, downloading audio...")
                            async with client.stream("GET", stream_url, timeout=180.0) as stream_resp:
                                if stream_resp.status_code == 200:
                                    with open(output_path, "wb") as f:
                                        async for chunk in stream_resp.aiter_bytes(chunk_size=65536):
                                            f.write(chunk)
                                    if os.path.exists(output_path) and os.path.getsize(output_path) > 10000:
                                        logger.info(f"Cobalt download successful ({os.path.getsize(output_path)} bytes)")
                                        return True
                except Exception as e:
                    logger.debug(f"Cobalt instance {base_url} failed: {e}")
                    continue

        return False
