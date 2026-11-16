import asyncio
import logging
import os

from api.jobs.queue import job_queue
from api.models.database import SessionLocal
from api.services.audio_processor import AudioProcessor

logger = logging.getLogger(__name__)
processor = AudioProcessor()

# Concurrently process multiple mixes in parallel (configurable via CONCURRENT_WORKERS)
NUM_WORKERS = int(os.environ.get("CONCURRENT_WORKERS", 3))


async def worker_loop(worker_id: int):
    logger.info(f"Worker #{worker_id} ready for jobs")
    while True:
        try:
            item = await job_queue.dequeue()
            logger.info(f"Worker #{worker_id} started job {item.job_id}")
            db = SessionLocal()
            try:
                await processor.process_mix(item.job_id, item.url, db)
            except Exception as e:
                logger.error(f"Worker #{worker_id} failed on job {item.job_id}: {e}")
            finally:
                db.close()
                job_queue.task_done()
        except asyncio.CancelledError:
            logger.info(f"Worker #{worker_id} shutting down")
            break
        except Exception as e:
            logger.error(f"Worker #{worker_id} error: {e}")
            await asyncio.sleep(1)


async def run_worker():
    logger.info(f"Spawning parallel worker pool: {NUM_WORKERS} concurrent processing slots active")
    tasks = [asyncio.create_task(worker_loop(i)) for i in range(1, NUM_WORKERS + 1)]
    await asyncio.gather(*tasks)
