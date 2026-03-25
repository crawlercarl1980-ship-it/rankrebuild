$pat = "sbp_e3c7a56812a2f7cbbcff14870d6b08149a8ded34"
$body = '{"site_url":"https://rankrebuild.com","additional_redirect_urls":["https://rankrebuild.com/auth/callback","http://localhost:3000/auth/callback"]}'
Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/quidjhmupbampaaevmvl/config/auth" -Method PATCH -Headers @{Authorization="Bearer $pat"; "Content-Type"="application/json"} -Body $body | ConvertTo-Json
