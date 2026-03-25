$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c cd /d C:\Users\carl\Projects\rankrebuild && npm run dev" -WorkingDirectory "C:\Users\carl\Projects\rankrebuild"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Hours 0) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
Register-ScheduledTask -TaskName "RankRebuildDev" -Action $action -Trigger $trigger -Settings $settings -Force
Write-Host "Task registered. RankRebuild will auto-start on login."
