import os

import httpx

from api.services.recognition.base import BaseRecognizer, RecognitionResult


class AudDRecognizer(BaseRecognizer):
    def __init__(self):
        self.api_token = os.environ.get("AUDD_API_TOKEN", "")

    def is_configured(self) -> bool:
        return bool(self.api_token) and not self.api_token.startswith("your_")

    async def recognize_chunk(
        self, audio_path: str, offset: float
    ) -> list[RecognitionResult]:
        try:
            with open(audio_path, "rb") as f:
                audio_data = f.read()

            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    "https://api.audd.io/",
                    data={
                        "api_token": self.api_token,
                        "return": "spotify,apple_music",
                    },
                    files={"file": ("audio.wav", audio_data, "audio/wav")},
                )
                response.raise_for_status()
                result = response.json()

                if result.get("status") != "success":
                    return []

                track = result.get("result")
                if not track:
                    return []

                title = track.get("title", "Unknown")
                artist = track.get("artist", "")

                return [
                    RecognitionResult(
                        title=title,
                        artist=artist,
                        confidence=75,
                        absolute_timestamp=offset,
                    )
                ]
        except Exception:
            return []
