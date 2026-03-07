# Quick Native Benchmark for Qwen3.5 Models
# Uses llama-bench.exe for raw performance testing
# Run each model SEPARATELY (VRAM constraint)

param([string]$Model = "")

$ROOT = (Resolve-Path (Join-Path (Split-Path $MyInvocation.MyCommand.Path) "..\..")).Path

# Detect binary location
$benchSM120 = Join-Path $ROOT "llama.cpp\build-sm120\bin\Release\llama-bench.exe"
$benchPrebuilt = Join-Path $ROOT "llama-bin\llama-bench.exe"

if (Test-Path $benchSM120) {
    $benchExe = $benchSM120
    Write-Host "[INFO] Using SM120 native build" -ForegroundColor Green
} elseif (Test-Path $benchPrebuilt) {
    $benchExe = $benchPrebuilt
    Write-Host "[INFO] Using prebuilt binary" -ForegroundColor Yellow
} else {
    Write-Host "[ERROR] llama-bench.exe not found!" -ForegroundColor Red
    Write-Host "  Checked: $benchSM120" -ForegroundColor Gray
    Write-Host "  Checked: $benchPrebuilt" -ForegroundColor Gray
    exit 1
}

# Show usage if no model specified
if (-not $Model) {
    Write-Host ""
    Write-Host "Usage: .\quick_benchmark.ps1 -Model 35b|9b|27b" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\quick_benchmark.ps1 -Model 35b   # Test 35B only" -ForegroundColor White
    Write-Host "  .\quick_benchmark.ps1 -Model 9b    # Test 9B only" -ForegroundColor White
    Write-Host "  .\quick_benchmark.ps1 -Model 27b   # Test 27B only" -ForegroundColor White
    Write-Host ""
    Write-Host "Run each model SEPARATELY for accurate results!" -ForegroundColor Yellow
    Write-Host "Only one model can fit in 16GB VRAM at a time." -ForegroundColor Yellow
    exit 1
}

$modelsDir = Join-Path $ROOT "models\unsloth-gguf"

# Model configs
$configs = @{
    "35b" = @{
        model = "Qwen3.5-35B-A3B-Q3_K_S.gguf"
        mmproj = "mmproj-35B-F16.gguf"
        ctx = 122880
        extra = @("-ctk", "iq4_nl", "-ctv", "iq4_nl", "--parallel", "1", "--reasoning-budget", "0")
    }
    "9b" = @{
        model = "Qwen3.5-9B-UD-Q4_K_XL.gguf"
        mmproj = "mmproj-F16.gguf"
        ctx = 65536
        extra = @("-ctk", "q8_0", "-ctv", "q8_0")
    }
    "27b" = @{
        model = "Qwen3.5-27B-Q3_K_S.gguf"
        mmproj = "mmproj-27B-F16.gguf"
        ctx = 98304
        extra = @("-ctk", "iq4_nl", "-ctv", "iq4_nl", "--parallel", "1", "--reasoning-budget", "0")
    }
}

$config = $configs[$Model]

if (-not $config) {
    Write-Host "[ERROR] Unknown model: $Model" -ForegroundColor Red
    Write-Host "Use: 35b, 9b, or 27b" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Quick Benchmark: $Model model" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Model:   $($config.model)" -ForegroundColor DarkGray
Write-Host "  Context: $($config.ctx) tokens" -ForegroundColor DarkGray
Write-Host ""

# Run llama-bench
$benchArgs = @(
    "-m", (Join-Path $modelsDir $config.model),
    "--mmproj", (Join-Path $modelsDir $config.mmproj),
    "-p", "512",          # Prompt tokens
    "-n", "128",          # Generation tokens
    "-r", "3",            # Repetitions (quick)
    "-ngl", "99",         # All GPU layers
    "-fa", "1",           # Flash attention on
    "-b", "2048",         # Batch size
    "-o", "json",         # JSON output
    "--no-warmup"
) + $config.extra

$startTime = Get-Date
Write-Host "Running benchmark..." -ForegroundColor Yellow

$output = & $benchExe @benchArgs 2>&1
$elapsed = ((Get-Date) - $startTime).TotalSeconds

try {
    $data = $output | ConvertFrom-Json
    
    # Find prompt and gen tests
    $promptTest = $data | Where-Object { $_."n_prompt" -eq 512 -and $_."n_gen" -eq 0 } | Select-Object -First 1
    $genTest = $data | Where-Object { $_."n_prompt" -eq 0 -and $_."n_gen" -eq 128 } | Select-Object -First 1
    
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "  RESULTS" -ForegroundColor White
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "| Test   | Tokens | Speed (t/s) |" -ForegroundColor White
    Write-Host "|--------|--------|-------------|" -ForegroundColor DarkGray
    
    $promptTps = 0
    $genTps = 0
    
    if ($promptTest) {
        $promptTps = [math]::Round($promptTest.avg_ts)
        Write-Host ("| Prompt | 512    | {0,6} t/s |" -f $promptTps)
    }
    if ($genTest) {
        $genTps = [math]::Round($genTest.avg_ts)
        Write-Host ("| Gen    | 128    | {0,6} t/s |" -f $genTps)
    }
    
    Write-Host ""
    Write-Host "  Total time: $elapsed seconds" -ForegroundColor DarkGray
    Write-Host ""
    
    # Return values for scripting
    return @{ PromptTps = $promptTps; GenTps = $genTps; Time = $elapsed }
} catch {
    Write-Host ""
    Write-Host "[ERROR] Benchmark failed!" -ForegroundColor Red
    Write-Host "  Output: $output" -ForegroundColor DarkGray
    exit 1
}
