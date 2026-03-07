Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. "$PSScriptRoot\worktree-common.ps1"

$repoRoot = Get-RepoRoot
$paths = Get-WorkspacePaths -RepoRoot $repoRoot

if ($repoRoot -ne $paths.DevRoot) {
    throw "Run setup-worktrees.ps1 from the dev workspace at $($paths.DevRoot). Current root: $repoRoot"
}

$personalBranch = "personal/dev"
$currentBranch = Get-CurrentBranch -RepoRoot $repoRoot
& git -C $repoRoot show-ref --verify --quiet "refs/heads/$personalBranch"
$hasPersonalBranch = ($LASTEXITCODE -eq 0)
$releaseExists = Test-Path $paths.ReleaseRoot
$needsInitialization = ($currentBranch -eq "main") -or (-not $releaseExists)

if ($needsInitialization) {
    Assert-NoTrackedChanges -RepoRoot $repoRoot -Message "Commit or stash tracked changes before initializing worktrees."
}

if ($currentBranch -eq "main") {
    if ($hasPersonalBranch) {
        Invoke-Checked -Exe "git" -Arguments @("-C", $repoRoot, "switch", $personalBranch)
    }
    else {
        Invoke-Checked -Exe "git" -Arguments @("-C", $repoRoot, "switch", "-c", $personalBranch)
    }
}
elseif ($currentBranch -ne $personalBranch) {
    throw "The dev workspace must be on '$personalBranch' or 'main'. Current branch: $currentBranch"
}

if ($releaseExists) {
    $releaseBranch = Get-CurrentBranch -RepoRoot $paths.ReleaseRoot
    if ($releaseBranch -ne "main") {
        throw "Existing release workspace is not on 'main': $($paths.ReleaseRoot)"
    }
}
else {
    Invoke-Checked -Exe "git" -Arguments @("worktree", "add", $paths.ReleaseRoot, "main") -WorkingDirectory $repoRoot
}

Write-Host ""
Write-Host "Two-worktree layout is ready." -ForegroundColor Green
Write-Host "  Dev workspace     : $($paths.DevRoot)" -ForegroundColor White
Write-Host "  Dev branch        : $(Get-CurrentBranch -RepoRoot $paths.DevRoot)" -ForegroundColor White
Write-Host "  Release workspace : $($paths.ReleaseRoot)" -ForegroundColor White
Write-Host "  Release branch    : $(Get-CurrentBranch -RepoRoot $paths.ReleaseRoot)" -ForegroundColor White
Write-Host ""
Write-Host "Rule: develop in qwen-llm-git, promote commits, push only from qwen-llm-release-git." -ForegroundColor Yellow
