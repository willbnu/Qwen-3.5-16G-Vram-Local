param(
    [string]$ReleaseRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. "$PSScriptRoot\worktree-common.ps1"

$repoRoot = Get-RepoRoot
$paths = Get-WorkspacePaths -RepoRoot $repoRoot
if (-not $ReleaseRoot) {
    $ReleaseRoot = $paths.ReleaseRoot
}

if (-not (Test-Path $ReleaseRoot)) {
    throw "Release workspace not found at $ReleaseRoot"
}

$pythonExe = Get-PythonExe
$gitleaksExe = Get-GitleaksExe

Write-Host ""
Write-Host "Running release checks in $ReleaseRoot" -ForegroundColor Cyan

Write-Host ""
Write-Host "[1/5] Python tests" -ForegroundColor Yellow
Invoke-Checked -Exe $pythonExe -Arguments @("-m", "pytest", "tests/", "-v") -WorkingDirectory $ReleaseRoot

Write-Host ""
Write-Host "[2/5] Dashboard dependency audit" -ForegroundColor Yellow
Invoke-Npm -RepoRoot $ReleaseRoot -WorkingDirectory (Join-Path $ReleaseRoot "dashboard") -Arguments @("audit", "--audit-level=moderate")

Write-Host ""
Write-Host "[3/5] Dashboard build" -ForegroundColor Yellow
Invoke-Npm -RepoRoot $ReleaseRoot -WorkingDirectory (Join-Path $ReleaseRoot "dashboard") -Arguments @("run", "build")

Write-Host ""
Write-Host "[4/5] Gitleaks" -ForegroundColor Yellow
Invoke-Checked -Exe $gitleaksExe -Arguments @("detect", "--source", ".", "--config", ".gitleaks.toml", "--no-banner") -WorkingDirectory $ReleaseRoot

Write-Host ""
Write-Host "[5/5] Semgrep" -ForegroundColor Yellow
Invoke-Semgrep -RepoRoot $ReleaseRoot

Write-Host ""
Write-Host "Release checks passed." -ForegroundColor Green
