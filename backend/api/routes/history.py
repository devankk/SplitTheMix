from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from api.models.database import get_db, AnalysisJob
from api.models.schemas import AnalysisJobResponse

router = APIRouter()

@router.get("/history", response_model=List[AnalysisJobResponse])
def get_history(db: Session = Depends(get_db)):
    jobs = db.query(AnalysisJob).order_by(AnalysisJob.created_at.desc()).limit(50).all()
    res = []
    for job in jobs:
        res.append(AnalysisJobResponse(
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
            tracks=[]
        ))
    return res

@router.delete("/history/{job_id}")
def delete_history_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
    return {"success": True}
