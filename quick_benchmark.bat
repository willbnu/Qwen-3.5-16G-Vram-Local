@echo off
REM ============================================================================
REM  QUICK BENCHMARK - Run ONE model at a time
REM  Usage: quick_benchmark.bat [35b|9b|27b]
REM 
REM  NOTE: llama-bench doesn't support --parallel flag
REM  For 35B: uses API benchmark with server running --parallel 1
REM  For 9B/27B: uses llama-bench directly
REM ============================================================================

setlocal enabledelayedexpansion

set MODELS_DIR=%~dp0models\unsloth-gguf
set LLAMA_BENCH=%~dp0llama-bin\llama-bench.exe
set LLAMA_SERVER=%~dp0llama.cpp\build-sm120\bin\Release\llama-server.exe
set RESULTS_DIR=%~dp0results

REM Fallback to prebuilt if SM120 not found
if not exist "%LLAMA_SERVER%" set LLAMA_SERVER=%~dp0llama-bin\llama-server.exe

if not exist "%RESULTS_DIR%" mkdir "%RESULTS_DIR%"

set MODEL=%1
if "%MODEL%"=="" (
    echo.
    echo ============================================
    echo  QUICK BENCHMARK - Choose a model
    echo ============================================
    echo.
    echo   Usage: quick_benchmark.bat [35b^|9b^|27b]
    echo.
    echo   35b - Coding  (target: 125 t/s, uses API)
    echo   9b  - Vision  (target: 97 t/s, uses llama-bench)
    echo   27b - Quality (target: 46 t/s, uses llama-bench)
    echo.
    set /p MODEL="Enter model: "
)

REM Kill any running servers first
echo.
echo [*] Stopping any running llama-server...
taskkill /F /IM llama-server.exe 2>nul >nul
timeout /t 2 /nobreak >nul

REM ============================================
REM 35B requires --parallel 1, use API benchmark
REM ============================================
if /i "%MODEL%"=="35b" (
    echo.
    echo ============================================
    echo  BENCHMARKING: 35B-A3B MoE (API method)
    echo  Target: ~125 t/s
    echo  Note: Uses server with --parallel 1
    echo ============================================
    echo.
    
    if not exist "%LLAMA_SERVER%" (
        echo [ERROR] llama-server.exe not found!
        pause
        exit /b 1
    )
    
    echo [*] Starting server with --parallel 1...
    start "35B-Benchmark" /min cmd /c "%LLAMA_SERVER%" -m "%MODELS_DIR%\Qwen3.5-35B-A3B-Q3_K_S.gguf" --mmproj "%MODELS_DIR%\mmproj-35B-F16.gguf" --host 127.0.0.1 --port 8002 -c 122880 -ngl 99 --flash-attn on -ctk iq4_nl -ctv iq4_nl --parallel 1 --temp 0.6
    
    echo [*] Waiting 45s for model to load...
    timeout /t 45 /nobreak >nul
    
    echo [*] Running warmup requests...
    curl -s -X POST http://127.0.0.1:8002/v1/chat/completions -H "Content-Type: application/json" -d "{\"model\":\"qwen\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}],\"max_tokens\":30}" >nul 2>&1
    curl -s -X POST http://127.0.0.1:8002/v1/chat/completions -H "Content-Type: application/json" -d "{\"model\":\"qwen\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}],\"max_tokens\":30}" >nul 2>&1
    curl -s -X POST http://127.0.0.1:8002/v1/chat/completions -H "Content-Type: application/json" -d "{\"model\":\"qwen\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}],\"max_tokens\":30}" >nul 2>&1
    
    echo.
    echo [*] Running benchmark (5 requests)...
    echo.
    
    for /L %%i in (1,1,5) do (
        for /f "tokens=*" %%r in ('curl -s -X POST http://127.0.0.1:8002/v1/chat/completions -H "Content-Type: application/json" -d "{\"model\":\"qwen\",\"messages\":[{\"role\":\"user\",\"content\":\"Write a Python function\"}],\"max_tokens\":100}" ^| python -c "import sys,json; d=json.load(sys.stdin); t=d['usage']['completion_tokens']; s=d.get('timings',{}).get('predicted_per_second',0); print(f'Run %%i: {s:.1f} t/s ({t} tokens)')"') do echo %%r
    )
    
    echo.
    echo [*] Stopping server...
    taskkill /F /IM llama-server.exe 2>nul >nul
    
    goto :end
)

REM ============================================
REM 9B and 27B use llama-bench directly
REM ============================================
if /i "%MODEL%"=="9b" (
    set MODEL_FILE=Qwen3.5-9B-UD-Q4_K_XL.gguf
    set CTX_TYPE=q8_0
    set MODEL_NAME=9B Vision
    set TARGET_TPS=97
) else if /i "%MODEL%"=="27b" (
    set MODEL_FILE=Qwen3.5-27B-Q3_K_S.gguf
    set CTX_TYPE=iq4_nl
    set MODEL_NAME=27B Quality
    set TARGET_TPS=46
) else (
    echo [ERROR] Unknown model: %MODEL%
    echo Use: 35b, 9b, or 27b
    pause
    exit /b 1
)

if not exist "%LLAMA_BENCH%" (
    echo [ERROR] llama-bench.exe not found at: %LLAMA_BENCH%
    echo Please download llama.cpp and extract to .\llama-bin\
    pause
    exit /b 1
)

echo.
echo ============================================
echo  BENCHMARKING: %MODEL_NAME%
echo  Target: ~%TARGET_TPS% t/s
echo ============================================
echo.

"%LLAMA_BENCH%" -m "%MODELS_DIR%\%MODEL_FILE%" -p 512 -n 128 -r 3 -ngl 99 -fa 1 -ctk %CTX_TYPE% -ctv %CTX_TYPE%

:end
echo.
echo ============================================
echo  BENCHMARK COMPLETE
echo ============================================

pause
