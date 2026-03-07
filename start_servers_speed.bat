@echo off
setlocal

REM ============================================
REM Qwen3.5 single-server launcher for 16GB GPUs
REM ============================================

set "PROFILE=%~1"
if "%PROFILE%"=="" set "PROFILE=coding"

if /i "%PROFILE%"=="coding" (
    set "SERVER_KEY=coding"
    set "TITLE=35B-A3B Q3_K_S"
    set "PORT=8002"
    set "SPEED=~120 t/s text generation"
    set "CONTEXT=256K max"
    set "NOTES=mmproj loaded, one server at a time"
    goto :run
)

if /i "%PROFILE%"=="vision" (
    set "SERVER_KEY=fast_vision"
    set "TITLE=9B UD-Q4_K_XL"
    set "PORT=8003"
    set "SPEED=~97 t/s"
    set "CONTEXT=256K"
    set "NOTES=fast image input, lower VRAM pressure"
    goto :run
)

if /i "%PROFILE%"=="quality" (
    set "SERVER_KEY=quality_vision"
    set "TITLE=27B Q3_K_S"
    set "PORT=8004"
    set "SPEED=~46 t/s"
    set "CONTEXT=96K default"
    set "NOTES=best quality preset, one server at a time"
    goto :run
)

echo [ERROR] Unknown profile: %PROFILE%
echo.
echo Usage:
echo   start_servers_speed.bat coding
echo   start_servers_speed.bat vision
echo   start_servers_speed.bat quality
exit /b 1

:run
where python >nul 2>nul
if %ERRORLEVEL%==0 (
    set "PY_LAUNCHER=python"
) else (
    where py >nul 2>nul
    if not %ERRORLEVEL%==0 (
        echo [ERROR] Python 3.11+ was not found on PATH.
        exit /b 1
    )
    set "PY_LAUNCHER=py -3"
)

echo.
echo ============================================
echo  Qwen3.5 single-server launcher
echo ============================================
echo  Profile : %PROFILE%
echo  Model   : %TITLE%
echo  Port    : %PORT%
echo  Speed   : %SPEED%
echo  Context : %CONTEXT%
echo  Notes   : %NOTES%
echo ============================================
echo.

echo Stopping any existing llama-server process...
if "%PY_LAUNCHER%"=="py -3" (
    py -3 server_manager.py stop >nul 2>nul
) else (
    python server_manager.py stop >nul 2>nul
)

ping 127.0.0.1 -n 3 >nul

echo Starting %SERVER_KEY% using config\servers.yaml...
if "%PY_LAUNCHER%"=="py -3" (
    py -3 server_manager.py start --server %SERVER_KEY%
) else (
    python server_manager.py start --server %SERVER_KEY%
)

if errorlevel 1 exit /b %ERRORLEVEL%

echo.
echo Health check:
echo   curl http://127.0.0.1:%PORT%/health
echo.
echo Log file:
echo   logs\server-%PORT%.log

endlocal
