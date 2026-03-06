@echo off
REM ============================================================================
REM  LIVE DEMO - Qwen3.5-35B-A3B Terminal Chat
REM  Run in Windows Terminal for best results (Ctrl+Shift+T for new tab)
REM ============================================================================

color 0A
mode con: cols=100 lines=50

echo.
echo  ================================================================================
echo                     QWEN3.5-35B-A3B LIVE DEMO
echo                       RTX 5080 16GB @ 125 t/s
echo  ================================================================================
echo.
echo  [1] Starting chat session...
echo.

python chat.py --port 8002 --system "You are a helpful coding assistant."

echo.
echo  ================================================================================
echo                     SESSION ENDED
echo  ================================================================================
pause
