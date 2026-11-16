---
name: dj-audio-recognition
description: >-
  Comprehensive skill for building an AI-powered DJ Mix Tracklist Identification
  platform. Covers audio fingerprinting, music recognition API integration,
  timestamp preservation, DJ transition handling, chunk-based processing, and
  full-stack implementation guidance for the Music Identifier project.
metadata:
  icon: music_note
  version: "1.0.0"
  project: DJ Mix Tracklist Identifier
  workspace: "d:/New folder (5)/Music Identifier"
---

# DJ Audio Recognition Skill

This skill provides authoritative instructions for every agent working on the
**DJ Mix Tracklist Identifier** project. Load and follow these instructions
whenever you work on audio processing, music recognition, timestamp logic,
or API integration for this platform.

---

## 1. Project Overview

**Goal:** A web application that accepts a YouTube DJ mix URL, downloads the
audio, splits it into overlapping chunks, sends each chunk to music recognition
APIs, deduplicates and merges the results, and returns a chronological
timestamped tracklist.

**Root directory:** `d:/New folder (5)/Music Identifier/`

```
Music Identifier/
├── backend/          # Python 3.14 + FastAPI
├── frontend/         # React 18 + TypeScript + Vite + Tailwind CSS
├── .agents/
│   └── skills/
│       └── dj-audio-recognition/
│           └── SKILL.md   ← this file
├── .env.example
├── README.md
└── start.bat
```

---

## 2. Environment Inventory

| Tool | Version | Location | Status |
|------|---------|----------|--------|
| Node.js | v26.13.0 | `C:\Program Files\nodejs\node.exe` | ✅ Installed |
| npm | 11.20.0 | via `cmd /c npm` (not PowerShell) | ✅ Installed |
| Python | 3.14.7 | `C:\Users\LUCIFER\AppData\Local\Programs\Python\Python314\python.exe` | ✅ Installed |
| pip | 26.2.1 | bundled with Python 3.14 | ✅ Installed |
| FFmpeg | N-128433 (Nov 2026) | `D:\ffmpeg-master-latest-win64-gpl\...\bin\ffmpeg.exe` | ✅ Installed |
| ffprobe | Same build | `D:\ffmpeg-master-latest-win64-gpl\...\bin\ffprobe.exe` | ✅ Installed |
| Git | 2.56.0 | System PATH | ✅ Installed |
| VS Code | 1.145.2 | Local install | ✅ Installed |
| yt-dlp | — | **NOT installed** | ❌ Needs install |

> [!WARNING]
> **PowerShell execution policy is Restricted** for npm/npx `.ps1` scripts.
> Always invoke `npm`, `npx`, `pip`, and `python` via `cmd /c "..."` in
> all agent commands, never bare PowerShell. This is mandatory for every
> run_command call in this project.

> [!IMPORTANT]
> Python 3.14 is a **pre-release build** (released Aug 2026). Some older
> C-extension packages may not have wheels for 3.14 yet. Prefer pure-Python
> alternatives where possible. If a package fails to build, pin to the
> highest compatible version or find a pure-Python fork.

---

## 3. Technology Stack

### 3.1 Backend

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **FastAPI 0.115+** | Async-native, auto-docs, Pydantic v2 |
| Server | **Uvicorn** | ASGI, production-grade |
| ORM | **SQLAlchemy 2.x** (async) | Works with SQLite for MVP |
| Database | **SQLite** (`djmix.db`) | No external service needed locally |
| Job queue | **asyncio.Queue** | No Redis needed for MVP |
| Audio download | **yt-dlp** (Python library) | Most reliable YT downloader |
| Audio splitting | **pydub** + **FFmpeg** | Chunk-based splitting |
| HTTP calls | **httpx** (async) | For recognition API calls |
| Config | **python-dotenv** | `.env` file support |

### 3.2 Frontend

| Layer | Choice |
|-------|--------|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5+ |
| Styling | Tailwind CSS v3 |
| State | Zustand |
| Data fetching | TanStack Query (React Query v5) |
| HTTP | Axios |
| Icons | Lucide React |
| Animation | Framer Motion |
| Routing | React Router v6 |

### 3.3 Music Recognition APIs

| Provider | Method | Free Tier | Best For |
|----------|--------|-----------|---------|
| **ACRCloud** | REST (HMAC-SHA1 signed) | 1,000 req/day | Primary - best accuracy |
| **AudD** | REST (token) | 300 req/day | Secondary / fallback |
| **AcoustID / MusicBrainz** | REST (fingerprint) | Unlimited | Open-source fallback |

> [!NOTE]
> Both ACRCloud and AudD require free account registration to get API keys.
> Neither installs locally — they are cloud REST services.
> Keys go in `.env`, never in source code or frontend.

---

## 4. Audio Processing Architecture

### 4.1 Core Constants

```python
CHUNK_DURATION_SEC   = 30   # each processing window
CHUNK_OVERLAP_SEC    = 5    # overlap to catch songs at boundaries
SAMPLE_DURATION_SEC  = 10   # snippet sent to recognition API
SAMPLE_OFFSET_SEC    = 10   # start sampling 10s into chunk (avoid fade-in)
MERGE_WINDOW_SEC     = 15   # deduplicate results within this window
MIN_SONG_GAP_SEC     = 60   # insert "Unknown Track" for gaps larger than this
```

### 4.2 Processing Pipeline

```
YouTube URL
    │
    ▼
[1] VALIDATE URL
    │  extract_video_id() → video_id
    │  Supported: youtube.com/watch?v=, youtu.be/, /shorts/
    │
    ▼
[2] FETCH METADATA (yt-dlp --dump-json --no-download)
    │  → title, channel, thumbnail_url, duration_seconds
    │
    ▼
[3] DOWNLOAD AUDIO (yt-dlp)
    │  Format: bestaudio → MP3 128kbps via FFmpeg postprocessor
    │  Command args: ['-x', '--audio-format', 'mp3', '--audio-quality', '5',
    │                 '--ffmpeg-location', FFMPEG_PATH, '-o', tmp_path]
    │  Write to: tempfile.mkdtemp() — cleaned up after job completes
    │
    ▼
[4] SPLIT INTO CHUNKS (pydub)
    │  Load MP3 → AudioSegment
    │  chunk_start = 0
    │  while chunk_start < total_duration:
    │      chunk_end = min(chunk_start + CHUNK_DURATION_SEC, total_duration)
    │      chunk = audio[chunk_start*1000 : chunk_end*1000]  # pydub uses ms
    │      export chunk as WAV (better quality for fingerprinting)
    │      record (chunk_path, chunk_start_offset_seconds)
    │      chunk_start += (CHUNK_DURATION_SEC - CHUNK_OVERLAP_SEC)
    │
    ▼
[5] RECOGNIZE EACH CHUNK
    │  For each (chunk_path, offset):
    │      sample = chunk[SAMPLE_OFFSET_SEC*1000 : (SAMPLE_OFFSET_SEC+SAMPLE_DURATION_SEC)*1000]
    │      results = await acrcloud.recognize(sample_path)
    │      if not results:
    │          results = await audd.recognize(sample_path)
    │      for r in results:
    │          r.absolute_timestamp = offset + SAMPLE_OFFSET_SEC + r.start_offset
    │
    ▼
[6] DEDUPLICATE & MERGE
    │  Sort all results by absolute_timestamp
    │  Group: same (title.lower(), artist.lower()) within MERGE_WINDOW_SEC
    │  Keep the highest-confidence instance per group
    │  Remove entries where confidence < 30 (unreliable)
    │
    ▼
[7] GAP ANALYSIS
    │  For each gap between consecutive tracks > MIN_SONG_GAP_SEC:
    │      Insert Track(title="Unknown Track", artist="", is_identified=False)
    │      at the midpoint of the gap
    │
    ▼
[8] BUILD FINAL TRACKLIST
    │  For each track:
    │      end_time = next_track.start_time (or None for last track)
    │      duration = end_time - start_time (if calculable)
    │      platform_links = generate_platform_links(title, artist)
    │      Save to DB
    │
    ▼
[9] UPDATE JOB STATUS → "completed"
    │  cleanup temp directory
```

### 4.3 FFmpeg Path Handling

FFmpeg is at: `D:\ffmpeg-master-latest-win64-gpl\ffmpeg-master-latest-win64-gpl\bin\`

```python
# In .env.example and backend settings:
FFMPEG_PATH=D:\ffmpeg-master-latest-win64-gpl\ffmpeg-master-latest-win64-gpl\bin\ffmpeg.exe
FFPROBE_PATH=D:\ffmpeg-master-latest-win64-gpl\ffmpeg-master-latest-win64-gpl\bin\ffprobe.exe

# In audio_processor.py, pass to pydub:
from pydub import AudioSegment
AudioSegment.converter = os.environ.get("FFMPEG_PATH", "ffmpeg")
AudioSegment.ffprobe   = os.environ.get("FFPROBE_PATH", "ffprobe")

# Pass to yt-dlp:
ydl_opts = {
    'ffmpeg_location': os.path.dirname(os.environ.get("FFMPEG_PATH", "")),
    ...
}
```

---

## 5. ACRCloud Integration

### 5.1 Required Environment Variables

```env
ACRCLOUD_HOST=identify-eu-west-1.acrcloud.com   # your region endpoint
ACRCLOUD_ACCESS_KEY=your_access_key_here
ACRCLOUD_SECRET_KEY=your_secret_key_here
```

### 5.2 Signature Algorithm

```python
import hmac, hashlib, base64, time

def build_acrcloud_signature(access_key: str, secret_key: str) -> tuple[str, str]:
    timestamp = str(int(time.time()))
    string_to_sign = "\n".join([
        "POST",
        "/v1/identify",
        access_key,
        "audio",
        "1",
        timestamp
    ])
    signature = base64.b64encode(
        hmac.new(
            secret_key.encode('ascii'),
            string_to_sign.encode('ascii'),
            digestmod=hashlib.sha1
        ).digest()
    ).decode('ascii')
    return signature, timestamp
```

### 5.3 Request Format

```python
import httpx

async def recognize(self, audio_path: str, offset: float) -> list[RecognitionResult]:
    sig, ts = build_acrcloud_signature(self.access_key, self.secret_key)
    with open(audio_path, 'rb') as f:
        audio_data = f.read()
    
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"https://{self.host}/v1/identify",
            data={
                "access_key": self.access_key,
                "sample_bytes": str(len(audio_data)),
                "timestamp": ts,
                "signature": sig,
                "data_type": "audio",
                "signature_version": "1",
            },
            files={"sample": ("sample.wav", audio_data, "audio/wav")},
        )
    
    data = resp.json()
    if data.get("status", {}).get("code") != 0:
        return []
    
    results = []
    for music in data.get("metadata", {}).get("music", []):
        results.append(RecognitionResult(
            title=music.get("title", "Unknown"),
            artist=music.get("artists", [{}])[0].get("name", "Unknown"),
            confidence=min(100, int(music.get("score", 75))),
            absolute_timestamp=offset,
        ))
    return results
```

### 5.4 ACRCloud Rate Limits

- Free tier: **1,000 recognitions/day**
- A 2-hour mix at 30s chunks with 5s overlap = ~214 chunks → well within free tier
- Each chunk makes **1 API call** to ACRCloud

---

## 6. AudD Integration (Fallback)

### 6.1 Required Environment Variables

```env
AUDD_API_TOKEN=your_audd_token_here
```

### 6.2 Request Format

```python
async def recognize(self, audio_path: str, offset: float) -> list[RecognitionResult]:
    with open(audio_path, 'rb') as f:
        audio_data = f.read()
    
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.audd.io/",
            data={"api_token": self.token, "return": "spotify,apple_music"},
            files={"file": ("sample.wav", audio_data, "audio/wav")},
        )
    
    data = resp.json()
    if data.get("status") != "success" or not data.get("result"):
        return []
    
    r = data["result"]
    return [RecognitionResult(
        title=r.get("title", "Unknown"),
        artist=r.get("artist", "Unknown"),
        confidence=75,          # AudD doesn't return a score
        absolute_timestamp=offset,
    )]
```

### 6.3 AudD Free Tier

- **300 recognitions/day** without a subscription
- Use only as fallback when ACRCloud returns no match

---

## 7. DJ Transition Handling

DJ mixes contain specific challenges that require special handling:

### 7.1 Crossfades
Two songs play simultaneously during transition. The recognition API may return
either song or both. **Handle this by:**
- Accepting multiple results per chunk
- Keeping results with confidence > 50
- Deduplicating by (title, artist) within MERGE_WINDOW_SEC

### 7.2 Beatmatching / Extended Outros
The same song may play for 8+ minutes in a mix. **Handle this by:**
- Deduplication window that considers song repetition
- If the same (title, artist) appears more than 3 times consecutively in
  adjacent chunks, collapse to a single track entry

### 7.3 Mashups
Two tracks play permanently overlaid. Recognition will typically identify
the more dominant melody. **Handle this by:**
- Flagging confidence below 60 as "possibly mashed"
- Not inventing the second track name

### 7.4 Key/Tempo-shifted Tracks
DJ tools shift pitch/tempo which can confuse fingerprinting. ACRCloud's
fingerprinting is robust to ±3 semitones and ±6% BPM shift.

### 7.5 Chunk Boundary Safety
With a 5-second overlap, songs that start in the last 5s of chunk N will
also appear in the first 5s of chunk N+1. The deduplication window handles this:
any match within 15 seconds of a previous identical match is merged.

---

## 8. Timestamp Preservation Rules

These rules are critical — never violate them:

1. **Absolute timestamp = chunk_start_offset + SAMPLE_OFFSET_SEC**
   - Every result stored in DB uses seconds from the beginning of the YouTube video
   - Never store chunk-relative timestamps

2. **Frontend displays timestamps as `MM:SS` or `H:MM:SS`**
   - Use `format_timestamp(seconds: float) → str` utility function
   - For videos < 1 hour: `MM:SS`
   - For videos ≥ 1 hour: `H:MM:SS`

3. **YouTube deep-link formula:**
   ```
   https://www.youtube.com/watch?v={video_id}&t={start_time_seconds}s
   ```
   This opens the video at the exact timestamp in a new tab.

4. **YouTube embed seek formula (for embedded player):**
   ```
   https://www.youtube.com/embed/{video_id}?start={start_time_seconds}&autoplay=1
   ```

5. **Timestamps must be preserved across manual edits.** When a user edits
   a track's artist or title, the start_time is NOT changed unless they
   explicitly update it.

---

## 9. Database Schema

```sql
-- AnalysisJob table
CREATE TABLE analysis_jobs (
    id              TEXT PRIMARY KEY,   -- UUID
    url             TEXT NOT NULL,
    video_id        TEXT,
    video_title     TEXT,
    channel_name    TEXT,
    thumbnail_url   TEXT,
    video_duration  INTEGER,            -- seconds
    status          TEXT NOT NULL,      -- queued|downloading|processing|completed|failed
    progress        INTEGER DEFAULT 0,  -- 0–100
    stage_message   TEXT DEFAULT '',
    tracks_found    INTEGER DEFAULT 0,
    created_at      TEXT NOT NULL,      -- ISO 8601
    completed_at    TEXT,
    error_message   TEXT
);

-- Track table
CREATE TABLE tracks (
    id              TEXT PRIMARY KEY,   -- UUID
    job_id          TEXT NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    artist          TEXT NOT NULL DEFAULT '',
    start_time      REAL NOT NULL,      -- seconds (float)
    end_time        REAL,               -- seconds (float), nullable
    duration        REAL,               -- seconds (float), nullable
    confidence      INTEGER DEFAULT 0,  -- 0–100
    platform_links  TEXT,               -- JSON string
    is_identified   INTEGER DEFAULT 1,  -- boolean (0/1)
    edited_by_user  INTEGER DEFAULT 0   -- boolean (0/1)
);
```

---

## 10. API Contract

All endpoints return JSON. Errors use standard HTTP status codes.

```
POST   /api/analyze              → { job_id, status, ... }
GET    /api/analysis/{job_id}    → AnalysisJobResponse (with tracks)
GET    /api/history              → list[AnalysisJobResponse] (no tracks)
DELETE /api/history/{job_id}     → { success: true }
PATCH  /api/tracks/{track_id}    → TrackResponse (updated)
POST   /api/tracks               → TrackResponse (new manual track)
DELETE /api/tracks/{track_id}    → { success: true }
GET    /health                   → { status: "ok" }
```

**Progress polling:** Frontend polls `GET /api/analysis/{job_id}` every 2 seconds
while `status` is `queued`, `downloading`, or `processing`.

---

## 11. Frontend Architecture

### 11.1 Pages

| Route | Page | Purpose |
|-------|------|---------|
| `/` | HomePage | URL input, hero section, feature list |
| `/analysis/:jobId` | AnalysisPage | Live progress + tracklist |
| `/history` | HistoryPage | Past analyses |

### 11.2 Key Components

```
src/components/
├── Layout/
│   ├── Navbar.tsx          — logo, theme toggle, history link
│   └── Footer.tsx
├── URLInput/
│   └── URLInput.tsx        — YouTube URL field + Analyse button
├── VideoPreview/
│   └── VideoPreview.tsx    — thumbnail, title, channel, duration
├── ProgressTracker/
│   └── ProgressTracker.tsx — progress bar, stage message, song count
├── TrackList/
│   └── TrackList.tsx       — ordered list of TrackCards + search/filter
├── TrackCard/
│   └── TrackCard.tsx       — individual song row with timestamp button
├── TimestampButton/
│   └── TimestampButton.tsx — clickable MM:SS, opens YouTube at that time
├── ExportPanel/
│   └── ExportPanel.tsx     — TXT/CSV export, copy full tracklist
├── SearchFilter/
│   └── SearchFilter.tsx    — search by song/artist, filter, sort
└── EditTrackModal/
    └── EditTrackModal.tsx  — edit title, artist, timestamp; delete track
```

### 11.3 Polling Logic

```typescript
// In useAnalysis.ts
const { data } = useQuery({
  queryKey: ['analysis', jobId],
  queryFn: () => api.getAnalysis(jobId),
  refetchInterval: (data) => {
    const terminal = ['completed', 'failed'];
    if (!data || terminal.includes(data.status)) return false;
    return 2000; // poll every 2 seconds while processing
  },
});
```

### 11.4 YouTube Timestamp Navigation

```typescript
// TimestampButton.tsx
const openAtTimestamp = (videoId: string, startTime: number) => {
  const url = `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(startTime)}s`;
  window.open(url, '_blank', 'noopener,noreferrer');
};
```

### 11.5 Export Formats

**TXT export:**
```
DJ Mix Tracklist - [Video Title]
Analysed by DJ Mix Identifier
---
00:00 - Song Title - Artist Name
04:32 - Song Title - Artist Name
...
```

**CSV export:**
```csv
#,Start Time,End Time,Title,Artist,Confidence,Identified
1,00:00,04:32,Song Title,Artist Name,87,Yes
```

---

## 12. Required Python Dependencies

Install via: `cmd /c "pip install <package>"`

```
fastapi>=0.115.0
uvicorn[standard]>=0.32.0
sqlalchemy>=2.0.0
pydantic>=2.10.0
python-dotenv>=1.0.0
yt-dlp>=2024.11.0
pydub>=0.25.1
httpx>=0.28.0
aiofiles>=24.1.0
python-multipart>=0.0.20
```

> [!IMPORTANT]
> **Do not install Redis, Celery, or PostgreSQL** for this project.
> The MVP uses SQLite + asyncio.Queue which requires zero external services.
> This keeps setup to `pip install -r requirements.txt` + `python main.py`.

> [!WARNING]
> `pydub` requires FFmpeg to be reachable. Set `FFMPEG_PATH` in `.env`
> pointing to the already-installed FFmpeg at:
> `D:\ffmpeg-master-latest-win64-gpl\ffmpeg-master-latest-win64-gpl\bin\ffmpeg.exe`

---

## 13. Required Frontend (npm) Dependencies

Install via: `cmd /c "npm install"` inside `frontend/`

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "@tanstack/react-query": "^5.62.0",
    "axios": "^1.7.9",
    "zustand": "^5.0.2",
    "framer-motion": "^11.11.0",
    "lucide-react": "^0.468.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.16",
    "typescript": "^5.7.2",
    "vite": "^6.0.3"
  }
}
```

---

## 14. Environment Variables (.env)

```env
# ── Music Recognition APIs ─────────────────────────────────────────────────
# ACRCloud (Primary) — Register free at https://console.acrcloud.com/
ACRCLOUD_HOST=identify-eu-west-1.acrcloud.com
ACRCLOUD_ACCESS_KEY=your_acrcloud_access_key
ACRCLOUD_SECRET_KEY=your_acrcloud_secret_key

# AudD (Fallback) — Register free at https://dashboard.audd.io/
AUDD_API_TOKEN=your_audd_api_token

# ── FFmpeg Paths ────────────────────────────────────────────────────────────
FFMPEG_PATH=D:\ffmpeg-master-latest-win64-gpl\ffmpeg-master-latest-win64-gpl\bin\ffmpeg.exe
FFPROBE_PATH=D:\ffmpeg-master-latest-win64-gpl\ffmpeg-master-latest-win64-gpl\bin\ffprobe.exe

# ── Application ─────────────────────────────────────────────────────────────
DATABASE_URL=sqlite:///./djmix.db
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:5173
DEBUG=false
```

---

## 15. API Cost Estimation: 2-Hour DJ Mix

| Metric | Value |
|--------|-------|
| Mix duration | 7,200 seconds |
| Chunk size | 30 seconds |
| Chunk overlap | 5 seconds |
| Effective step | 25 seconds |
| Total chunks | ⌈7200 / 25⌉ = **288 chunks** |
| ACRCloud free tier | 1,000/day |
| AudD free tier | 300/day |
| **Cost (free tier)** | **\$0** — well within limits |
| Paid ACRCloud (if needed) | ~\$0.003/request → **\$0.86 per 2h mix** |

---

## 16. Run Commands Reference

> [!IMPORTANT]
> All commands must use `cmd /c "..."` syntax due to PowerShell execution
> policy restrictions. Never use bare `npm` or `npx` in PowerShell.

### Backend
```bat
cd /d "d:\New folder (5)\Music Identifier\backend"
pip install -r requirements.txt
copy .env.example .env
:: Edit .env with your API keys
python -m uvicorn main:app --reload --port 8000
```

### Frontend
```bat
cd /d "d:\New folder (5)\Music Identifier\frontend"
npm install
npm run dev
```

### Both (via start.bat in root)
```bat
start.bat
```

---

## 17. Testing Checklist

Before considering a feature complete, verify:

### Audio Processing
- [ ] `extract_video_id()` handles all three URL formats
- [ ] `fetch_video_metadata()` returns title, channel, thumbnail, duration
- [ ] Audio downloads to temp directory successfully
- [ ] Chunks are created with correct overlap
- [ ] Chunk timestamps match source video
- [ ] Recognition API calls succeed (requires real API key)
- [ ] Results are deduplicated correctly
- [ ] Unknown Track placeholders appear in large gaps
- [ ] Temp files are deleted after job completes

### API Endpoints
- [ ] `POST /api/analyze` returns a job_id immediately (not after analysis)
- [ ] `GET /api/analysis/{job_id}` polling shows progress updates
- [ ] `PATCH /api/tracks/{id}` updates title/artist, sets edited_by_user=true
- [ ] `DELETE /api/tracks/{id}` removes track from DB
- [ ] `GET /api/history` returns last 50 jobs
- [ ] `DELETE /api/history/{id}` cascades to delete tracks

### Frontend
- [ ] Homepage URL input validates YouTube URLs
- [ ] "Analyse Mix" button is disabled while URL is empty/invalid
- [ ] Video preview shows thumbnail + metadata before analysis
- [ ] Progress bar updates in real time via polling
- [ ] Clicking a timestamp opens YouTube at the correct second
- [ ] Export TXT produces correct format
- [ ] Export CSV produces correct format
- [ ] Manual edit saves correctly and shows "Edited" badge
- [ ] Delete track removes it from the list
- [ ] Add manual track opens modal and inserts into sorted list
- [ ] Dark/light theme toggle works
- [ ] Mobile layout is usable on 375px width

---

## 18. Security Rules

1. **API keys never in frontend code** — always backend `.env` only
2. **CORS:** Only allow `http://localhost:5173` in development
3. **Input validation:** Validate YouTube URL server-side, reject non-YouTube hosts
4. **Temp file cleanup:** Always delete downloaded audio after job completes,
   even on failure. Use `try/finally`.
5. **SQL injection:** Use SQLAlchemy ORM — never raw string interpolation in queries
6. **Rate limiting:** Respect recognition API limits; do not retry more than 3 times

---

## 19. Known Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|-----------|
| ACRCloud can't recognize every song | Some tracks show "Unknown" | AudD fallback + manual editing |
| yt-dlp breaks when YouTube changes | Download may fail | Keep yt-dlp updated; show clear error |
| Python 3.14 may lack some wheels | Build errors for C-extensions | Use pure-Python alternatives |
| Free API tiers: 300–1000/day | Only 1-3 mixes/day on free tier | Display usage counter; support paid keys |
| SQLite not suitable for production | Single-user only for now | Swap DB_URL to PostgreSQL later |
| No persistent worker across restarts | Queue lost on restart | Jobs in DB are re-queueable on startup |

---

## 20. UI / UX Design Specification

### 20.1 Visual Identity

| Property | Value |
|----------|-------|
| Primary background | `#0a0a0f` (near-black) |
| Surface | `#13131a` (card background) |
| Border | `#1e1e2e` |
| Accent (purple) | `#7c3aed` → `#a855f7` gradient |
| Accent (pink) | `#ec4899` |
| Text primary | `#f1f5f9` |
| Text muted | `#64748b` |
| Success (green) | `#22c55e` |
| Warning (amber) | `#f59e0b` |
| Error (red) | `#ef4444` |
| Font | Inter (Google Fonts) — weights 400, 500, 600, 700 |

**Light theme:** swap `#0a0a0f` → `#f8fafc`, `#13131a` → `#ffffff`, text colours inverse. Accent colours remain.

### 20.2 Homepage Layout

```
┌─────────────────────────────────────────────────────┐
│  🎵 MixTrace                        [History] [🌙]  │  ← Navbar
├─────────────────────────────────────────────────────┤
│                                                     │
│        ✦  Discover Every Track Inside               │
│              Any DJ Mix  ✦                          │  ← Hero headline (5xl bold)
│                                                     │
│   Paste a YouTube URL and we'll identify every      │
│   song with its exact timestamp — automatically.    │  ← Subtitle (lg, muted)
│                                                     │
│  ┌─────────────────────────────────┐  [Analyse Mix] │  ← URL input row
│  │ https://youtube.com/watch?v=... │                │
│  └─────────────────────────────────┘                │
│                                                     │
│   ✓ Entire mix   ✓ Clickable timestamps             │
│   ✓ All transitions  ✓ Export TXT & CSV             │  ← Feature pills
│                                                     │
├─────────────────────────────────────────────────────┤
│  HOW IT WORKS                                       │
│  [1 Paste URL] → [2 AI Analyses] → [3 Get Tracks]  │  ← 3-step explainer
└─────────────────────────────────────────────────────┘
```

### 20.3 Analysis Page Layout

```
┌─────────────────────────────────────────────────────┐
│  Navbar                                             │
├──────────────┬──────────────────────────────────────┤
│ [Thumbnail]  │  Video Title (truncated)             │
│ 2:04:33      │  Channel Name · 2h 4m               │  ← VideoPreview
│              │  [████████░░░░░░] 52% · 108 tracks  │  ← ProgressBar
│              │  Identifying songs: chunk 104/201…  │  ← StageMessage
├──────────────┴──────────────────────────────────────┤
│ 🔍 Search tracks…   [Artist ▼]  [Sort: Time ▼]     │  ← SearchFilter bar
│ [Copy Tracklist] [Export TXT ▼]                     │  ← ExportPanel
├─────────────────────────────────────────────────────┤
│  #  Time    Title                Artist    Conf  ✎  │
│  1  00:00   Song A               Artist A   87%  ✎  │
│  2  04:32   Song B               Artist B   91%  ✎  │
│  3  09:18   ── Unknown Track ──  —          —    ✎  │  ← greyed-out row
│  4  14:45   Song C               Artist C   73%  ✎  │
└─────────────────────────────────────────────────────┘
```

### 20.4 Confidence Score Visual Treatment

| Score | Colour | Label |
|-------|--------|-------|
| 85–100 | `#22c55e` green | High |
| 60–84 | `#f59e0b` amber | Medium |
| 30–59 | `#ef4444` red | Low |
| 0 | `#64748b` grey | Unknown |

Display as a small coloured pill: `87%` with a thin left-border in the matching colour.

### 20.5 TrackCard Detail

Each track row contains:
- **Track number** (sequential, 1-based)
- **Timestamp button** — `04:32` styled as a clickable badge; hover shows play icon
- **Title** — bold; "Unknown Track" in italic muted style
- **Artist** — muted text
- **Platform links** — small icon buttons: Spotify 🎵, YouTube Music ▶, Apple Music 🍎
- **Confidence pill** — coloured by score
- **"Edited" badge** — shown when `edited_by_user = true`
- **Edit button (✎)** — opens EditTrackModal
- **Copy timestamp button (⧉)** — copies `04:32` to clipboard; shows brief "Copied!" tooltip

### 20.6 Responsive Breakpoints

| Breakpoint | Width | Layout change |
|-----------|-------|--------------|
| Mobile | < 640px | Single column; timestamp + title stacked; platform links hidden behind "…" menu |
| Tablet | 640–1024px | Two-column VideoPreview; platform links visible |
| Desktop | > 1024px | Full layout as above |

---

## 21. Manual Correction Feature

### 21.1 EditTrackModal Fields

```typescript
interface EditTrackForm {
  title: string;         // required
  artist: string;        // required
  start_time_display: string;  // "MM:SS" or "H:MM:SS" — converted to seconds on save
}
```

Modal also contains:
- **Delete Track** button (red, with confirmation "Are you sure?")
- **Mark as Unknown** button — sets `is_identified=false`, clears title/artist, sets `title="Unknown Track"`

### 21.2 Add Manual Track

A floating `+` button at the bottom of the TrackList opens the same EditTrackModal
but in "add" mode. Calls `POST /api/tracks`. After saving, the new track is
inserted into the sorted list in the correct chronological position.

### 21.3 Report Incorrect Song

Each TrackCard has a `⚑ Report` menu item (inside a `...` overflow menu).
Clicking it:
1. Opens a small inline panel: "What's wrong?" with options:
   - Wrong song identified
   - Wrong artist name
   - Wrong timestamp
   - Duplicate entry
2. Stores the report flag locally in `localStorage` for now (no backend endpoint needed for MVP)
3. Shows a "Thanks for reporting" confirmation

### 21.4 Edited State Persistence

When `PATCH /api/tracks/{id}` is called:
- Backend sets `edited_by_user = true`
- Frontend renders an `Edited` badge (small amber pill)
- The badge persists even after page reload (stored in DB)

---

## 22. Shareable Results Page

### 22.1 URL Structure

Each analysis result is accessible at:
```
http://localhost:5173/analysis/{job_id}
```

This URL is shareable because:
- The job_id is stored in the database
- Any browser hitting this URL will load the tracklist from the backend
- No authentication required (all results are public in MVP)

### 22.2 Share Button

On the AnalysisPage, include a **Share** button that:
1. Copies the current page URL to clipboard
2. Shows "Link copied!" tooltip for 2 seconds

No third-party sharing SDK needed. Native `navigator.clipboard.writeText()`.

### 22.3 Open Graph Meta Tags (optional enhancement)

For shareable link previews, the `index.html` can be enhanced with:
```html
<meta property="og:title" content="DJ Mix Tracklist — {video_title}" />
<meta property="og:image" content="{thumbnail_url}" />
<meta property="og:description" content="{tracks_found} tracks identified" />
```
Since this is Vite SPA, this only works with SSR. Mark as future enhancement.

---

## 23. History Page Specification

### 23.1 Layout

Each history card shows:
- **Thumbnail** (120×67px, rounded corners)
- **Video title** (truncated to 2 lines)
- **Channel name**
- **Analysis date** — formatted as "16 Nov 2026, 10:04 AM"
- **Track count** — "108 tracks identified"
- **Status badge** — green "Completed" / red "Failed" / amber "Processing"
- **[View Results]** button → navigates to `/analysis/{job_id}`
- **[🗑 Delete]** button → calls `DELETE /api/history/{job_id}`, removes from list

### 23.2 Empty State

When no history exists:
```
🎵
No mixes analysed yet.
Paste a YouTube URL on the home page to get started.
[Analyse a Mix →]
```

---

## 24. Accuracy & Anti-Hallucination Rules

These rules apply to every part of the system:

1. **Never invent song names.** If the recognition API returns no match, the
   track must appear as `"Unknown Track"` with `is_identified: false`.

2. **Never display a song name without a recognition API confirming it.**
   Do not use the YouTube title, description, or comments as song identification.
   These may be used as supplementary display metadata only (video title shown in preview).

3. **Confidence threshold enforcement:**
   - `confidence < 30` → treat as no match, discard result
   - `confidence 30–59` → show with "Low confidence" indicator, red pill
   - `confidence 60–84` → "Medium", amber pill
   - `confidence ≥ 85` → "High", green pill

4. **Never show analysis as complete when it isn't.** The progress bar must
   accurately reflect the actual chunk processing count. Never jump to 100%
   before all chunks are processed.

5. **Duplicate prevention:** A song with the same `(title.lower(), artist.lower())`
   appearing within 15 seconds of a prior entry for the same song is a duplicate
   and must be merged — not shown as a second entry.

6. **Repeated appearances are allowed.** If the same song genuinely appears at
   two different timestamps (e.g., an intro reprise and a main track), and they
   are more than `MERGE_WINDOW_SEC` apart, both entries are kept with their
   respective timestamps.

7. **Indicate overlapping songs.** If two different songs are identified within
   5 seconds of each other, add a note field `overlapping: true` to the later
   one's metadata. Display a "⟲ Transition" label between those two TrackCards.

---

## 25. Progress Tracking Detail

The frontend must display four distinct pieces of live information during processing:

| UI Element | Data Source | Example |
|-----------|-------------|---------|
| Progress bar | `job.progress` (0–100) | `████████░░ 52%` |
| Stage message | `job.stage_message` | `"Identifying songs: chunk 104 of 201…"` |
| Songs found counter | `job.tracks_found` | `108 songs identified so far` |
| Elapsed time | Frontend timer (started when job created) | `Running for 3m 42s` |

Backend must update `stage_message` at every significant step:
```python
stage_messages = {
    "queued":      "Waiting to start…",
    "downloading": "Downloading audio from YouTube…",
    "processing":  f"Identifying songs: chunk {n} of {total}…",
    "completed":   f"Complete — {tracks_found} tracks identified",
    "failed":      f"Failed: {error_message}",
}
```

---

## 26. Browser Testing Specification

### 26.1 Recommended Tool

Use the **Antigravity `browser` subagent** (built-in) for all UI verification.
It operates a headless Chromium browser and can click, fill forms, scroll,
and inspect visual state. Do not use Playwright, Cypress, or Selenium — the
browser subagent covers all browser testing needs for this project.

### 26.2 When to Invoke the Browser Subagent

Invoke the browser subagent for every task that involves:
- Verifying that the React frontend renders correctly at `http://localhost:5173`
- Testing the URL input → Analyse Mix → AnalysisPage flow end-to-end
- Confirming that timestamp buttons open YouTube at the correct second
- Testing export (TXT/CSV) file downloads
- Testing the Edit Track modal and manual track addition
- Verifying dark/light theme toggle
- Verifying mobile layout at 375px viewport width

### 26.3 Browser Subagent Invocation Pattern

```
Start the backend: python -m uvicorn main:app --reload --port 8000
Start the frontend: cmd /c "npm run dev" inside frontend/
Then delegate to browser subagent: "Open http://localhost:5173 and verify [feature]"
```

Always start both servers before invoking the browser subagent.
The backend must be reachable at `http://localhost:8000` for the frontend to function.

### 26.4 Chrome DevTools Integration

The `chrome-devtools` skill is available globally and can be used alongside
browser testing to:
- Inspect network requests (confirm polling calls to `/api/analysis/{id}`)
- Check console errors during analysis
- Profile rendering performance on the TrackList component
- Debug CORS errors between `localhost:5173` and `localhost:8000`

### 26.5 Testing Sequence for Full E2E Verification

```
1. Health check:     GET http://localhost:8000/health → { "status": "ok" }
2. Submit URL:       POST /api/analyze with a real YouTube URL
3. Poll status:      GET /api/analysis/{job_id} every 2s until "completed"
4. Check tracklist:  Verify ≥1 track returned with start_time, title, artist
5. Frontend:         Browser subagent confirms timestamps are clickable
6. Edit track:       PATCH /api/tracks/{id} with new title → verify "Edited" badge
7. Export:           TXT download contains correct format
8. History:          GET /api/history shows the completed job
```

---

## 27. Error Handling & Retry Specification

### 26.1 Backend Error States

| Error | `error_message` value | Recovery |
|-------|----------------------|---------|
| Invalid YouTube URL | `"Not a valid YouTube URL"` | User corrects URL |
| Video unavailable | `"Video is private or unavailable"` | User tries different URL |
| Download failed | `"Failed to download audio: {yt-dlp error}"` | Retry button |
| All APIs unresponsive | `"Recognition services unavailable"` | Retry button |
| No API keys configured | `"No recognition API configured — add keys to .env"` | Show setup guide |
| Temp disk full | `"Insufficient disk space"` | Clear space, retry |

### 26.2 Frontend Error Display

On the AnalysisPage when `job.status === "failed"`:
```
⚠ Analysis Failed
{job.error_message}
[Try Again]   [Go Home]
```
"Try Again" calls `POST /api/analyze` with the same URL and navigates to the new job's page.

### 26.3 Retry Logic in Audio Processor

```python
MAX_RETRIES = 3
RETRY_DELAY = 2.0  # seconds

for attempt in range(MAX_RETRIES):
    try:
        result = await recognizer.recognize_chunk(path, offset)
        break
    except httpx.TimeoutException:
        if attempt < MAX_RETRIES - 1:
            await asyncio.sleep(RETRY_DELAY)
        else:
            result = []  # treat as no match, not as error
```

---

*This skill file is authoritative for all agents working on the DJ Mix Tracklist Identifier project.*
*Last updated: 2026-11-16 — extended with UI spec, manual correction, sharing, history, accuracy rules, progress detail, and error handling.*
