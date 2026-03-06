#!/bin/bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Get profile from argument (default: coding)
PROFILE="${1:-coding}"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"

# Detect llama-server binary
LLAMA_BIN=""
if [[ -x "$BASE_DIR/llama.cpp/build-sm120/bin/Release/llama-server" ]]; then
    LLAMA_BIN="$BASE_DIR/llama.cpp/build-sm120/bin/Release/llama-server"
elif [[ -x "$BASE_DIR/llama-bin/llama-server" ]]; then
    LLAMA_BIN="$BASE_DIR/llama-bin/llama-server"
elif command -v llama-server &> /dev/null; then
    LLAMA_BIN="llama-server"
else
    echo -e "${RED}Error: llama-server binary not found${NC}"
    echo "Checked:"
    echo "  - $BASE_DIR/llama.cpp/build-sm120/bin/Release/llama-server"
    echo "  - $BASE_DIR/llama-bin/llama-server"
    echo "  - system PATH"
    echo ""
    echo "Fix: Download llama.cpp from https://github.com/ggml-org/llama.cpp/releases"
    echo "Extract to ./llama-bin/ folder."
    exit 1
fi

echo -e "${CYAN}=== Qwen3.5 LLM Server Starter ===${NC}"
echo -e "${BLUE}Profile:${NC} $PROFILE"
echo -e "${BLUE}Binary:${NC} $LLAMA_BIN"

# Create logs directory
LOGS_DIR="$BASE_DIR/logs"
mkdir -p "$LOGS_DIR"

# Kill existing llama-server processes
echo -e "${YELLOW}Stopping existing llama-server processes...${NC}"
pkill -x llama-server 2>/dev/null || true
sleep 2

MODELS_DIR="$BASE_DIR/models/unsloth-gguf"

# Set profile-specific parameters
case "$PROFILE" in
    coding)
        PORT=8002
        MODEL="Qwen3.5-35B-A3B-Q3_K_S.gguf"
        MMPROJ="mmproj-35B-F16.gguf"
        CTX=32768
        VRAM="15.4GB"
        SPEED="~120 t/s"
        DESC="35B MoE - 3B active params/token"
        echo ""
        echo -e "${CYAN}============================================${NC}"
        echo -e "${CYAN} CODING PROFILE: 35B-A3B Q3_K_S (Port 8002)${NC}"
        echo -e "${CYAN}============================================${NC}"
        echo " MoE: only 3B active params per token"
        echo " Speed: ~120 t/s gen / ~500 t/s prompt"
        echo " Context: 32K (32,768 tokens) - GPU memory limit"
        echo " KV: iq4_nl  Vision: YES"
        echo " VRAM: ~15.4GB"
        echo " NOTE: --parallel 1 is CRITICAL for 120+ t/s"
        echo ""
        "$LLAMA_BIN" \
            -m "$MODELS_DIR/$MODEL" \
            --mmproj "$MODELS_DIR/$MMPROJ" \
            --host 127.0.0.1 --port $PORT \
            -c $CTX \
            -ngl 99 \
            --flash-attn on \
            -ctk iq4_nl -ctv iq4_nl \
            --parallel 1 --reasoning-budget 0 \
            --temp 0.6 --top-p 0.95 --top-k 20 \
            --presence-penalty 0.0 \
            > "$LOGS_DIR/server-$PORT.log" 2>&1 &
        ;;

    vision)
        PORT=8003
        MODEL="Qwen3.5-9B-UD-Q4_K_XL.gguf"
        MMPROJ="mmproj-F16.gguf"
        CTX=262144
        VRAM="10.6GB"
        SPEED="~97 t/s"
        DESC="9B Fast Vision"
        echo ""
        echo -e "${CYAN}============================================${NC}"
        echo -e "${CYAN} VISION PROFILE: 9B Q4_K_XL (Port 8003)${NC}"
        echo -e "${CYAN}============================================${NC}"
        echo " Speed: ~97 t/s avg / 112 t/s peak"
        echo " Context: 256K (full model max)"
        echo " KV: q8_0 (fastest + best quality)"
        echo " VRAM: ~10.6GB (5.4GB headroom)"
        echo ""
        "$LLAMA_BIN" \
            -m "$MODELS_DIR/$MODEL" \
            --mmproj "$MODELS_DIR/$MMPROJ" \
            --host 127.0.0.1 --port $PORT \
            -c $CTX \
            -ngl 99 \
            --flash-attn on \
            -ctk q8_0 -ctv q8_0 \
            --temp 0.7 --top-p 0.8 --top-k 20 \
            --presence-penalty 1.5 \
            --chat-template-kwargs '{"enable_thinking":false}' \
            > "$LOGS_DIR/server-$PORT.log" 2>&1 &
        ;;

    quality)
        PORT=8004
        MODEL="Qwen3.5-27B-Q3_K_S.gguf"
        MMPROJ="mmproj-27B-F16.gguf"
        CTX=65536
        VRAM="12.9GB"
        SPEED="~36 t/s"
        DESC="27B Dense Quality"
        echo ""
        echo -e "${CYAN}============================================${NC}"
        echo -e "${CYAN} QUALITY PROFILE: 27B Q3_K_S (Port 8004)${NC}"
        echo -e "${CYAN}============================================${NC}"
        echo " Speed: ~36 t/s gen / 325 t/s prompt"
        echo " Context: 64K  KV: iq4_nl"
        echo " VRAM: ~12.9GB  All 65 layers on GPU"
        echo " Best for: long-form reasoning, quality vision"
        echo ""
        "$LLAMA_BIN" \
            -m "$MODELS_DIR/$MODEL" \
            --mmproj "$MODELS_DIR/$MMPROJ" \
            --host 127.0.0.1 --port $PORT \
            -c $CTX \
            -ngl 99 \
            --flash-attn on \
            -ctk iq4_nl -ctv iq4_nl \
            --temp 0.7 --top-p 0.8 --top-k 20 \
            --presence-penalty 1.5 \
            --chat-template-kwargs '{"enable_thinking":false}' \
            > "$LOGS_DIR/server-$PORT.log" 2>&1 &
        ;;

    *)
        echo -e "${RED}Error: Unknown profile '$PROFILE'${NC}"
        echo "Valid profiles: coding, vision, quality"
        exit 1
        ;;
esac

SERVER_PID=$!
echo $SERVER_PID > "$LOGS_DIR/server-$PORT.pid"

echo -e "${GREEN}Server started with PID $SERVER_PID${NC}"
echo -e "${CYAN}Health check: curl http://127.0.0.1:$PORT/health${NC}"
echo -e "${YELLOW}Logs: tail -f $LOGS_DIR/server-$PORT.log${NC}"
echo ""
echo "Waiting 30s for model to load..."
sleep 30
echo -e "${GREEN}Done. Server ready.${NC}"
