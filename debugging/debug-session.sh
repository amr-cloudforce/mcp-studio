#!/bin/bash

# Debug Session Script for MCP Studio
# Starts Electron app with remote debugging and captures logs to file

cd ..

LOG_FILE="/tmp/debug-session-$(date +%Y%m%d-%H%M%S).txt"
ELECTRON_PID=""
CAPTURE_PID=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to cleanup processes
cleanup() {
    echo -e "\n${YELLOW}Stopping debug session...${NC}"
    
    if [ ! -z "$CAPTURE_PID" ]; then
        echo "Stopping log capture (PID: $CAPTURE_PID)..."
        kill -SIGINT $CAPTURE_PID 2>/dev/null
        wait $CAPTURE_PID 2>/dev/null
    fi
    
    if [ ! -z "$ELECTRON_PID" ]; then
        echo "Stopping Electron app (PID: $ELECTRON_PID)..."
        kill $ELECTRON_PID 2>/dev/null
        wait $ELECTRON_PID 2>/dev/null
    fi
    
    echo -e "${GREEN}Debug session stopped.${NC}"
    
    if [ -f "$LOG_FILE" ]; then
        echo -e "${BLUE}Logs saved to: $LOG_FILE${NC}"
        echo -e "${BLUE}Log file size: $(wc -l < "$LOG_FILE") lines${NC}"
        echo ""
        echo -e "${YELLOW}Last 20 log entries:${NC}"
        tail -20 "$LOG_FILE"
    fi
    
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo -e "${BLUE}=== MCP Studio Debug Session ===${NC}"
echo -e "Log file: ${GREEN}$LOG_FILE${NC}"
echo ""

# Clear/create fresh log file
> "$LOG_FILE"

# Check if ws package is installed
if ! npm list ws >/dev/null 2>&1; then
    echo -e "${YELLOW}Installing ws package...${NC}"
    npm install ws
fi

# Start Electron app with remote debugging
echo -e "${YELLOW}Starting Electron app with remote debugging...${NC}"
npx electron --remote-debugging-port=9222 --remote-allow-origins=* . &
ELECTRON_PID=$!

echo "Electron PID: $ELECTRON_PID"

# Wait for Electron to start and remote debugging to be available
echo "Waiting for remote debugging to be available..."
for i in {1..10}; do
    if curl -s http://localhost:9222/json >/dev/null 2>&1; then
        echo -e "${GREEN}Remote debugging is ready!${NC}"
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "${RED}Failed to connect to remote debugging port. Exiting.${NC}"
        kill $ELECTRON_PID 2>/dev/null
        exit 1
    fi
    echo "Attempt $i/10..."
    sleep 2
done

# Start log capture
echo -e "${YELLOW}Starting log capture...${NC}"
node debugging/capture-logs-continuous.js "$LOG_FILE" &
CAPTURE_PID=$!

echo "Log capture PID: $CAPTURE_PID"
echo ""
echo -e "${GREEN}Debug session is running!${NC}"
echo -e "${BLUE}Press Ctrl+C to stop the session and view logs${NC}"
echo ""

# Wait for user to stop or for processes to exit
while kill -0 $ELECTRON_PID 2>/dev/null && kill -0 $CAPTURE_PID 2>/dev/null; do
    sleep 1
done

# If we get here, one of the processes died
echo -e "${YELLOW}One of the processes has stopped. Cleaning up...${NC}"
cleanup
