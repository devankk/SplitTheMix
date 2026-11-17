---
name: split-the-mix-autonomous-debugger
description: >-
  Autonomous end-to-end bug fixing, investigation, and verification engine for SplitTheMix.
  Trigger this skill whenever the user reports any bug, regression, unexpected behavior,
  or performance issue in SplitTheMix (AI DJ Mix Tracklist Identifier). Independently reproduces
  bugs, inspects code, APIs, logs and SQLite database, implements surgical fixes, runs automated
  tests, verifies against localhost (port 8000/5173), inspects console and network failures, repeats
  debugging if anything fails, and guarantees regression-free resolution without manual prompting.
metadata:
  icon: bug
  version: "1.0.0"
  project: SplitTheMix
  workspace: "d:/New folder (5)/Music Identifier"
  slash_command: "/split-the-mix-autonomous-debugger"
---

# SplitTheMix: Autonomous Debugger & Verification Engine

When this skill is invoked with a bug report, **immediately begin autonomous investigation and repair**. Do not require the user to paste debugging guidelines again. Do not stop after the first attempted fix. Iterate continuously until all verification checks pass or a genuine non-technical blocker requires user input.

---

## 1. Permanent Project Constraints & Invariants

You must strictly obey these non-negotiable constraints across every debugging session:

1. **Use SplitTheMix Project Skill:** Always adhere to the architectural specifications defined in `.agents/skills/dj-audio-recognition/SKILL.md`.
2. **Work Exclusively on Localhost:** All runtime verification must happen against `http://localhost:8000` (FastAPI backend) and `http://localhost:5173` (Vite frontend).
3. **Never Deploy Changes:**
   * **STRICT FORBIDDEN:** Never run `git push` to GitHub or deploy to Render without the user typing the exact single word `"push"`.
   * Never modify production cloud environment variables or remote databases.
4. **Protect Existing User Data:**
   * Never delete or overwrite the production user database `backend/djmix.db`.
   * For reproduction and test runs, always use isolated temporary SQLite databases (e.g. `backend/test_repro.db`) or mock fixtures.
5. **Preserve Performance Targets:**
   * 2-hour-45-minute recording analysis target is **approximately 3 minutes** (~180s) or faster.
   * Active memory consumption must remain $< 100\text{ MB}$ (never load entire uncompressed audio files into RAM).
6. **Never Sacrifice Accuracy Merely to Reduce Time:**
   * Accuracy is paramount. Maintain high confidence, real album artwork, accurate musical keys, and octave-folded BPMs.
7. **Never Falsely Report Successful Tests:**
   * Every claim of success must be backed by real command exit codes (`code 0`), passing assertions, and verified log outputs.
8. **Preserve Unrelated Working Functionality:**
   * Fix bugs surgically. Never break existing features, working routes, or established UI components.
9. **Windows Shell Invariant:**
   * Always wrap PowerShell / Windows commands in `cmd /c "..."` (e.g., `cmd /c "python -m unittest backend/tests/test_audio_engine.py -v"`).

---

## 2. Autonomous Execution Protocol

### Step 1: Reproduce the Bug
- Replicate the reported issue under controlled conditions.
- Write a minimal, deterministic reproduction script in `backend/tests/` or inspect the exact API endpoints and UI state.
- Confirm the bug exists and note the exact failure mode (stack trace, assertion failure, UI anomaly, or HTTP status).

### Step 2: Root Cause Investigation
- Trace the entire data and execution path through:
  * **Audio Pipeline:** [audio_processor.py](file:///d:/New%20folder%20(5)/Music%20Identifier/backend/api/services/audio_processor.py) (slicing, stride, bisection, deduplication, gap analysis).
  * **Recognition Providers:** [shazam.py](file:///d:/New%20folder%20(5)/Music%20Identifier/backend/api/services/recognition/shazam.py), [acrcloud.py](file:///d:/New%20folder%20(5)/Music%20Identifier/backend/api/services/recognition/acrcloud.py), [audd.py](file:///d:/New%20folder%20(5)/Music%20Identifier/backend/api/services/recognition/audd.py).
  * **Metadata & Audio Features:** [artwork_fetcher.py](file:///d:/New%20folder%20(5)/Music%20Identifier/backend/api/services/artwork_fetcher.py), [audio_features.py](file:///d:/New%20folder%20(5)/Music%20Identifier/backend/api/services/audio_features.py), [canonical_resolver.py](file:///d:/New%20folder%20(5)/Music%20Identifier/backend/api/services/canonical_resolver.py).
  * **API & Worker:** [analysis.py](file:///d:/New%20folder%20(5)/Music%20Identifier/backend/api/routes/analysis.py), [worker.py](file:///d:/New%20folder%20(5)/Music%20Identifier/backend/api/jobs/worker.py).
  * **Frontend UI & State:** [AnalysisPage.tsx](file:///d:/New%20folder%20(5)/Music%20Identifier/frontend/src/pages/AnalysisPage.tsx), [TrackTable.tsx](file:///d:/New%20folder%20(5)/Music%20Identifier/frontend/src/components/TrackTable.tsx), [client.ts](file:///d:/New%20folder%20(5)/Music%20Identifier/frontend/src/api/client.ts).
- Verify database schemas, foreign keys, and query filters in [database.py](file:///d:/New%20folder%20(5)/Music%20Identifier/backend/api/models/database.py).

### Step 3: Implement the Fix
- Make surgical, production-grade code adjustments.
- Do not ask for user approval for ordinary, reversible local code edits.
- Only prompt the user if an action involves destructive data deletion, production cloud modifications, or significant financial API costs.

### Step 4: Run Automated Tests
- Run the all-in-one verification runner (tests + backend import + frontend build):
  ```bash
  cmd /c "python .agents/skills/split-the-mix-autonomous-debugger/scripts/run_checks.py"
  ```
- Or run targeted backend unit and regression tests directly:
  ```bash
  cmd /c "python -m unittest backend.tests.test_audio_engine -v"
  ```
- Add a new regression test covering the fixed bug in `backend/tests/test_audio_engine.py` to ensure it can never regress.

### Step 5: Test Application on Localhost
- **Backend Import & Health:**
  ```bash
  python -c "import sys; sys.path.insert(0, 'backend'); import main; print(main.app.title)"
  ```
- **Frontend Build Validation:**
  ```bash
  cmd /c "cd /d frontend && npm run build"
  ```
- If testing an active server flow, start the service locally on port 8000/5173 and perform test API requests or inspect UI behavior.

### Step 6: Console, Network, & Log Inspection
- Inspect Uvicorn application logs and error outputs for unhandled exceptions or connection drops.
- Inspect network requests for HTTP 429 rate-limiting, 403 blocks, or JSON parsing anomalies.
- Inspect frontend bundle output for TypeScript errors or broken imports.

### Step 7: Autonomous Retry Loop
- If any test fails, if a build error occurs, or if the reproduction script still fails:
  * **DO NOT STOP.**
  * Re-read the failure output, isolate the new discrepancy, refine the implementation, and re-test.
  * Repeat this cycle until the verification criteria pass cleanly.

### Step 8: Final Regression & Resolution Verification
- Confirm:
  1. The original bug is completely resolved.
  2. All automated tests pass ($100\%$).
  3. Frontend build is clean ($0\text{ errors}$).
  4. The 3-minute performance budget and $<100\text{ MB}$ memory budget are intact.
  5. Temporary test databases and scratch files are cleaned up.
- Present a concise, factual summary of the root cause, fix, and test outputs to the user.
