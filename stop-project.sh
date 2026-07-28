#!/bin/bash

# Campus Ride Sharing Project Stop Script
# This script safely stops all project services

echo "🛑 Stopping Campus Ride Sharing Project..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to kill processes on a port
kill_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${YELLOW}Stopping processes on port $1...${NC}"
        lsof -ti:$1 | xargs kill -9 2>/dev/null || true
        sleep 2
        echo -e "${GREEN}✅ Port $1 cleared${NC}"
    else
        echo -e "${BLUE}ℹ️  Port $1 is already free${NC}"
    fi
}

# Step 1: Stop Frontend (port 3000)
echo -e "${BLUE}Step 1: Stopping Frontend Server...${NC}"
kill_port 3000
pkill -f "react-scripts start" 2>/dev/null || true

# Step 2: Stop Backend (port 5001)
echo -e "${BLUE}Step 2: Stopping Backend Server...${NC}"
kill_port 5001
pkill -f "nodemon server.js" 2>/dev/null || true
pkill -f "node server.js" 2>/dev/null || true

# Step 3: Stop MongoDB (optional - uncomment if you want to stop MongoDB too)
# echo -e "${BLUE}Step 3: Stopping MongoDB...${NC}"
# pkill -f "mongod" 2>/dev/null || true
# echo -e "${GREEN}✅ MongoDB stopped${NC}"

echo -e "${GREEN}🎉 Project stopped successfully!${NC}"
echo -e "${YELLOW}Note: MongoDB is still running. To stop it, run: pkill -f mongod${NC}"
