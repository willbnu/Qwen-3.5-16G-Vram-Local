Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. "$PSScriptRoot\worktree-common.ps1"

$repoRoot = Get-RepoRoot
$paths = Get-WorkspacePaths -RepoRoot $repoRoot

if ($repoRoot -ne $paths.ReleaseRoot) {
    throw "push-release.ps1 must run from the release workspace at $($paths.ReleaseRoot). Current root: $repoRoot"
}

$branch = Get-CurrentBranch -RepoRoot $repoRoot
if ($branch -ne "main") {
    throw "push-release.ps1 only allows pushes from the 'main' branch. Current branch: $branch"
}

if (@(& git -C $repoRoot status --porcelain).Count -ne 0) {
    throw "Release workspace is not clean. Commit or remove local changes before pushing."
}

& "$PSScriptRoot\check-release.ps1" -ReleaseRoot $repoRoot
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Pushing main from release workspace..." -ForegroundColor Yellow
Invoke-Checked -Exe "git" -Arguments @("-C", $repoRoot, "push", "origin", "main")
Write-Host "Push complete." -ForegroundColor Green
