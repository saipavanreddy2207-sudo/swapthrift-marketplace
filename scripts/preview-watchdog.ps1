<#
.SYNOPSIS
Self-healing public preview: keeps frontend, API, proxy and tunnel alive and
updates the stable redirect page whenever the tunnel URL rotates.

This is for temporary no-account demos only. For production use Vercel + Render.
#>
param(
  [string]$StateDir = 'C:\Users\pedaveti sai pavan\AppData\Local\Temp\opencode',
  [int]$IntervalSeconds = 45
)

$ErrorActionPreference = 'SilentlyContinue'
$project = 'C:\Projects\SwapThrift'
$cfgPath = Join-Path $StateDir 'preview-static.json'
$statusPath = Join-Path $StateDir 'preview-status.json'
$tunnelLog = Join-Path $StateDir 'main-tunnel.err'
$cfg = Get-Content $cfgPath -Raw | ConvertFrom-Json

function Test-Url([string]$url) {
  if (-not $url) { return $false }
  try {
    $code = curl.exe -sS -o NUL -w '%{http_code}' --max-time 12 $url
    return ($code -eq '200')
  } catch {
    return $false
  }
}

function Get-TunnelUrl {
  if (-not (Test-Path $tunnelLog)) { return $null }
  $raw = Get-Content $tunnelLog -Raw
  $matches = [regex]::Matches($raw, 'https://[a-z0-9-]+\.trycloudflare\.com')
  if ($matches.Count -eq 0) { return $null }
  return $matches[$matches.Count - 1].Value
}

function Stop-ProcessMatch([string]$pattern) {
  $procs = Get-CimInstance Win32_Process | Where-Object {
    $_.CommandLine -and $_.CommandLine -match $pattern -and $_.ProcessId -ne $PID
  }
  foreach ($p in $procs) { taskkill /PID $p.ProcessId /T /F 2>$null | Out-Null }
}

function Start-Backend {
  Stop-ProcessMatch 'node server\.js'
  Start-Process -FilePath 'cmd.exe' `
    -ArgumentList '/c','cd /d C:\Projects\SwapThrift\backend && npm start' `
    -RedirectStandardOutput (Join-Path $StateDir 'live-backend.log') `
    -RedirectStandardError (Join-Path $StateDir 'live-backend.err') `
    -WindowStyle Hidden | Out-Null
}

function Start-Frontend {
  Stop-ProcessMatch 'vite preview --host 127\.0\.0\.1 --port 5173'
  Start-Process -FilePath 'cmd.exe' `
    -ArgumentList '/c','cd /d C:\Projects\SwapThrift\frontend && npm run preview -- --host 127.0.0.1 --port 5173' `
    -RedirectStandardOutput (Join-Path $StateDir 'live-frontend.log') `
    -RedirectStandardError (Join-Path $StateDir 'live-frontend.err') `
    -WindowStyle Hidden | Out-Null
}

function Start-Proxy {
  Stop-ProcessMatch 'preview-proxy\.js'
  Start-Process -FilePath 'node' `
    -ArgumentList (Join-Path $project 'scripts\preview-proxy.js') `
    -RedirectStandardOutput (Join-Path $StateDir 'proxy.log') `
    -RedirectStandardError (Join-Path $StateDir 'proxy.err') `
    -WindowStyle Hidden | Out-Null
}

function Start-Tunnel {
  Stop-ProcessMatch 'cloudflared tunnel --no-autoupdate --url http://127\.0\.0\.1:4000'
  if (Test-Path $tunnelLog) {
    Move-Item $tunnelLog (Join-Path $StateDir 'main-tunnel-previous.err') -Force
  }
  Start-Process -FilePath 'cmd.exe' `
    -ArgumentList '/c npx.cmd --yes cloudflared tunnel --no-autoupdate --url http://127.0.0.1:4000' `
    -RedirectStandardOutput (Join-Path $StateDir 'main-tunnel.log') `
    -RedirectStandardError $tunnelLog `
    -WindowStyle Hidden | Out-Null
}

function Update-Redirect([string]$url) {
  $text = "# SwapThrift`n`n**Gutes finden. Weitergeben.**`n`nDer nachhaltige Marktplatz fuer Deutschland.`n`n[Marktplatz jetzt oeffnen]($url)`n`nHinweis: Die Demo laeuft auf einem automatisch erneuerten Tunnel. Dieser Link bleibt immer aktuell."
  $body = 'edit_code=' + [uri]::EscapeDataString($cfg.editCode) + '&text=' + [uri]::EscapeDataString($text) + '&update_mode=replace'
  curl.exe -sS --max-time 25 -X POST -d $body "https://rentry.co/api/edit/$($cfg.slug)" | Out-Null

  # Keep local-upload URLs and CORS aligned with the current tunnel origin.
  $envPath = Join-Path $project 'backend\.env'
  $lines = Get-Content $envPath
  $lines = $lines | Where-Object { $_ -notmatch '^(CLIENT_URL|CORS_ORIGINS|API_PUBLIC_URL)=' }
  $lines += "CLIENT_URL=$url"
  $lines += "CORS_ORIGINS=$url,http://localhost:5173"
  $lines += "API_PUBLIC_URL=$url"
  $lines | Set-Content $envPath
  Start-Backend
}

$lastUrl = $null
if (Test-Path $statusPath) {
  $lastStatus = Get-Content $statusPath -Raw | ConvertFrom-Json
  $lastUrl = $lastStatus.directUrl
}

while ($true) {
  try {
    if (-not (Test-Url 'http://127.0.0.1:5000/api/health')) { Start-Backend }
    if (-not (Test-Url 'http://127.0.0.1:5173/')) { Start-Frontend }
    if (-not (Test-Url 'http://127.0.0.1:4000/api/health')) { Start-Proxy }

    $url = Get-TunnelUrl
    if (-not (Test-Url "$url/api/health")) {
      Start-Tunnel
      for ($i = 0; $i -lt 18; $i++) {
        Start-Sleep -Seconds 5
        $url = Get-TunnelUrl
        if ($url -and (Test-Url "$url/api/health")) { break }
      }
    }

    if ($url -and ($url -ne $lastUrl)) {
      Update-Redirect $url
      $lastUrl = $url
    }

    $status = [ordered]@{
      checkedAt = (Get-Date).ToString('o')
      directUrl = $url
      stableUrl = $cfg.shortUrl
      healthy = [bool](Test-Url "$url/api/health")
    }
    $status | ConvertTo-Json | Set-Content $statusPath
  } catch {
    @{ checkedAt = (Get-Date).ToString('o'); error = $_.Exception.Message } | ConvertTo-Json | Set-Content $statusPath
  }

  Start-Sleep -Seconds $IntervalSeconds
}
