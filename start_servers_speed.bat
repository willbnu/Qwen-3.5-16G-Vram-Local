@echo off
REM ============================================
REM Qwen3.5 - SPEED PROFILE (one server at a time)
REM RTX 5080 16GB — ONE SERVER ONLY
REM
REM REALITY CHECK:
REM   35B-A3B alone = 15.5GB VRAM — fills the card
REM   9B alone      = 10.6GB VRAM — leaves 5.4GB headroom
REM   They CANNOT run simultaneously (23GB needed)
REM
REM PROFILES:
REM   coding  -> 35B-A3B Q3_K_S MoE  (port 8002) ~120 t/s, 120K ctx, vision, --parallel 1
REM   vision  -> 9B Q4_K_XL          (port 8003) ~97  t/s, 256K ctx
REM   quality -> 27B Q3_K_S dense    (port 8004) ~36  t/s, 64K ctx
REM
REM USAGE:
REM   start_servers_speed.bat          (default: coding)
REM   start_servers_speed.bat vision
REM   start_servers_speed.bat quality
REM ============================================

@echo off
set PROFILE=%~1
if "%PROFILE%"=="" set PROFILE=coding

REM --- Detect llama.cpp binary (SM120 native > prebuilt fallback) ---
set LLAMA_DIR=%~dp0llama.cpp\build-sm120\bin\Release
if not exist "%LLAMA_DIR%\llama-server.exe" (
    echo [INFO] SM120 native build not found, checking prebuilt...
    set LLAMA_DIR=%~dp0llama-bin
)
if not exist "%LLAMA_DIR%\llama-server.exe" (
    echo.
    echo [ERROR] llama-server.exe not found!
    echo.
    echo   Checked:
    echo     - %~dp0llama.cpp\build-sm120\bin\Release
    echo     - %~dp0llama-bin
    echo.
    echo   Fix: Download llama.cpp from https://github.com/ggml-org/llama.cpp/releases
    echo   Extract to .\llama-bin\ folder.
    echo.
    pause
    exit /b 1
)
echo [INFO] Using: %LLAMA_DIR%
set MODELS_DIR=%~dp0models\unsloth-gguf
set LOGS_DIR=%~dp0logs

if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"

echo Stopping existing servers...
taskkill /F /IM llama-server.exe 2>nul
timeout /t 3 /nobreak >nul

REM ============================================
if /i "%PROFILE%"=="coding" goto :coding
if /i "%PROFILE%"=="vision" goto :vision
if /i "%PROFILE%"=="quality" goto :quality
echo Unknown profile: %PROFILE%. Use: coding, vision, quality
exit /b 1

REM ============================================
:coding
echo.
echo ============================================
echo  CODING PROFILE: 35B-A3B Q3_K_S (Port 8002)
echo  MoE: only 3B active params per token
echo  Speed: ~120 t/s gen / ~500 t/s prompt
echo  Context: 32K (32,768 tokens) - GPU memory limit
echo  KV: iq4_nl  Vision: YES
echo  VRAM: ~15.4GB
echo  NOTE: --parallel 1 is CRITICAL for 120+ t/s (GDN hybrid arch)
echo  NOTE: 32K context is max for full GPU performance on 16GB VRAM
echo ============================================
echo.
start "Qwen3.5-35B-A3B-Coding" /min cmd /c ^
    "%LLAMA_DIR%\llama-server.exe" ^
    -m "%MODELS_DIR%\Qwen3.5-35B-A3B-Q3_K_S.gguf" ^
    --mmproj "%MODELS_DIR%\mmproj-35B-F16.gguf" ^
    --host 127.0.0.1 --port 8002 ^
    -c 32768 ^
    -ngl 99 ^
    --flash-attn on ^
    -ctk iq4_nl -ctv iq4_nl ^
    --parallel 1 --reasoning-budget 0 ^
    --temp 0.6 --top-p 0.95 --top-k 20 ^
    --presence-penalty 0.0 ^
    --reasoning-budget 0 ^
    > "%LOGS_DIR%\server-8002.log" 2>&1
echo Started. Check: curl http://127.0.0.1:8002/health
goto :end

REM ============================================
:vision
echo.
echo ============================================
echo  VISION PROFILE: 9B Q4_K_XL (Port 8003)
echo  Speed: ~97 t/s avg / 112 t/s peak
echo  Context: 256K (full model max)
echo  KV: q8_0 (fastest + best quality on SM120)
echo  VRAM: ~10.6GB (5.4GB headroom)
echo ============================================
echo.
start "Qwen3.5-9B-FastVision" /min cmd /c ^
    "%LLAMA_DIR%\llama-server.exe" ^
    -m "%MODELS_DIR%\Qwen3.5-9B-UD-Q4_K_XL.gguf" ^
    --mmproj "%MODELS_DIR%\mmproj-F16.gguf" ^
    --host 127.0.0.1 --port 8003 ^
    -c 262144 ^
    -ngl 99 ^
    --flash-attn on ^
    -ctk q8_0 -ctv q8_0 ^
    --temp 0.7 --top-p 0.8 --top-k 20 ^
    --presence-penalty 1.5 ^
    --chat-template-kwargs "{\"enable_thinking\":false}" ^
    > "%LOGS_DIR%\server-8003.log" 2>&1
echo Started. Check: curl http://127.0.0.1:8003/health
goto :end

REM ============================================
:quality
echo.
echo ============================================
echo  QUALITY PROFILE: 27B Q3_K_S dense (Port 8004)
echo  Speed: ~36 t/s gen / 325 t/s prompt
echo  Context: 64K  KV: iq4_nl
echo  VRAM: ~12.9GB  All 65 layers on GPU
echo  Best for: long-form reasoning, quality vision
echo ============================================
echo.
start "Qwen3.5-27B-Quality" /min cmd /c ^
    "%LLAMA_DIR%\llama-server.exe" ^
    -m "%MODELS_DIR%\Qwen3.5-27B-Q3_K_S.gguf" ^
    --mmproj "%MODELS_DIR%\mmproj-27B-F16.gguf" ^
    --host 127.0.0.1 --port 8004 ^
    -c 65536 ^
    -ngl 99 ^
    --flash-attn on ^
    -ctk iq4_nl -ctv iq4_nl ^
    --temp 0.7 --top-p 0.8 --top-k 20 ^
    --presence-penalty 1.5 ^
    --chat-template-kwargs "{\"enable_thinking\":false}" ^
    > "%LOGS_DIR%\server-8004.log" 2>&1
echo Started. Check: curl http://127.0.0.1:8004/health
goto :end

:end
echo.
echo Waiting 30s for model to load...
timeout /t 30 /nobreak >nul
echo Done. Server ready.
pause
