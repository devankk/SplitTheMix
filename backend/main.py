from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import os
import logging

from api.models.database import init_db
from api.routes import health, analysis, history
from api.jobs.worker import run_worker

logging.basicConfig(level=logging.INFO)
app = FastAPI(title="DJ Mix Tracklist Identifier", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:5173"), "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    init_db()
    asyncio.create_task(run_worker())

app.include_router(health.router)
app.include_router(analysis.router, prefix="/api")
app.include_router(history.router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("BACKEND_PORT", 8000)), reload=True)
