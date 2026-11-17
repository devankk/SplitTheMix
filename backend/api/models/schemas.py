from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class PlatformLinks(BaseModel):
    spotify_search: str
    youtube_music_search: str
    apple_music_search: str
    soundcloud_search: Optional[str] = None
    mixcloud_search: Optional[str] = None


class TrackResponse(BaseModel):
    id: str
    job_id: str
    title: str
    artist: str
    start_time: float
    end_time: Optional[float] = None
    duration: Optional[float] = None
    confidence: int
    album_art: Optional[str] = None
    bpm: Optional[int | str] = None
    musical_key: Optional[str] = None
    release_year: Optional[str] = None
    label: Optional[str] = None
    platform_links: Optional[PlatformLinks] = None
    is_identified: bool
    edited_by_user: bool
    model_config = ConfigDict(from_attributes=True)


class AnalysisJobResponse(BaseModel):
    id: str
    url: str
    video_id: Optional[str] = None
    video_title: Optional[str] = None
    channel_name: Optional[str] = None
    thumbnail_url: Optional[str] = None
    video_duration: Optional[int] = None
    status: str
    progress: int
    stage_message: str
    tracks_found: int
    created_at: str
    completed_at: Optional[str] = None
    error_message: Optional[str] = None
    verification_url: Optional[str] = None
    verification_type: Optional[str] = None
    tracks: List[TrackResponse] = []
    model_config = ConfigDict(from_attributes=True)


class AnalysisJobCreate(BaseModel):
    url: str


class TrackUpdate(BaseModel):
    title: Optional[str] = None
    artist: Optional[str] = None
    start_time: Optional[float] = None
    album_art: Optional[str] = None
    bpm: Optional[int | str] = None
    musical_key: Optional[str] = None
    release_year: Optional[str] = None
    label: Optional[str] = None


class TrackCreate(BaseModel):
    job_id: str
    title: str
    artist: str
    start_time: float
    album_art: Optional[str] = None
    bpm: Optional[int | str] = None
    musical_key: Optional[str] = None
    release_year: Optional[str] = None
    label: Optional[str] = None
