import asyncio
import logging
from shazamio import Shazam
from api.services.recognition.base import BaseRecognizer, RecognitionResult

logger = logging.getLogger(__name__)

class ShazamRecognizer(BaseRecognizer):
    def __init__(self):
        self.shazam = Shazam()

    def is_configured(self) -> bool:
        return True

    async def recognize_chunk(self, audio_path: str, offset: float) -> list[RecognitionResult]:
        try:
            # 5-second hard ceiling per chunk so no request can freeze the queue
            out = await asyncio.wait_for(self.shazam.recognize(audio_path), timeout=5.0)
            track = out.get("track")
            if not track:
                return []
            
            title = track.get("title", "Unknown Track")
            artist = track.get("subtitle", "Unknown Artist")
            
            return [
                RecognitionResult(
                    title=title,
                    artist=artist,
                    confidence=95,
                    absolute_timestamp=offset
                )
            ]
        except asyncio.TimeoutError:
            logger.warning(f"Shazam timeout on chunk {audio_path}")
            return []
        except Exception as e:
            logger.debug(f"Shazam recognition error for {audio_path}: {e}")
            return []
