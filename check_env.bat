@echo off
setlocal EnableExtensions
rem Auto1 environment check (read-only). Nothing is installed or changed.
rem Result is shown on screen and saved to check_result.txt next to this file.

set "OUT=%~dp0check_result.txt"
call :main > "%OUT%" 2>&1
type "%OUT%"
echo.
echo ================================================
echo Saved to: %OUT%
echo Copy the whole text above (or send the file) back to the assistant.
echo ================================================
pause
exit /b 0

:main
echo ===== Auto1 environment check =====
echo Date: %DATE% %TIME%
echo User: %USERNAME%   Computer: %COMPUTERNAME%
echo Script folder: %~dp0
echo.

echo ----- [1] Windows / hardware -----
ver
for /f "usebackq tokens=*" %%A in (`powershell -NoProfile -Command "$o=Get-CimInstance Win32_OperatingSystem; $c=Get-CimInstance Win32_ComputerSystem; $p=Get-CimInstance Win32_Processor | Select-Object -First 1; 'OS: ' + $o.Caption + ' build ' + $o.BuildNumber + ' ' + $o.OSArchitecture; 'RAM_GB: ' + [math]::Round($c.TotalPhysicalMemory/1GB,1); 'CPU: ' + $p.Name; Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3' | ForEach-Object { 'Disk ' + $_.DeviceID + ' free_GB=' + [math]::Round($_.FreeSpace/1GB,1) + ' total_GB=' + [math]::Round($_.Size/1GB,1) }; $g=Get-CimInstance Win32_VideoController | ForEach-Object { $_.Name }; 'GPU: ' + ($g -join ', ')" 2^>nul`) do echo %%A
net session >nul 2>&1
if errorlevel 1 (echo Admin rights: NO) else (echo Admin rights: YES)
echo.

echo ----- [2] Python / Node.js -----
call :probe py "py -3 --version"
call :probe python "python --version"
call :probe node "node --version"
call :probe npx "npx --version"
call :probe git "git --version"
echo.

echo ----- [3] Ollama -----
call :probe ollama "ollama --version"
where ollama >nul 2>&1 && (
  echo [ollama list]
  ollama list 2>&1
  echo [ollama ps]
  ollama ps 2>&1
)
set "OLLAMA_REPLY="
for /f "delims=" %%A in ('curl -s -m 3 http://localhost:11434 2^>nul') do set "OLLAMA_REPLY=%%A"
if defined OLLAMA_REPLY (echo Ollama server: RUNNING ^(%OLLAMA_REPLY%^)) else (echo Ollama server: NOT RESPONDING on 11434)
if defined OLLAMA_MODELS echo OLLAMA_MODELS env: %OLLAMA_MODELS%
echo.

echo ----- [4] Browsers -----
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" echo Chrome: installed
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" echo Chrome: installed ^(x86^)
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" echo Chrome: installed ^(user^)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" echo Edge: installed
if exist "%ProgramFiles%\Mozilla Firefox\firefox.exe" echo Firefox: installed
echo.

echo ----- [5] Auto1 app folders -----
set "FOUND="
for %%R in ("%~dp0." "%USERPROFILE%\Downloads" "%USERPROFILE%\Desktop" "%USERPROFILE%\Documents" "%USERPROFILE%" "C:\") do (
  for /d %%D in ("%%~R\portfolio5*" "%%~R\auto1*") do (
    if exist "%%~D\app\app.js" (
      set "FOUND=1"
      echo Found: %%~D
      call :appinfo "%%~D"
    )
  )
)
if exist "%~dp0app\app.js" (
  echo This script's folder has an app: %~dp0
  call :appinfo "%~dp0."
)
if not defined FOUND echo No portfolio5*/auto1* folder with app\app.js in the usual places.
echo.

echo ----- [6] Network (blocked by school firewall?) -----
call :net https://github.com
call :net https://raw.githubusercontent.com
call :net https://ollama.com
call :net https://registry.npmjs.org
call :net https://nodejs.org
call :net https://www.python.org
echo Proxy setting:
reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyEnable 2>nul | findstr /I ProxyEnable
echo.

echo ----- [7] Ports in use -----
netstat -ano | findstr LISTENING | findstr /C:":3000 " /C:":3001 " /C:":3002 " /C:":11434 "
echo (no lines above = none of 3000/3001/3002/11434 is in use)
echo.
echo ===== end =====
exit /b 0

:probe
rem %1 = command name to look up, %2 = full command (quoted) to print its version
where %1 >nul 2>&1
if errorlevel 1 (echo %1: not found & exit /b 0)
for /f "delims=" %%P in ('where %1 2^>nul') do (echo %1: %%P & goto :probe_ver)
:probe_ver
for /f "delims=" %%V in ('%~2 2^>^&1') do (echo    version: %%V & goto :probe_done)
:probe_done
exit /b 0

:appinfo
rem %1 = app root folder
if exist "%~1\start.bat" (echo    start.bat: yes) else (echo    start.bat: NO ^(old version^))
findstr /C:"extractRubricFromPlan" "%~1\app\app.js" >nul 2>&1 && (echo    rubric extraction: yes) || (echo    rubric extraction: NO ^(old version^))
findstr /C:"saveTemplate" "%~1\app\app.js" >nul 2>&1 && (echo    templates: yes) || (echo    templates: NO ^(old version^))
if exist "%~1\app\vendor\pdfjs\pdf.min.mjs" (echo    pdf.js: yes) else (echo    pdf.js: NO)
exit /b 0

:net
curl -s -o nul -m 6 -w "%~1 -> HTTP %%{http_code}\n" %~1 2>nul || echo %~1 -> FAILED ^(blocked or offline^)
exit /b 0
