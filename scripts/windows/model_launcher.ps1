# launch_model.ps1 — called by start_chat_server.bat
# Usage: powershell -File launch_model.ps1 -Model 35b
# Args:  35b | 9b | 27b
#        -LanMode to bind to 0.0.0.0 (accessible from LAN)
param(
    [string]$Model = "35b",
    [switch]$LanMode
)

$ROOT    = (Resolve-Path (Join-Path (Split-Path $MyInvocation.MyCommand.Path) "..\..")).Path
$EXE_SM120 = "$ROOT\llama.cpp\build-sm120\bin\Release\llama-server.exe"
$EXE_PREBUILT = "$ROOT\llama-bin\llama-server.exe"

# Detect binary: SM120 native > prebuilt fallback
if (Test-Path $EXE_SM120) {
    $EXE = $EXE_SM120
    Write-Host "[INFO] Using SM120 native build" -ForegroundColor Green
} elseif (Test-Path $EXE_PREBUILT) {
    $EXE = $EXE_PREBUILT
    Write-Host "[INFO] Using prebuilt binary" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "[ERROR] llama-server.exe not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Checked:" -ForegroundColor Gray
    Write-Host "    - $EXE_SM120"
    Write-Host "    - $EXE_PREBUILT"
    Write-Host ""
    Write-Host "  Fix: Download from https://github.com/ggml-org/llama.cpp/releases" -ForegroundColor Cyan
    Write-Host "  Extract to .\llama-bin\ folder."
    Write-Host ""
    exit 1
}

$MODELS  = "$ROOT\models\unsloth-gguf"
$LOGDIR  = "$ROOT\logs"

if (-not (Test-Path $LOGDIR)) { New-Item -ItemType Directory -Path $LOGDIR | Out-Null }

# ── Network binding ────────────────────────────────────────────────────────────
if ($LanMode) {
    $hostBind = "0.0.0.0"
    Write-Host "[INFO] LAN Mode: Accessible from network devices" -ForegroundColor Green
} else {
    $hostBind = "127.0.0.1"
    Write-Host "[INFO] Local Mode: localhost only" -ForegroundColor DarkGray
}

# ── Model config ──────────────────────────────────────────────────────────────
switch ($Model.ToLower()) {
    "35b" {
        $port    = 8002
        $model   = "$MODELS\Qwen3.5-35B-A3B-Q3_K_S.gguf"
        $mmproj  = "$MODELS\mmproj-35B-F16.gguf"
        $ctx     = 98304    # 96K context - full speed (120K causes graph splits slowdown)
        $extra   = @("--parallel", "1", "--reasoning-budget", "0")
    }
    "9b" {
        $port    = 8003
        $model   = "$MODELS\Qwen3.5-9B-UD-Q4_K_XL.gguf"
        $mmproj  = "$MODELS\mmproj-F16.gguf"
        $ctx     = 65536
        $extra   = @()
    }
    "27b" {
        $port    = 8004
        $model   = "$MODELS\Qwen3.5-27B-Q3_K_S.gguf"
        $mmproj  = "$MODELS\mmproj-27B-F16.gguf"
        $ctx     = 65536
        $extra   = @()
    }
    default {
        Write-Host "Unknown model: $Model. Use 35b, 9b, or 27b." -ForegroundColor Red
        exit 1
    }
}

$logfile = "$LOGDIR\server-$port-err.log"

# ── Build argument list ───────────────────────────────────────────────────────
$argList = @(
    "-m",           $model,
    "--mmproj",     $mmproj,
    "--host",       $hostBind,
    "--port",       "$port",
    "-c",           "$ctx",
    "-ngl",         "99",
    "--flash-attn", "on",
    "-ctk",         "iq4_nl",
    "-ctv",         "iq4_nl",
    "--temp",       "0.6",
    "--top-p",      "0.95",
    "--top-k",      "20",
    "--presence-penalty", "0.0"
) + $extra

# ── Launch via ProcessStartInfo so env var is injected into child ─────────────
$psi = [System.Diagnostics.ProcessStartInfo]::new($EXE)
$psi.UseShellExecute        = $false
$psi.CreateNoWindow         = $true
$psi.RedirectStandardError  = $false   # NO redirect = process stays alive
$psi.RedirectStandardOutput = $false

# Build single argument string (ProcessStartInfo.Arguments)
$psi.Arguments = ($argList | ForEach-Object {
    if ($_ -match '\s') { "`"$_`"" } else { $_ }
}) -join " "

# Inject thinking=off directly into child's environment
$psi.EnvironmentVariables["LLAMA_CHAT_TEMPLATE_KWARGS"] = '{"enable_thinking":false}'

Write-Host "[*] Launching $Model model on port $port..." -ForegroundColor Cyan
Write-Host "[*] Args: $($psi.Arguments)" -ForegroundColor DarkGray
Write-Host ""

$proc = [System.Diagnostics.Process]::Start($psi)
Write-Host "[*] PID: $($proc.Id)" -ForegroundColor Green

# Save PID for easy kill later
$proc.Id | Out-File "$logfile.pid" -Encoding ascii

Write-Host ""
Write-Host "[*] Model loading..." -ForegroundColor Yellow
Write-Host "    35B/27B: ~30-60s   9B: ~15s" -ForegroundColor DarkGray
Write-Host ""
Write-Host "    Poll until ready:" -ForegroundColor DarkGray
Write-Host "      curl http://127.0.0.1:$port/health" -ForegroundColor White
if ($LanMode) {
    Write-Host ""
    Write-Host "    LAN Access (from other devices):" -ForegroundColor Green
    Write-Host "      Browser: http://192.168.1.87:$port" -ForegroundColor White
    Write-Host "      API:     http://192.168.1.87:$port/v1/chat/completions" -ForegroundColor White
}
Write-Host ""
Write-Host "    When health = ok, open a NEW terminal:" -ForegroundColor DarkGray
switch ($port) {
    8002 { Write-Host "      python chat.py" -ForegroundColor White }
    8003 { Write-Host "      python chat.py --port 8003" -ForegroundColor White }
    8004 { Write-Host "      python chat.py --port 8004" -ForegroundColor White }
}
Write-Host ""
