@echo off
:loop
echo [keep-alive] Checking RankRebuild server...
netstat -an | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %errorlevel% == 0 (
    echo [keep-alive] Server is already running on port 3000
    timeout /t 30 /nobreak >nul
    goto loop
)
echo [keep-alive] Starting RankRebuild server...
cd /d C:\Users\carl\Projects\rankrebuild
npm run start
echo [keep-alive] Server stopped, restarting in 5 seconds...
timeout /t 5 /nobreak >nul
goto loop
