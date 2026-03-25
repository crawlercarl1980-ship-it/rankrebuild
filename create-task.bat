@echo off
schtasks /create /tn "RankRebuildDev" /tr "C:\Users\carl\Projects\rankrebuild\start-server.bat" /sc onlogon /ru "%USERNAME%" /f
echo Task created. RankRebuild will start automatically on login.
pause
