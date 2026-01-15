#!/bin/bash

# ============================================
# RIG ALPHA - START ALL SERVICES
# ============================================

echo "🚀 Starting Rig Alpha System..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if virtual environment exists
if [ -d "venv" ]; then
    echo -e "${GREEN}✓ Found virtual environment${NC}"
    source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
else
    echo -e "${YELLOW}⚠ No venv found, using system Python${NC}"
fi

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 || netstat -an | grep ":$1 " | grep -q LISTEN 2>/dev/null; then
        return 0  # Port in use
    else
        return 1  # Port free
    fi
}

# Kill existing processes on our ports
echo -e "${CYAN}Checking for existing processes...${NC}"
for port in 5000 3000; do
    if check_port $port; then
        echo -e "${YELLOW}Killing process on port $port${NC}"
        fuser -k $port/tcp 2>/dev/null || npx kill-port $port 2>/dev/null || true
    fi
done

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Starting Backend Services${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Start Kafka Consumer in background
echo -e "${GREEN}[1/3] Starting Kafka Consumer...${NC}"
python consumer.py > consumer.log 2>&1 &
CONSUMER_PID=$!
echo -e "      PID: $CONSUMER_PID (logs: consumer.log)"

# Start Flask Dashboard in background
echo -e "${GREEN}[2/3] Starting Flask Dashboard...${NC}"
python dashboard.py > dashboard.log 2>&1 &
DASHBOARD_PID=$!
echo -e "      PID: $DASHBOARD_PID (logs: dashboard.log)"
echo -e "      URL: ${CYAN}http://localhost:5000${NC}"

# Wait for Flask to start
sleep 2

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Starting Ithena Blueprint${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Start Ithena Blueprint (Next.js)
if [ -d "ithena-blueprint" ]; then
    echo -e "${GREEN}[3/3] Starting Ithena Blueprint...${NC}"
    cd ithena-blueprint
    npm run dev > ../blueprint.log 2>&1 &
    BLUEPRINT_PID=$!
    cd ..
    echo -e "      PID: $BLUEPRINT_PID (logs: blueprint.log)"
    echo -e "      URL: ${CYAN}http://localhost:3000${NC}"
else
    echo -e "${YELLOW}⚠ ithena-blueprint folder not found, skipping${NC}"
    BLUEPRINT_PID=""
fi

# Wait for everything to start
sleep 3

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}  ✓ ALL SERVICES STARTED${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "  ${CYAN}Dashboard:${NC}        http://localhost:5000"
echo -e "  ${CYAN}Ithena Blueprint:${NC} http://localhost:3000"
echo -e "    - Code X-Ray:   http://localhost:3000/xray/consumer.py"
echo -e "    - Wiki:         http://localhost:3000/wiki"
echo -e "    - System Map:   http://localhost:3000/map"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Save PIDs for cleanup
echo "$CONSUMER_PID $DASHBOARD_PID $BLUEPRINT_PID" > .running_pids

# Cleanup function
cleanup() {
    echo ""
    echo -e "${RED}Shutting down all services...${NC}"
    kill $CONSUMER_PID 2>/dev/null
    kill $DASHBOARD_PID 2>/dev/null
    [ -n "$BLUEPRINT_PID" ] && kill $BLUEPRINT_PID 2>/dev/null
    rm -f .running_pids
    echo -e "${GREEN}✓ All services stopped${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

# Keep script running and show logs
echo -e "${CYAN}Tailing logs (Ctrl+C to stop all):${NC}"
echo ""
tail -f consumer.log dashboard.log blueprint.log 2>/dev/null
