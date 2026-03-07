# download_model.ps1 - Download Qwen3.5 GGUF models from Unsloth/Bartowski
# NOTE: This script downloads AWQ format (legacy). For GGUF see README.md.

$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ModelDir = "$ProjectDir\models\Qwen3.5-27B-AWQ-BF16-INT4"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Download Qwen3.5-27B-AWQ-BF16-INT4" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Activate venv (if present)
$VenvActivate = "$ProjectDir\venv\Scripts\Activate.ps1"
if (Test-Path $VenvActivate) { & $VenvActivate }

# Check HF token
if (-not $env:HF_TOKEN) {
    Write-Host "Error: HF_TOKEN not set" -ForegroundColor Red
    Write-Host "Run: `$env:HF_TOKEN = 'your_huggingface_token'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Downloading model to: $ModelDir" -ForegroundColor Yellow
Write-Host "Size: ~12GB" -ForegroundColor Yellow
Write-Host ""

# Download model
python -c "from huggingface_hub import snapshot_download; snapshot_download('cyankiwi/Qwen3.5-27B-AWQ-BF16-INT4', local_dir='$ModelDir', resume_download=True)"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Download Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Model saved to: $ModelDir" -ForegroundColor Cyan
} else {
    Write-Host "Download failed" -ForegroundColor Red
}
