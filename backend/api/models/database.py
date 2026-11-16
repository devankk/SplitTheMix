from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base, relationship

DATABASE_URL = "sqlite:///./djmix.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"

    id = Column(String, primary_key=True)
    url = Column(String, nullable=False)
    video_id = Column(String, nullable=True)
    video_title = Column(String, nullable=True)
    channel_name = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    video_duration = Column(Integer, nullable=True)
    status = Column(String, nullable=False, default="queued")
    progress = Column(Integer, default=0)
    stage_message = Column(String, default="Waiting to start…")
    tracks_found = Column(Integer, default=0)
    created_at = Column(String, nullable=False)
    completed_at = Column(String, nullable=True)
    error_message = Column(String, nullable=True)
    tracks = relationship("Track", back_populates="job", cascade="all, delete-orphan")


class Track(Base):
    __tablename__ = "tracks"

    id = Column(String, primary_key=True)
    job_id = Column(String, ForeignKey("analysis_jobs.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    artist = Column(String, nullable=False, default="")
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=True)
    duration = Column(Float, nullable=True)
    confidence = Column(Integer, default=0)
    platform_links = Column(String, nullable=True)  # JSON string
    is_identified = Column(Boolean, default=True)
    edited_by_user = Column(Boolean, default=False)
    job = relationship("AnalysisJob", back_populates="tracks")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
