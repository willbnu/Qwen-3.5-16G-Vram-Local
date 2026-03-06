#!/bin/bash

# Stop all Qwen3.5 servers

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${RED}Stopping all llama-server processes...${NC}"

if pkill -x llama-server 2>/dev/null; then
    sleep 1
    if pgrep -x llama-server > /dev/null 2>&1; then
        echo -e "${RED}Some processes may still be running.${NC}"
        exit 1
    else
        echo -e "${GREEN}Servers stopped successfully.${NC}"
        exit 0
    fi
else
    echo -e "${GREEN}No llama-server processes found running.${NC}"
    exit 0
fi
