@echo off
REM ============================================
REM Qwen3.5 launcher index for the 16GB presets
REM ============================================

echo.
echo ============================================
echo  Qwen3.5 16GB presets
echo ============================================
echo  coding  - 35B-A3B Q3_K_S  port 8002  ~120 t/s  120K default
echo  vision  - 9B Q4_K_XL      port 8003  ~97  t/s  256K
echo  quality - 27B Q3_K_S      port 8004  ~46  t/s  96K default
echo ============================================
echo.
echo This project is tuned for one server at a time on 16GB cards.
echo Starting the coding preset in 5 seconds.
echo Press Ctrl+C to cancel.
echo.

timeout /t 5 /nobreak >nul
call start_servers_speed.bat coding
