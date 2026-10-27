@echo off
setlocal EnableExtensions
rem Auto1 launcher for Windows: starts the local web server for app\ and opens the browser.
rem Needs Python 3 or Node.js. Ollama is only needed for AI scoring.

rem --- auto update: only when this folder is a git clone (not a ZIP download) ---
if exist "%~dp0.git" (
  where git >nul 2>&1
  if errorlevel 1 (
    echo [WARN] git not found - skipping update check.
  ) else (
    echo Checking for updates...
    git -C "%~dp0." pull --ff-only
    if errorlevel 1 (
      echo [WARN] Update failed. Continuing with the current version.
      echo        ^(offline, or local changes in this folder block the update^)
    )
    echo.
  )
)

cd /d "%~dp0app" || (
  echo [ERROR] Cannot find the "app" folder next to start.bat.
  echo         Unzip the whole portfolio5 folder and run start.bat from inside it.
  pause
  exit /b 1
)

rem --- Ollama check (warning only; the app still works without it) ---
curl -s -m 2 http://localhost:11434 >nul 2>&1
if errorlevel 1 (
  echo [WARN] Ollama is not responding on http://localhost:11434
  echo        AI scoring and rubric extraction will not work until Ollama is running.
  echo        Start Ollama from the Start menu, then keep using this window.
  echo.
) else (
  echo [OK] Ollama is running.
)

rem --- pick a free port starting at 3000 ---
set PORT=3000
:findport
netstat -ano | findstr /R /C:":%PORT% .*LISTENING" >nul
if not errorlevel 1 (
  set /a PORT+=1
  if %PORT% GTR 3020 (
    echo [ERROR] No free port between 3000 and 3020.
    pause
    exit /b 1
  )
  goto findport
)

rem --- open the browser after the server has had a moment to start ---
start "" /min cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:%PORT%"

echo.
echo Auto1 is running at http://localhost:%PORT%
echo Keep this window open while using the app. Close it (or press Ctrl+C) to stop.
echo.

rem --- start the server: Python first (works offline), then Node.js ---
where py >nul 2>&1 && (
  py -3 --version >nul 2>&1 && (
    py -3 -m http.server %PORT%
    goto :end
  )
)
python --version >nul 2>&1 && (
  python -m http.server %PORT%
  goto :end
)
where npx >nul 2>&1 && (
  call npx --yes serve . -l %PORT%
  goto :end
)

echo [ERROR] Neither Python 3 nor Node.js was found.
echo         Install one of them (see INSTALL_GUIDE.md, step 4) and run start.bat again.

:end
pause
