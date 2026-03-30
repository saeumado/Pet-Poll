$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$lockPath = Join-Path $repoRoot ".next-dev.lock"
$nextDir = Join-Path $repoRoot ".next-dev"
$nextCmd = Join-Path $repoRoot "node_modules\.bin\next.cmd"
$port = 3000

function Get-LockingPid {
  if (-not (Test-Path $lockPath)) {
    return $null
  }

  $raw = (Get-Content $lockPath -ErrorAction SilentlyContinue | Select-Object -First 1)

  if (-not $raw) {
    Remove-Item $lockPath -Force -ErrorAction SilentlyContinue
    return $null
  }

  $pidValue = 0
  if (-not [int]::TryParse($raw.Trim(), [ref]$pidValue)) {
    Remove-Item $lockPath -Force -ErrorAction SilentlyContinue
    return $null
  }

  $runningProcess = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
  if ($null -eq $runningProcess) {
    Remove-Item $lockPath -Force -ErrorAction SilentlyContinue
    return $null
  }

  return $pidValue
}

function Get-PortListenerPid {
  $match = netstat -ano | Select-String -Pattern "^\s*TCP\s+\S+:$port\s+\S+\s+LISTENING\s+(\d+)\s*$" | Select-Object -First 1

  if ($null -eq $match) {
    return $null
  }

  return [int]$match.Matches[0].Groups[1].Value
}

$activeLockPid = Get-LockingPid
if ($null -ne $activeLockPid) {
  Write-Host "A dev server for this repo is already running on PID $activeLockPid." -ForegroundColor Yellow
  Write-Host "Stop that process first, or remove .next-dev.lock if it is stale." -ForegroundColor Yellow
  exit 1
}

$listenerPid = Get-PortListenerPid
if ($null -ne $listenerPid) {
  Write-Host "Port $port is already in use by PID $listenerPid." -ForegroundColor Yellow
  Write-Host "To avoid corrupting .next-dev, this script will not start a second dev server." -ForegroundColor Yellow
  exit 1
}

if (-not (Test-Path $nextCmd)) {
  Write-Error "Cannot find Next.js launcher at $nextCmd. Run npm install first."
}

if (Test-Path $nextDir) {
  Write-Host "Removing stale .next-dev output..." -ForegroundColor DarkYellow
  Remove-Item -LiteralPath $nextDir -Recurse -Force
}

try {
  Set-Location $repoRoot
  Set-Content -LiteralPath $lockPath -Value $PID
  & $nextCmd "dev"
  exit $LASTEXITCODE
} finally {
  Remove-Item -LiteralPath $lockPath -Force -ErrorAction SilentlyContinue
}
