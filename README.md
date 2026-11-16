# SplitTheMix — DJ Mix Tracklist & Timestamp Identifier

SplitTheMix is a full-stack platform that identifies every individual song played inside a long continuous DJ mix, YouTube live set, SoundCloud set, Mixcloud set, mashup, or music compilation.

Instead of scraping metadata or video descriptions, SplitTheMix uses a chunk-based audio recognition pipeline that processes sets of any duration (including 1–3 hour sets) with boundary overlapping, acoustic fingerprinting, and deduplication.

---

## ⚡ Core Features

- **Any Length Mix:** Analyses the entire mix from start to finish using 30s overlapping chunks.
- **Accurate Starting Timestamps:** Every detected song retains its exact position in the original video's timeline.
- **Interactive YouTube Navigation:** Click any timestamp to play the exact moment directly on YouTube.
- **Transition & Crossfade Detection:** Identifies songs even when mixed together with pitch, tempo, or key alterations.
- **Manual Correction Mode:** Edit song titles, artists, timestamps, delete false detections, or add unrecognised tracks.
- **Export & Share Options:** Export tracklists to formatted `.txt` and `.csv`, or copy to clipboard with a single click.
- **History Tracking:** Revisit previously analysed sets with stored tracklists and direct links.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite, TanStack Query
- **Backend:** Python 3.14, FastAPI, SQLAlchemy (SQLite), Pydantic v2
- **Audio Pipeline:** FFmpeg, pydub, yt-dlp
- **Recognition Providers:** ACRCloud REST API (Primary) & AudD REST API (Fallback)

---

## 🚀 Quick Start Guide

### 1. Prerequisites Check
- **Node.js:** v26+ installed
- **Python:** 3.14+ installed
- **FFmpeg:** Installed and configured in PATH or `.env`

### 2. Configure Environment Variables
Inside `backend/`, copy `.env.example` to `.env`:
```bat
cd backend
copy .env.example .env
```
Add your free recognition credentials:
- **ACRCloud (Recommended):** Register at [console.acrcloud.com](https://console.acrcloud.com/) (1,000 free requests/day)
- **AudD (Optional fallback):** Register at [dashboard.audd.io](https://dashboard.audd.io/) (300 free requests/day)

### 3. Start the Platform
You can run the full platform using the root startup script:
```bat
start.bat
```
Or start each service separately:

**Backend:**
```bat
cd backend
python -m uvicorn main:app --reload --port 8000
```

**Frontend:**
```bat
cd frontend
npm run dev
```

Visit **http://localhost:5173** in your browser.
