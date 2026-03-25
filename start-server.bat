@echo off
echo [RankRebuild] Starting auto-restart server...
:loop
node server.js
echo [RankRebuild] Server crashed, restarting in 1 second...
timeout /t 1 /nobreak > nul
goto loop
