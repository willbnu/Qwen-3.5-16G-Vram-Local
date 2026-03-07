@echo off
REM ============================================================================
REM  Qwen3.5 — LAN Mode (accessible from other devices)
REM  
REM  Your LAN IP: 192.168.1.87
REM  
REM  From Mac browser: http://192.168.1.87:8002
REM ============================================================================

set MODEL=%~1
if "%MODEL%"=="" set MODEL=35b

echo.
echo [*] Killing any running llama-server...
taskkill /F /IM llama-server.exe 2>nul
timeout /t 3 /nobreak >nul
echo [*] VRAM freed.
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0model_launcher.ps1" -Model %MODEL% -LanMode

pause
