@echo off
echo ============================================
echo   MixTrace - DJ Mix Tracklist Identifier
echo ============================================
echo.
echo Starting backend on http://localhost:8000 ...
start "MixTrace Backend" cmd /k "cd /d ""%~dp0backend"" && python -m uvicorn main:app --reload --port 8000"
timeout /t 3 /nobreak >nul
echo Starting frontend on http://localhost:5173 ...
start "MixTrace Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"
echo.
echo Both servers starting. Open http://localhost:5173 in your browser.
echo Close the terminal windows to stop the servers.
pause
