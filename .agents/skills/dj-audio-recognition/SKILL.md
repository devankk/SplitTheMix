---
name: dj-audio-recognition
description: >-
  Authoritative engineering guide and comprehensive skill for the SplitTheMix
  platform (AI DJ Mix Tracklist Identifier). Covers audio fingerprinting,
  Apple Shazam recognition with bot-defense headers, proxy rotation,
  zero-RAM ffmpeg snippet streaming, 32s safe-leap stride + adaptive transition bisection,
  continuous song tracking, local media drag-and-drop & in-browser playback,
  Studio Console UI specifications, and production deployment guardrails.
metadata:
  icon: disc
  version: "2.0.0"
  project: SplitTheMix
  workspace: "d:/New folder (5)/Music Identifier"
---

# SplitTheMix: DJ Audio Recognition Skill

This skill is the authoritative architectural and engineering specification for every agent working on the **SplitTheMix** platform. Load and follow these instructions whenever modifying audio processing, recognition services, timestamp algorithms, database schemas, frontend interfaces, or deployment workflows.

---

## 1. Project Overview & Core Philosophy

**SplitTheMix** is a full-stack AI platform that identifies every track inside live DJ mixes, festival sets, and radio broadcasts, providing an interactive, chronological, timestamped tracklist with album art, BPM, musical key, record labels, and direct platform links.

* **Root Directory:** `d:/New folder (5)/Music Identifier/`
* **Core Philosophy:**
  1. **Zero-RAM Slicing:** Never load full uncompressed audio into RAM. Stream and slice 15s snippets on demand via FFmpeg to stay within Render's 512 MB memory ceiling (<100 MB active footprint).
  2. **Zero Bot Blocks:** Bypass YouTube and Apple Shazam bot protections using verified modern iOS client headers, fast oEmbed metadata extraction, and multi-proxy pool failovers (`YTDLP_PROXY`, `SHAZAM_PROXY`).
  3. **Continuous Song Flow:** Never artificially slice songs with fake "Unknown Track" midpoints. DJ sets have natural transitions where songs play for 2.5–4 minutes.
  4. **Strict Safety Guardrail:** **NEVER PUSH TO GITHUB** without explicit user consent (`"push"` or `"push to github"`).
  5. **Windows Shell Invariant:** All agent commands on Windows must use `cmd /c "..."` syntax due to PowerShell script execution restrictions.

```
Music Identifier/
├── backend/                  # FastAPI 0.115+ (Python 3.14)
│   ├── api/
│   │   ├── jobs/worker.py    # Background asyncio Queue worker pool (3 slots)
│   │   ├── models/database.py# SQLAlchemy SQLite ORM models (AnalysisJob, Track)
│   │   ├── routes/           # analysis.py, history.py, health.py
│   │   ├── services/
│   │   │   ├── audio_processor.py # 32s stride, bisection, deduplication, gap analysis
│   │   │   ├── artwork_fetcher.py # Direct iTunes JSON API fallback
│   │   │   ├── canonical_resolver.py
│   │   │   ├── audio_features.py  # BPM & Key resolution
│   │   │   └── recognition/
│   │   │       ├── base.py    # BaseRecognizer, RecognitionResult (with match_offset)
│   │   │       ├── shazam.py  # Primary Apple Shazam engine with iOS headers & proxy shield
│   │   │       ├── acrcloud.py# ACRCloud secondary recognizer
│   │   │       └── audd.py    # AudD fallback recognizer
│   │   └── utils/
│   │       ├── helpers.py     # generate_platform_links, formatting
│   │       └── youtube.py     # oEmbed fast resolver, yt-dlp low-bandwidth extractor
│   ├── main.py               # Uvicorn entrypoint, CORS, startup initialization
│   └── requirements.txt
├── frontend/                 # React 18 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── api/client.ts     # Axios client, analyzeUrl, analyzeFile, polling
│   │   ├── components/       # Studio Console components (TrackCard, ExportPanel, etc.)
│   │   ├── pages/
│   │   │   ├── HomePage.tsx  # URL input + Drag-and-Drop Dropzone
│   │   │   ├── AnalysisPage.tsx # Live progress, Local Mix Monitor player, tracklist
│   │   │   └── HistoryPage.tsx  # Setlist dashboard and past jobs
│   │   └── types/index.ts
│   └── package.json
└── .agents/skills/dj-audio-recognition/SKILL.md
```

---

## 2. Environment & System Inventory

| Tool | Version | Location / Command | Status |
| :--- | :--- | :--- | :--- |
| **Node.js** | v26.13.0 | `C:\Program Files\nodejs\node.exe` | ✅ Installed |
| **npm / npx** | 11.20.0 | **Always via `cmd /c npm ...`** | ✅ Installed |
| **Python** | 3.14.7 | `C:\Users\LUCIFER\AppData\Local\Programs\Python\Python314\python.exe` | ✅ Installed |
| **pip** | 26.2.1 | `cmd /c "pip ..."` | ✅ Installed |
| **FFmpeg** | N-128433 | `D:\ffmpeg-master-latest-win64-gpl\bin\ffmpeg.exe` | ✅ System PATH |
| **FFprobe** | N-128433 | `D:\ffmpeg-master-latest-win64-gpl\bin\ffprobe.exe` | ✅ System PATH |
| **Git** | 2.56.0 | System PATH | ✅ Installed |

> [!CAUTION]
> **PowerShell Execution Policy Restriction:**
> PowerShell disables running unsigned `.ps1` scripts on this system.
> **Mandatory Rule:** Always invoke `npm`, `npx`, `pip`, and `python` wrapped in `cmd /c "..."`. Never execute bare PowerShell script wrappers.

---

## 3. Technology Stack & Design System

### 3.1 Backend Architecture
* **Framework:** FastAPI 0.115+ (ASGI, async/await native).
* **Server:** Uvicorn with reloader in development.
* **Database:** SQLite (`djmix.db`) with SQLAlchemy ORM.
* **Concurrency:** `asyncio.Queue` background worker pool with 3 dedicated job slots.
* **HTTP Client:** `httpx.AsyncClient` with pooled persistent connections.

### 3.2 Frontend Architecture
* **Framework:** React 18 + TypeScript + Vite.
* **Styling:** Tailwind CSS with custom Studio Console extensions.
* **State & Data Fetching:** TanStack React Query v5 (polling every 2000ms while active) + Axios.
* **Icons & Animation:** Lucide React + Framer Motion.

### 3.3 Studio Console Design System
SplitTheMix adheres strictly to a high-tech **Studio Console** aesthetic:
* **Background Deep Obsidian:** `#090909`
* **Console Base:** `#141414`
* **Surface Panel:** `#181818` / `#202020`
* **Console Borders:** `#292929`
* **Accent Crimson:** `#E32636` (Primary action, playheads, active states)
* **Crimson Glow:** `#8D1422` / `rgba(227, 38, 54, 0.2)`
* **Typography:** Monospace (`font-mono`) for timecodes, BPM, keys, and status readouts; clean modern display typography for headlines.

---

## 4. Dual-Source Audio Ingestion & Playback Pipeline

SplitTheMix ingests audio through two distinct, hardened pipelines:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          INGESTION PIPELINES                                │
├──────────────────────────────────────┬──────────────────────────────────────┤
│      1. PUBLIC LINK INGESTION        │      2. LOCAL FILE DROPZONE          │
│   (YouTube / SoundCloud / Mixcloud)  │      (MP3 / MP4 / WAV / M4A / WEBM)  │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ 1. Instant Cache Check:              │ 1. Multipart Upload:                 │
│    Match existing completed job      │    POST /api/analyze/upload          │
│    by video_id. If found, return in  │    Stream chunks to disk under       │
│    0.01s with 0 network calls.       │    splitthemix_uploads/              │
│ 2. Fast Metadata (0.05s):            │ 2. Metadata Extraction:              │
│    Fetch title & thumbnail via       │    ffprobe zero-RAM duration check   │
│    YouTube oEmbed API.               │ 3. Enqueue Job:                      │
│ 3. Streaming Download:               │    url = "file:///path/to/mix.mp3"   │
│    yt-dlp Format 249 (Opus 50kbps)   │ 4. Playback Endpoint:                │
│    Rotated via YTDLP_PROXY pool.     │    GET /api/media/{job_id}           │
│    Native WebM/Opus, no transcoding. │    HTTP 206 Partial Content streams  │
│                                      │    to browser <audio> element.       │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

### 4.1 3-Tier Zero-Block YouTube Audio Ingestion Architecture
To completely eliminate YouTube datacenter bot blocks ("Sign in to confirm you're not a bot", SABR-streaming lockouts, and PO-Token challenges), SplitTheMix employs a hardened 3-tier ingestion engine:

1. **Tier 1: Multi-Connection VisionOS & Mobile Client Emulation (`visionos,android`)**
   - Routes requests using `--extractor-args "youtube:player_client=visionos,android"`.
   - **The VisionOS Advantage:** Apple Vision (`visionos`) is completely exempt from YouTube's experimental SABR streaming and GVS PO-Token gates. Unlike Smart TV (`tv`), VisionOS does not trigger "The page needs to be reloaded".
   - Downloads with 8 concurrent fragments (`--concurrent-fragments 8`) or `aria2c` multi-connection streams (`-s 16 -x 16`), completing a 1-hour mix in under 68–72 seconds ($>1.5\text{ MB/s}$).
   - **Proxy Decoupling:** Always forces `--proxy ""` for direct connections when no explicit `YTDLP_PROXY` is configured, preventing dead or expired system proxies (`HTTP_PROXY`) from throwing `402 Payment Required`.
2. **Tier 2: Silent Cobalt REST API Fallback (`CobaltDownloader`)**
   - If direct yt-dlp is ever blocked or throttled, the backend automatically and silently queries open-source Cobalt REST API instances to acquire direct audio streams without ads or bot gates.
3. **Tier 3: In-Browser Verification Modal & Cloud Pass-Through**
   - When a cloud server IP (e.g. Render) is blocked by YouTube's firewall, `_download_audio` detects the block and raises `VerificationRequiredException`.
   - The job is set to `status: "verification_required"` with the challenge URL.
   - The Vercel frontend automatically opens `<VerificationModal />`, allowing the user to solve the challenge in their browser on their residential IP.
   - Upon clicking "Resume Analysis", the frontend calls `POST /api/analysis/{id}/verify`, resuming processing immediately.

### 4.2 Local Media Playback & Monitoring
* Uploaded files are preserved in `splitthemix_uploads/{job_id}_{clean_filename}`.
* `GET /api/media/{job_id}` streams audio with `FileResponse` and byte-range support (<1 MB RAM footprint).
* `AnalysisPage.tsx` mounts a dedicated **Local Mix Monitor** console with `<audio ref={localAudioRef}>`. Clicking any track card or timestamp immediately seeks playback to that exact drop in the local file.

---

## 5. High-Precision Audio Processing Pipeline

### 5.1 Constants (Production Calibrated)
```python
CHUNK_DURATION_SEC      = 15   # 15s snippet captures melody & drop through transition drums
CHUNK_STRIDE_SEC        = 32   # 32s safe-leap phrase stride (half-bar at standard 128 BPM)
MAX_CONCURRENT_REQUESTS = 16   # 16 parallel workers (rock-solid throughput, 0% rate-limit risk)
MERGE_WINDOW_SEC        = 240  # 4 minutes: merge repetitions and extended DJ intros
MIN_SONG_GAP_SEC        = 240  # 4 minutes: never cut songs in half with phantom Unknown Tracks
MIN_CONFIDENCE          = 30   # Catch pitched-up edits and fast club remixes
```

### 5.2 Zero-RAM Chunk Slicing
Never use `AudioSegment.from_file()` on full DJ mix files. Loading a 2-hour uncompressed PCM mix requires >600 MB of RAM and triggers container OOM kills on Render.
Always slice snippets directly via `ffmpeg`:
```python
cmd = [
    "ffmpeg", "-y",
    "-ss", str(offset_sec),
    "-t", str(CHUNK_DURATION_SEC),
    "-i", audio_path,
    "-ac", "1",
    "-ar", "44100",
    "-vn",
    chunk_path
]
```

### 5.3 Two-Pass Hybrid Processing Algorithm
1. **Pass 1: 32-Second Safe-Leap Coarse Scan:**
   * Generates grid offsets: `0, 32, 64, 96, 128...`
   * Fired concurrently across 16 parallel worker tasks (`asyncio.Semaphore(16)`).
   * Identifies 90%+ of all tracks in the mix in under 4 minutes.
2. **Pass 2: Adaptive Transition Bisection:**
   * Evaluates adjacent hits: if `Track(t1) != Track(t2)`, or one chunk missed while the other hit, samples midpoint `(t1 + t2) / 2.0` (at 16s).
   * Refines the exact transition moment without running a dense 5s scan across the whole mix.
   * Total processing time for a 2h 46m set: **~6 minutes** (down from 11+ minutes) with zero missed transitions.

---

## 6. Music Recognition Engine & Bot Defense

### 6.1 Apple Shazam Integration (Primary Recognizer)
Shazam provides the highest hit rate for EDM, club edits, bootlegs, and regional Bollywood/Desi mixes.

#### The 429 Bot-Detection Discovery & Fix
* **Problem:** The open-source `shazamio` library sends an obsolete 10-year-old Android User-Agent (`Dalvik/1.6.0 (Linux; U; Android 4.4.4; SM-G360G...)`). Apple's modern edge firewall immediately flags this header on high-volume runs and returns `HTTP 429 Too Many Requests`.
* **The Permanent Fix:** In `backend/api/services/recognition/shazam.py`:
  1. Use `core_recognizer.recognize_path()` for fast C/Rust acoustic fingerprinting.
  2. Send the search payload using `httpx.AsyncClient` with **official modern iOS client headers**:
     ```python
     headers = {
         "X-Shazam-Platform": "IPHONE",
         "X-Shazam-AppVersion": "15.3.0",
         "User-Agent": "Shazam/15.3.0 (iPhone; iOS 16.5; Scale/3.00)",
         "Accept": "*/*",
         "Accept-Language": "en-US",
     }
     ```
  3. **Zero 429 Blocks:** Direct connections achieve 100% `200 OK` in 0.5–1.0s.
  4. **Proxy Shield Failover:** If direct IP ever returns 429, seamlessly route through `SHAZAM_PROXY` pool.

#### Direct Apple CDN Cover Art Extraction
Shazam natively returns official high-resolution 400x400 and 800x800 album art inside `track['images']['coverarthq']` and `coverart`.
* Extracted immediately in `shazam.py` with **zero extra network requests**.
* Avoids DuckDuckGo or web scraping in Step 8 which gets blocked on bulk runs.

#### Pinpoint Start-Time Drop Alignment
Shazam's response contains `matches[0]['offset']` (the exact second into the studio recording where the match occurred).
* In `_deduplicate()`, SplitTheMix calculates:
  ```python
  if match_offset <= 45.0:
      start_ts = max(0.0, chunk_time - match_offset)
  else:
      start_ts = max(0.0, chunk_time - 16.0)
  ```
* Clicking any track card jumps to the exact start of the track rather than 20–30s late into the chorus.

---

## 7. Deduplication, Continuous Tracking & Gap Analysis

### 7.1 Enhanced Title Normalization
In [audio_processor.py](file:///d:/New%20folder%20(5)/Music%20Identifier/backend/api/services/audio_processor.py#L77), titles are cleaned to prevent duplicate entries:
* Strips parenthetical tags: `(feat. ...)`, `[Remix]`, `[VIP Mix]`.
* Strips soundtrack/movie metadata: `(From "Dhurandhar")`, `Title Track`, `Original Soundtrack`.
* Strips all punctuation and lowercase-normalizes for robust fuzzy comparison.

### 7.2 Continuous Song Flow (Eliminating Phantom Unknown Tracks)
* **The Rule:** In a DJ mix, a song playing for 2 to 3.5 minutes is normal.
* **Invariant:** Never insert an "Unknown Track" between two identified tracks if the gap is under `MIN_SONG_GAP_SEC` (240 seconds = 4 minutes).
* Track $i$ naturally plays from its calibrated `start_time` until Track $i+1$'s `start_time` (`end_time = next_start`).
* Unknown Track entries only appear if:
  1. The mix begins with >120s of unidentifiable music before the first song.
  2. The mix ends with >240s of unidentifiable outro music.
  3. An extended >4-minute unreleased bootleg/ID section occurs between tracks.

---

## 8. Instant Cache Specification

* **Scope Invariant:** The Instant Cache is strictly exclusive to public URLs (**YouTube, SoundCloud, Mixcloud only**), keyed by `video_id`.
* **Local Upload Exception:** Local file uploads (`file://...`) **MUST NEVER BE CACHED across different files**. Every uploaded file is analyzed fresh on-demand.
* **Cache Return:** When a matching completed job exists for a public `video_id`, return all tracks and metadata in `0.01 seconds` with 0 network calls.

---

## 9. Database Schema (SQLAlchemy 2.x SQLite)

```python
class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"

    id = Column(String, primary_key=True)               # UUID
    url = Column(String, nullable=False)               # YouTube URL or file:// path
    video_id = Column(String, nullable=True)           # YT ID or local_hash
    video_title = Column(String, nullable=True)        # Mix title or filename
    channel_name = Column(String, nullable=True)       # DJ / Channel name
    thumbnail_url = Column(String, nullable=True)      # Cover artwork or YT thumb
    video_duration = Column(Integer, nullable=True)    # Total seconds
    status = Column(String, default="queued")          # queued|downloading|processing|completed|failed
    progress = Column(Integer, default=0)              # 0–100
    stage_message = Column(String, default="Waiting…") # High-tech console status text
    tracks_found = Column(Integer, default=0)          # Live identified counter
    created_at = Column(String, nullable=False)        # ISO 8601 UTC
    completed_at = Column(String, nullable=True)
    error_message = Column(String, nullable=True)
    tracks = relationship("Track", back_populates="job", cascade="all, delete-orphan")


class Track(Base):
    __tablename__ = "tracks"

    id = Column(String, primary_key=True)               # UUID
    job_id = Column(String, ForeignKey("analysis_jobs.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    artist = Column(String, nullable=False, default="")
    start_time = Column(Float, nullable=False)          # Seconds from mix start
    end_time = Column(Float, nullable=True)            # Seconds from mix start
    duration = Column(Float, nullable=True)            # Song length in mix
    confidence = Column(Integer, default=0)            # 0–100 match confidence
    album_art = Column(String, nullable=True)          # High-res Apple/Shazam CDN URL
    bpm = Column(Integer, nullable=True)               # Tempo (e.g. 128)
    musical_key = Column(String, nullable=True)        # Musical key (e.g. 8A / Am)
    release_year = Column(String, nullable=True)       # e.g. "2024"
    label = Column(String, nullable=True)              # Record label / publisher
    platform_links = Column(String, nullable=True)     # JSON string of search URLs
    is_identified = Column(Boolean, default=True)      # False for Unknown IDs
    edited_by_user = Column(Boolean, default=False)
    job = relationship("AnalysisJob", back_populates="tracks")
```

---

## 10. API Contract & Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/analyze` | Enqueues public URL (YouTube/SoundCloud). Checks Instant Cache first. |
| `POST` | `/api/analyze/upload` | Multipart file upload (MP3/MP4/WAV). Enqueues fresh local analysis. |
| `GET` | `/api/analysis/{job_id}` | Returns job status, progress, stage message, and tracklist. |
| `GET` | `/api/media/{job_id}` | Streams local media file via HTTP 206 Partial Content range requests. |
| `GET` | `/api/history` | Returns list of recent analyses. |
| `DELETE`| `/api/history/{job_id}` | Cascades delete of job and tracks from database. |
| `PATCH`| `/api/tracks/{id}` | Updates track metadata (`title`, `artist`, `start_time`, `bpm`, `key`). |
| `DELETE`| `/api/tracks/{id}` | Deletes single track from tracklist. |
| `GET` | `/health` | Server health check endpoint (`{"status": "ok"}`). |

---

## 11. Testing & Verification Checklist

Before reporting any feature or bugfix as complete, verify:

### Audio & Recognition Pipeline
- [ ] Direct Shazam requests return `200 OK` using modern iOS client headers.
- [ ] Album art is populated from Apple CDN (`https://is1-ssl.mzstatic.com/...`).
- [ ] Start timestamps align with the actual song drop (using match offset).
- [ ] No fake "Unknown Track" appears between recognized songs under 4 minutes.
- [ ] 16 workers process chunks concurrently without rate limit locks or timeouts.
- [ ] FFmpeg slices snippets using zero-RAM streaming without loading full mixes.

### Localhost & Playback
- [ ] `cmd /c "cd /d ...\frontend && npm run build"` succeeds with 0 TypeScript errors.
- [ ] Backend runs via `python -m uvicorn main:app --app-dir "backend" --port 8000 --reload`.
- [ ] Frontend runs via `cmd /c "cd /d ...\frontend && npx vite --port 5173"`.
- [ ] Dropping an MP3 uploads smoothly and plays in the Local Mix Monitor.
- [ ] Clicking any track card jumps the audio player to that exact second.

---

## 12. Deployment & Operational Invariants

1. **NEVER PUSH TO GITHUB WITHOUT USER CONSENT:**
   * Only run `git push origin main` when the user explicitly commands `"push"` or `"push to github"`.
   * Unstaged files and local tests must remain safely on localhost until approved.
2. **Render Cloud Constraints:**
   * Memory is capped at **512 MB**. Keep active memory < 100 MB at all times.
   * Proxies on Render must be set via `YTDLP_PROXY` and `SHAZAM_PROXY`, never global `HTTP_PROXY`.
3. **Windows Command Invariant:**
   * Never execute `.ps1` scripts directly in PowerShell. Always run via `cmd /c "..."`.

---

## 13. Engineering Retrospective: Root Causes, Failed Approaches & Critical Lessons

This section preserves hard-won production lessons, failed attempts, and debugging breakthroughs to prevent future regressions.

### 13.1 Issue 1: Phantom Unknown Tracks Splitting Songs (e.g. *Dhurandhar* split into #05 and #06)
* **Symptom:** In a 2h 46m set, *Dhurandhar* was recognized at 06:56, but an `#06 Unknown Track` was inserted directly beneath it from 08:00 to 09:04, even though the song was still playing.
* **Root Cause:**
  * `MIN_SONG_GAP_SEC` was set to `90s`. DJ sets naturally let songs run for 2.5 to 4 minutes.
  * In instrumental drops or transition filters, chunks may lack lyrics or hit a single timeout. The interval between detections reached 128s ($>90s$).
  * The `_fill_gaps` algorithm mechanically cut the 128s gap in half and injected a fake Unknown Track at midpoint 08:00.
* **Failed Approaches:**
  * Slicing arbitrary midpoints between detections assuming silence or missing IDs.
* **Successful Solution:**
  1. Increased `MIN_SONG_GAP_SEC` to 240s (4 minutes).
  2. Implemented **Continuous Song Flow**: Track $i$ naturally spans until Track $i+1$'s verified start (`end_time = next_start`).
  3. Enhanced title normalization regex to strip soundtrack/movie suffixes (`(From "...")`, `[Remix]`, `Title Track`).

---

### 13.2 Issue 2: 20–30s Timestamp Offsets ("Half-Played" or "Not Started Yet")
* **Symptom:** Clicking a track card jumped to audio where the song was already 25 seconds in, or conversely, had not started playing yet.
* **Root Cause:**
  * Coarse 32s chunk grid stamping assigned `start_time = chunk_offset`, completely detached from when the song actually dropped in the mix.
  * Midpoint gap splitting displaced start and end timestamps by 30–60 seconds.
* **Successful Solution:**
  1. Ingested Shazam's native internal match offset (`matches[0]['offset']`).
  2. Calibrated drop start time: `start_time = max(0.0, chunk_time - match_offset)`. When the user clicks a card, playback jumps to the exact start of the song.

---

### 13.3 Issue 3: 100% Missing Album Art Covers
* **Symptom:** Every track card rendered a fallback grey disc icon; no album art was displayed.
* **Root Cause:**
  * `shazam.py` extracted title/artist but discarded `track['images']['coverarthq']` and `coverart`.
  * Step 8 enrichment attempted DuckDuckGo scraping across 152 tracks simultaneously, getting blocked immediately with HTTP 429/CAPTCHAs and timing out.
* **Successful Solution:**
  1. Extracted Apple/Shazam CDN URLs (`https://is1-ssl.mzstatic.com/...`) directly from the recognition payload in `shazam.py` with **0 extra network calls**.
  2. Configured direct official iTunes JSON API (`https://itunes.apple.com/search`) as the primary fallback, completely eliminating fragile web scrapers.

---

### 13.4 Issue 4: The "4 Tracks / 8 Tracks" Apple 429 Bot-Detection Mystery
* **Symptom:** Re-running the 2h 46m set returned only 4 or 8 tracks; logs showed cascading timeouts on nearly all chunks.
* **Root Cause:**
  * The open-source `shazamio` library sends an obsolete 10-year-old Android User-Agent: `Dalvik/1.6.0 (Linux; U; Android 4.4.4; SM-G360G Build/KTU84P)` with `X-Shazam-Platform: IPHONE`.
  * Apple's edge firewall detects repeated requests with this Frankenstein header and issues an **HTTP 429 Too Many Requests** block.
  * `shazamio`'s internal `aiohttp_retry.RetryClient` entered infinite sleep/retry loops, burning up timeout ceilings.
* **Failed Approaches:**
  * *Routing 16 workers through Webshare free proxies:* Webshare free accounts have a strict 2–4 concurrent connection limit. Blasting 16 concurrent requests through 2 free proxies choked the sockets and timed out after 16s.
* **Successful Solution:**
  1. Bypassed `shazamio`'s HTTP transport layer and built a direct `httpx.AsyncClient` pipeline.
  2. Equipped requests with **official modern Apple iOS headers**:
     ```python
     headers = {
         "X-Shazam-Platform": "IPHONE",
         "X-Shazam-AppVersion": "15.3.0",
         "User-Agent": "Shazam/15.3.0 (iPhone; iOS 16.5; Scale/3.00)",
         "Accept": "*/*",
         "Accept-Language": "en-US",
     }
     ```
  3. **Outcome:** Direct connections to Apple immediately achieved **100% HTTP 200 OK in 0.3–0.8s** with zero 429 blocks.
  4. Built an automatic proxy shield fallback (`SHAZAM_PROXY`) to handle high-concurrency cloud scaling.

---

### 13.5 Issue 5: Audible Handover Drop Snapping & Pre-Cue Bleed Elimination
* **Symptom:** When a DJ faintly introduces Track 2 on Deck B (e.g. cueing up low-volume percussion 30s before the mix-in), Shazam detected Track 2 early at 192s, prematurely ending Track 1 before Deck A had even faded out.
* **Root Cause:**
  * Raw match offset calculations placed `start_time` at the very first faint audio trace, ignoring the real DJ mixer crossfade.
* **Successful Solution:**
  1. Implemented `find_audible_drop(audio_path, win_start, win_end)`.
  2. Scans the transition window in 50ms frames via a zero-RAM streaming FFmpeg pipe (<5MB RAM).
  3. Uses RMS energy rise and spectral flux to snap the transition timestamp to the **exact audible drop / takeover point** where Deck B drops in and Deck A mutes.

---

### 13.6 Issue 6: The YouTube Proxy Bandwidth Trap (`402 Payment Required`)
* **Symptom:** YouTube downloads crashed abruptly with: `ERROR: Unable to download API page: ('Unable to connect to proxy', OSError('Tunnel connection failed: 402 Payment Required'))`.
* **Root Cause:**
  * yt-dlp was routing through commercial proxies configured in the environment (`HTTP_PROXY`, `HTTPS_PROXY`).
  * Free/trial proxy providers (e.g. Webshare) cap monthly traffic at 1 GB. A single 2-hour set is ~100–150 MB; after a few downloads, the proxy quota was completely exhausted and returned HTTP 402.
* **Successful Solution:**
  1. Decoupled yt-dlp from generic `HTTP_PROXY`/`HTTPS_PROXY` environment variables.
  2. Enforced `--proxy ""` for direct connections whenever no explicit `YTDLP_PROXY` is defined.
  3. Engineered the **3-Tier Zero-Block Downloader**: Tier 1 (mobile/VisionOS client spoofing) + Tier 2 (Cobalt API fallback) + Tier 3 (In-browser verification modal).

---

### 13.7 Issue 7: Viral Video SABR-Streaming & PO-Token Blocks (Boiler Room `c0-hvjV2A5Y`)
* **Symptom:** Downloading viral DJ sets with tens of millions of views (e.g. *Fred again.. Boiler Room London*) failed with: `ERROR: [youtube] c0-hvjV2A5Y: Failed to extract any player response`.
* **Root Cause:**
  * YouTube deploys experimental SABR-only streaming on `android`/`ios` clients and demands mandatory GVS PO-Tokens on `mweb` for high-traffic music videos.
  * Locking yt-dlp strictly to `player_client=android,ios,mweb` left yt-dlp with zero usable formats.
* **Failed Approaches:**
  * *Using Smart TV (`tv`) alone:* Returned `ERROR: The page needs to be reloaded`.
* **Successful Solution:**
  1. Benchmarked all 9 YouTube client profiles: discovered that **`visionos` (Apple Vision) has 0 errors, 0 warnings, full audio format access, and is completely exempt from SABR and PO-tokens**.
  2. Configured primary client chain: `youtube:player_client=visionos,android` with adaptive unconstrained auto-negotiation as Pass 2.
  3. Downloaded the full 71-minute Boiler Room mix (71.67 MB MP3) in **68.10 seconds** with zero blocks.
  4. Added `pip install -U yt-dlp` to `render.yaml` build command for continuous daily extractor updates.

---

### 13.8 Issue 8: The Verification State Overwrite Race Condition
* **Symptom:** In live production on Render/Vercel, when YouTube challenged a datacenter IP, the job showed `"failed"` instead of prompting the user with the Verification Modal.
* **Root Cause:**
  * `_download_audio` updated the job to `status="verification_required"`, but then immediately raised a generic `RuntimeError`.
  * The outer `process_mix` `except Exception` block caught the `RuntimeError` and instantly overwrote `status="failed"`, obliterating the verification state in under 1 millisecond.
* **Successful Solution:**
  1. Created `class VerificationRequiredException(Exception)`.
  2. `process_mix` explicitly catches `VerificationRequiredException`, logs the pause, and returns cleanly without modifying `status`.
  3. The job remains in `status: "verification_required"`, allowing the Vercel frontend `<VerificationModal />` to open seamlessly.

---

### 13.9 Key Architectural Lessons & Invariants
1. **Inspect Existing Code First:** Always check database models, API routes, and actual network payloads before proposing structural rewrites.
2. **Never Scrap Web Pages When Direct APIs Exist:** iTunes Search API and Shazam CDN return structured JSON in milliseconds without bot blocks.
3. **Guardrails for Free Proxies:** Never route bulk audio downloads through free proxy tiers; free quotas will trigger `402 Payment Required`. Use direct connections with VisionOS/iOS emulation.
4. **Preserve Job States:** Never let an unhandled exception block in worker loops overwrite deliberate paused states like `verification_required`.
5. **Scope Boundaries:** Keep Instant Cache exclusive to public links (**YouTube and SoundCloud only**); never cache local user uploads across files.
6. **Strict Safety Rule:** Never push to GitHub without explicit user command (`"push"`).

---
*This skill is authoritative for SplitTheMix. Always consult these specifications before modifying audio or UI logic.*
