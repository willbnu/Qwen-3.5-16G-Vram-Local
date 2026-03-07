param(
    [Parameter(Mandatory = $true, ValueFromRemainingArguments = $true)]
    [string[]]$CommitShas
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. "$PSScriptRoot\worktree-common.ps1"

$repoRoot = Get-RepoRoot
$paths = Get-WorkspacePaths -RepoRoot $repoRoot

if ($repoRoot -ne $paths.DevRoot) {
    throw "Run promote-to-release.ps1 from the dev workspace at $($paths.DevRoot). Current root: $repoRoot"
}

if (-not (Test-Path $paths.ReleaseRoot)) {
    throw "Release workspace not found at $($paths.ReleaseRoot). Run setup-worktrees.ps1 first."
}

$devBranch = Get-CurrentBranch -RepoRoot $paths.DevRoot
if ($devBranch -eq "main") {
    throw "Promotion must run from the dev workspace branch, not from main."
}

$releaseBranch = Get-CurrentBranch -RepoRoot $paths.ReleaseRoot
if ($releaseBranch -ne "main") {
    throw "Release workspace must be on 'main'. Current branch: $releaseBranch"
}

Assert-NoTrackedChanges -RepoRoot $paths.ReleaseRoot -Message "Release workspace has tracked changes. Commit, stash, or reset it before promotion."

foreach ($sha in $CommitShas) {
    & git -C $paths.DevRoot rev-parse --verify "$sha^{commit}" *> $null
    if ($LASTEXITCODE -ne 0) {
        throw "Commit not found in dev workspace: $sha"
    }
}

Write-Host ""
Write-Host "Promoting commits into release workspace..." -ForegroundColor Cyan
Write-Host "  Dev workspace     : $($paths.DevRoot)" -ForegroundColor White
Write-Host "  Release workspace : $($paths.ReleaseRoot)" -ForegroundColor White
Write-Host ""

foreach ($sha in $CommitShas) {
    Write-Host "Cherry-picking $sha..." -ForegroundColor Yellow
    & git -C $paths.ReleaseRoot cherry-pick $sha
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Cherry-pick stopped on a conflict." -ForegroundColor Red
        Write-Host "Resolve it in: $($paths.ReleaseRoot)" -ForegroundColor White
        Write-Host "Continue with : git -C `"$($paths.ReleaseRoot)`" add <files>" -ForegroundColor White
        Write-Host "Then run      : git -C `"$($paths.ReleaseRoot)`" cherry-pick --continue" -ForegroundColor White
        Write-Host "Or abort with : git -C `"$($paths.ReleaseRoot)`" cherry-pick --abort" -ForegroundColor White
        exit 1
    }
}

Write-Host ""
Write-Host "Promotion complete." -ForegroundColor Green
Write-Host "Review the clean workspace at $($paths.ReleaseRoot), then run check-release.ps1." -ForegroundColor White
