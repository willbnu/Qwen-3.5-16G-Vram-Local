@echo off
REM ============================================
REM  Qwen3.5-35B-A3B — Chat Server Launcher
REM  SM120 native build, --parallel 1
REM  Port 8002 | 128K ctx | thinking OFF
REM ============================================

set LLAMA_EXE=%~dp0llama.cpp\build-sm120\bin\Release\llama-server.exe
set MODEL=%~dp0models\unsloth-gguf\Qwen3.5-35B-A3B-Q3_K_S.gguf
set MMPROJ=%~dp0models\unsloth-gguf\mmproj-35B-F16.gguf
set LOGDIR=%~dp0logs

if not exist "%LOGDIR%" mkdir "%LOGDIR%"

echo Killing any existing llama-server...
taskkill /F /IM llama-server.exe 2>nul
timeout /t 2 /nobreak >nul

echo Starting Qwen3.5-35B on port 8002...
echo Log: %LOGDIR%\server-8002.log

start "Qwen3.5-35B" /min cmd /c ^
    "%LLAMA_EXE%" ^
    -m "%MODEL%" ^
    --mmproj "%MMPROJ%" ^
    --host 127.0.0.1 --port 8002 ^
    -c 131072 ^
    -ngl 99 ^
    --flash-attn on ^
    -ctk iq4_nl -ctv iq4_nl ^
    --parallel 1 ^
    --temp 0.6 --top-p 0.95 --top-k 20 ^
    --presence-penalty 0.0 ^
    --chat-template-kwargs {\"enable_thinking\":false} ^
    > "%LOGDIR%\server-8002.log" 2>&1

echo.
echo Server starting... model is 14GB, allow 60-90 seconds to load.
echo Run: python chat.py
echo.
