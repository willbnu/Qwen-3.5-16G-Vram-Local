@echo off
REM ============================================================================
REM  Qwen3.5 — Model Switcher
REM  RTX 5080 16GB — ONE SERVER ONLY
REM
REM  USAGE:
REM    start_chat_server.bat           <- 35B (default)
REM    start_chat_server.bat 35b       <- 35B MoE  ~125 t/s  port 8002  152K ctx
REM    start_chat_server.bat 9b        <- 9B       ~97  t/s  port 8003
REM    start_chat_server.bat 27b       <- 27B      ~36  t/s  port 8004
REM ============================================================================

set MODEL=%~1
if "%MODEL%"=="" set MODEL=35b

echo.
echo [*] Killing any running llama-server...
taskkill /F /IM llama-server.exe 2>nul
timeout /t 3 /nobreak >nul
echo [*] VRAM freed.
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0model_launcher.ps1" -Model %MODEL%

pause
