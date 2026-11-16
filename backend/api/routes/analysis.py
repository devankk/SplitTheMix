from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import uuid
import json

from api.models.database import get_db, AnalysisJob, Track
from api.models.schemas import (
    AnalysisJobCreate,
    AnalysisJobResponse,
    TrackResponse,
    TrackUpdate,
    TrackCreate,
    PlatformLinks
)
from api.utils.youtube import extract_video_id, fetch_video_metadata
from api.utils.helpers import generate_platform_links
from api.jobs.queue import job_queue

router = APIRouter()

def _format_track_response(t: Track) -> TrackResponse:
    pl = None
    if t.platform_links:
        try:
            links = json.loads(t.platform_links)
            pl = PlatformLinks(**links)
        except Exception:
            pl = None
    return TrackResponse(
        id=t.id,
        job_id=t.job_id,
        title=t.title,
        artist=t.artist,
        start_time=t.start_time,
        end_time=t.end_time,
        duration=t.duration,
        confidence=t.confidence,
        platform_links=pl,
        is_identified=t.is_identified,
        edited_by_user=t.edited_by_user
    )

def _format_job_response(job: AnalysisJob) -> AnalysisJobResponse:
    tracks = sorted([_format_track_response(t) for t in job.tracks], key=lambda x: x.start_time)
    return AnalysisJobResponse(
        id=job.id,
        url=job.url,
        video_id=job.video_id,
        video_title=job.video_title,
        channel_name=job.channel_name,
        thumbnail_url=job.thumbnail_url,
        video_duration=job.video_duration,
        status=job.status,
        progress=job.progress,
        stage_message=job.stage_message,
        tracks_found=job.tracks_found,
        created_at=job.created_at,
        completed_at=job.completed_at,
        error_message=job.error_message,
        tracks=tracks
    )

@router.post("/analyze", response_model=AnalysisJobResponse)
async def analyze_mix(payload: AnalysisJobCreate, db: Session = Depends(get_db)):
    url = payload.url.strip()
    vid = extract_video_id(url)
    if not vid:
        raise HTTPException(status_code=422, detail="Invalid URL. Please provide a valid YouTube, SoundCloud, or Mixcloud link.")
    
    meta = fetch_video_metadata(vid, full_url=url)
    job_id = str(uuid.uuid4())
    job = AnalysisJob(
        id=job_id,
        url=url,
        video_id=vid,
        video_title=meta.get("video_title"),
        channel_name=meta.get("channel_name"),
        thumbnail_url=meta.get("thumbnail_url"),
        video_duration=meta.get("video_duration"),
        status="queued",
        progress=0,
        stage_message="Queued for analysis...",
        tracks_found=0,
        created_at=datetime.now(timezone.utc).isoformat(),
        error_message=None
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    await job_queue.enqueue(job_id, url)
    return _format_job_response(job)

@router.get("/analysis/{job_id}", response_model=AnalysisJobResponse)
def get_analysis_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Analysis job not found")
    return _format_job_response(job)

@router.patch("/tracks/{track_id}", response_model=TrackResponse)
def update_track(track_id: str, payload: TrackUpdate, db: Session = Depends(get_db)):
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    
    if payload.title is not None:
        track.title = payload.title
    if payload.artist is not None:
        track.artist = payload.artist
    if payload.start_time is not None:
        track.start_time = payload.start_time
    
    track.edited_by_user = True
    pl = generate_platform_links(track.title, track.artist)
    track.platform_links = json.dumps(pl)
    
    db.commit()
    db.refresh(track)
    return _format_track_response(track)

@router.post("/tracks", response_model=TrackResponse)
def add_manual_track(payload: TrackCreate, db: Session = Depends(get_db)):
    job = db.query(AnalysisJob).filter(AnalysisJob.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    pl = generate_platform_links(payload.title, payload.artist)
    track_id = str(uuid.uuid4())
    track = Track(
        id=track_id,
        job_id=payload.job_id,
        title=payload.title,
        artist=payload.artist,
        start_time=payload.start_time,
        end_time=None,
        duration=None,
        confidence=100,
        platform_links=json.dumps(pl),
        is_identified=True,
        edited_by_user=True
    )
    db.add(track)
    job.tracks_found = (job.tracks_found or 0) + 1
    db.commit()
    db.refresh(track)
    return _format_track_response(track)

@router.delete("/tracks/{track_id}")
def delete_track(track_id: str, db: Session = Depends(get_db)):
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    job = db.query(AnalysisJob).filter(AnalysisJob.id == track.job_id).first()
    if job and job.tracks_found > 0:
        job.tracks_found -= 1
    db.delete(track)
    db.commit()
    return {"success": True}
