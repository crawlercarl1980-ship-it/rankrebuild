Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d C:\Users\carl\Projects\sitepilot && npm run dev > dev.log 2>&1", 0, False
