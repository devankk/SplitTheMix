from dataclasses import dataclass
from abc import ABC, abstractmethod


@dataclass
class RecognitionResult:
    title: str
    artist: str
    confidence: int            # 0–100
    absolute_timestamp: float  # seconds from video start


class BaseRecognizer(ABC):
    @abstractmethod
    async def recognize_chunk(self, audio_path: str, offset: float) -> list[RecognitionResult]:
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        pass
