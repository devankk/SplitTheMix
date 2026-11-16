import asyncio
from dataclasses import dataclass


@dataclass
class JobItem:
    job_id: str
    url: str


class JobQueue:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.queue = asyncio.Queue()
        return cls._instance

    async def enqueue(self, job_id: str, url: str):
        await self.queue.put(JobItem(job_id=job_id, url=url))

    async def dequeue(self) -> JobItem:
        return await self.queue.get()

    def task_done(self):
        self.queue.task_done()


job_queue = JobQueue()
