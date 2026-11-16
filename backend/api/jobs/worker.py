import asyncio
import logging

from api.jobs.queue import job_queue
from api.models.database import SessionLocal
from api.services.audio_processor import AudioProcessor

logger = logging.getLogger(__name__)
processor = AudioProcessor()


async def run_worker():
    logger.info("Job worker started")
    while True:
        try:
            item = await job_queue.dequeue()
            db = SessionLocal()
            try:
                await processor.process_mix(item.job_id, item.url, db)
            except Exception as e:
                logger.error(f"Job {item.job_id} failed: {e}")
            finally:
                db.close()
                job_queue.task_done()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Worker error: {e}")
            await asyncio.sleep(1)
