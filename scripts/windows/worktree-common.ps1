Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-RepoRoot {
    $root = (& git rev-parse --show-toplevel).Trim()
    if (-not $root) {
        throw "Unable to determine the git repository root."
    }
    return (Normalize-Path $root)
}

function Normalize-Path {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PathValue
    )

    return [System.IO.Path]::GetFullPath($PathValue)
}

function Get-WorkspacePaths {
    param(
        [string]$RepoRoot = (Get-RepoRoot)
    )

    $parent = Split-Path (Normalize-Path $RepoRoot) -Parent
    return @{
        DevRoot = (Normalize-Path (Join-Path $parent "qwen-llm-git"))
        ReleaseRoot = (Normalize-Path (Join-Path $parent "qwen-llm-release-git"))
    }
}

function Get-CurrentBranch {
    param(
        [string]$RepoRoot = (Get-RepoRoot)
    )

    return (& git -C $RepoRoot branch --show-current).Trim()
}

function Test-NoTrackedChanges {
    param(
        [string]$RepoRoot = (Get-RepoRoot)
    )

    $staged = @(& git -C $RepoRoot diff --cached --name-only)
    $unstaged = @(& git -C $RepoRoot diff --name-only)
    return ($staged.Count -eq 0 -and $unstaged.Count -eq 0)
}

function Assert-NoTrackedChanges {
    param(
        [string]$RepoRoot = (Get-RepoRoot),
        [string]$Message = "Tracked changes must be committed or stashed before continuing."
    )

    if (-not (Test-NoTrackedChanges -RepoRoot $RepoRoot)) {
        throw $Message
    }
}

function Invoke-Checked {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Exe,
        [string[]]$Arguments = @(),
        [string]$WorkingDirectory
    )

    if ($WorkingDirectory) {
        Push-Location $WorkingDirectory
    }

    try {
        & $Exe @Arguments
        if ($LASTEXITCODE -ne 0) {
            $joined = ($Arguments -join " ")
            throw "Command failed: $Exe $joined"
        }
    }
    finally {
        if ($WorkingDirectory) {
            Pop-Location
        }
    }
}

function Get-PythonExe {
    $python = Get-Command python -ErrorAction SilentlyContinue
    if ($python) {
        return $python.Source
    }

    throw "python was not found in PATH."
}

function Get-GitleaksExe {
    $gitleaks = Get-Command gitleaks -ErrorAction SilentlyContinue
    if ($gitleaks) {
        return $gitleaks.Source
    }

    $wingetLink = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Links\gitleaks.exe"
    if (Test-Path $wingetLink) {
        return $wingetLink
    }

    throw "gitleaks was not found. Install it with: winget install --id Gitleaks.Gitleaks -e"
}

function Get-SemgrepExe {
    $semgrep = Get-Command semgrep -ErrorAction SilentlyContinue
    if ($semgrep) {
        return $semgrep.Source
    }

    throw "semgrep was not found. Install it with: pip install semgrep"
}

function Get-NpmInvoker {
    param(
        [string]$RepoRoot = (Get-RepoRoot)
    )

    $npm = Get-Command npm -ErrorAction SilentlyContinue
    if ($npm) {
        return @{
            Exe = $npm.Source
            PrefixArgs = @()
        }
    }

    $node = Get-Command node -ErrorAction SilentlyContinue
    if (-not $node) {
        throw "node was not found in PATH."
    }

    $toolsRoot = Join-Path $RepoRoot ".tools\npm"
    $packageRoot = Join-Path $toolsRoot "package"
    $npmCli = Join-Path $packageRoot "bin\npm-cli.js"
    $tarball = Join-Path $toolsRoot "npm.tgz"

    if (-not (Test-Path $npmCli)) {
        New-Item -ItemType Directory -Force -Path $toolsRoot | Out-Null

        if (-not (Test-Path $tarball)) {
            $meta = Invoke-RestMethod "https://registry.npmjs.org/npm/latest"
            Invoke-WebRequest -Uri $meta.dist.tarball -OutFile $tarball | Out-Null
        }

        if (Test-Path $packageRoot) {
            Remove-Item -Recurse -Force $packageRoot
        }

        Invoke-Checked -Exe "tar" -Arguments @("-xf", $tarball, "-C", $toolsRoot)
    }

    return @{
        Exe = $node.Source
        PrefixArgs = @($npmCli)
    }
}

function Invoke-Npm {
    param(
        [string[]]$Arguments,
        [string]$RepoRoot = (Get-RepoRoot),
        [string]$WorkingDirectory
    )

    $npm = Get-NpmInvoker -RepoRoot $RepoRoot
    Invoke-Checked -Exe $npm.Exe -Arguments ($npm.PrefixArgs + $Arguments) -WorkingDirectory $WorkingDirectory
}

function Invoke-Semgrep {
    param(
        [string]$RepoRoot = (Get-RepoRoot)
    )

    $semgrepExe = Get-SemgrepExe
    $originalUtf8 = $env:PYTHONUTF8
    $originalEncoding = $env:PYTHONIOENCODING
    $env:PYTHONUTF8 = "1"
    $env:PYTHONIOENCODING = "utf-8"

    try {
        Invoke-Checked -Exe $semgrepExe -Arguments @(
            "scan",
            "--config", "auto",
            ".",
            "--exclude", ".tools",
            "--exclude", "dashboard/dist",
            "--exclude", "gitleaks-report.json"
        ) -WorkingDirectory $RepoRoot
    }
    finally {
        $env:PYTHONUTF8 = $originalUtf8
        $env:PYTHONIOENCODING = $originalEncoding
    }
}
