import asyncio
import base64
import hashlib
import hmac
import os
import time

import httpx

from api.services.recognition.base import BaseRecognizer, RecognitionResult

MAX_RETRIES = 3


class ACRCloudRecognizer(BaseRecognizer):
    def __init__(self):
        self.host = os.environ.get("ACRCLOUD_HOST", "")
        self.access_key = os.environ.get("ACRCLOUD_ACCESS_KEY", "")
        self.secret_key = os.environ.get("ACRCLOUD_SECRET_KEY", "")

    def is_configured(self) -> bool:
        return (
            bool(self.host)
            and bool(self.access_key)
            and bool(self.secret_key)
            and not self.access_key.startswith("your_")
            and not self.secret_key.startswith("your_")
        )

    def _build_signature(self, timestamp: str) -> str:
        string_to_sign = (
            f"POST\n/v1/identify\n{self.access_key}\naudio\n1\n{timestamp}"
        )
        secret_bytes = self.secret_key.encode("utf-8")
        sign_bytes = string_to_sign.encode("utf-8")
        signature = base64.b64encode(
            hmac.new(secret_bytes, sign_bytes, hashlib.sha1).digest()
        ).decode("utf-8")
        return signature

    async def recognize_chunk(
        self, audio_path: str, offset: float
    ) -> list[RecognitionResult]:
        try:
            with open(audio_path, "rb") as f:
                audio_data = f.read()
        except Exception:
            return []

        timestamp = str(int(time.time()))
        signature = self._build_signature(timestamp)

        url = f"https://{self.host}/v1/identify"
        files = {
            "sample": ("audio.wav", audio_data, "audio/wav"),
        }
        data = {
            "access_key": self.access_key,
            "sample_bytes": str(len(audio_data)),
            "timestamp": timestamp,
            "signature": signature,
            "data_type": "audio",
            "signature_version": "1",
        }

        for attempt in range(MAX_RETRIES):
            try:
                async with httpx.AsyncClient(timeout=30) as client:
                    response = await client.post(url, data=data, files=files)
                    response.raise_for_status()
                    result = response.json()

                    status = result.get("status", {})
                    if status.get("code") != 0:
                        return []

                    metadata = result.get("metadata", {})
                    music_list = metadata.get("music", [])
                    results = []
                    for item in music_list:
                        title = item.get("title", "Unknown")
                        artists = item.get("artists", [])
                        artist = artists[0].get("name", "") if artists else ""
                        score = item.get("score", 0)
                        confidence = min(100, max(0, int(float(score))))
                        
                        # Extract rich metadata from ACRCloud
                        release_date = item.get("release_date", "")
                        release_year = release_date[:4] if release_date else None
                        label = item.get("label") or item.get("album", {}).get("name")
                        bpm_raw = item.get("bpm") or item.get("tempo")
                        bpm = int(float(bpm_raw)) if bpm_raw else None
                        key = item.get("key")

                        results.append(
                            RecognitionResult(
                                title=title,
                                artist=artist,
                                confidence=confidence,
                                absolute_timestamp=offset,
                                bpm=bpm,
                                musical_key=key,
                                release_year=release_year,
                                label=label,
                            )
                        )
                    return results

            except httpx.TimeoutException:
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(2)
                continue
            except Exception:
                return []

        return []
