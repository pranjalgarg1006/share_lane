#!/bin/bash

# Campus Ride Sharing Project Startup Script
# This script ensures proper startup sequence and prevents common errors

echo "🚀 Starting Campus Ride Sharing Project..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill processes on a port
kill_port() {
    echo -e "${YELLOW}Killing processes on port $1...${NC}"
    lsof -ti:$1 | xargs kill -9 2>/dev/null || true
    sleep 2
}

# Step 1: Clean up any existing processes
echo -e "${BLUE}Step 1: Cleaning up existing processes...${NC}"
kill_port 5001  # Backend port
kill_port 3000  # Frontend port
pkill -f "nodemon server.js" 2>/dev/null || true
pkill -f "node server.js" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true

# Step 2: Check MongoDB
echo -e "${BLUE}Step 2: Checking MongoDB...${NC}"
if ! pgrep -f "mongod" > /dev/null; then
    echo -e "${YELLOW}MongoDB not running. Starting MongoDB...${NC}"
    mongod --dbpath /opt/homebrew/var/mongodb --port 27017 &
    sleep 5
    
    # Verify MongoDB started
    if ! pgrep -f "mongod" > /dev/null; then
        echo -e "${RED}❌ Failed to start MongoDB. Please check your MongoDB installation.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ MongoDB started successfully${NC}"
else
    echo -e "${GREEN}✅ MongoDB is already running${NC}"
fi

# Step 3: Test MongoDB connection
echo -e "${BLUE}Step 3: Testing MongoDB connection...${NC}"
if mongosh --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1; then
    echo -e "${GREEN}✅ MongoDB connection successful${NC}"
else
    echo -e "${RED}❌ MongoDB connection failed${NC}"
    exit 1
fi

# Step 4: Start Backend
echo -e "${BLUE}Step 4: Starting Backend Server...${NC}"
cd /Users/piyush/Projects/ShareLane/backend

# Check if backend port is free
if check_port 5001; then
    echo -e "${RED}❌ Port 5001 is still in use. Please wait and try again.${NC}"
    exit 1
fi

# Start backend in background
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Test backend
if curl -s http://localhost:5001/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend server started successfully${NC}"
else
    echo -e "${RED}❌ Backend server failed to start${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Step 5: Start Frontend
echo -e "${BLUE}Step 5: Starting Frontend Server...${NC}"
cd /Users/piyush/Projects/ShareLane/frontend

# Check if frontend port is free
if check_port 3000; then
    echo -e "${RED}❌ Port 3000 is still in use. Please wait and try again.${NC}"
    exit 1
fi

# Start frontend in background
npm start &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 10

# Test frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Frontend server started successfully${NC}"
else
    echo -e "${RED}❌ Frontend server failed to start${NC}"
    kill $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

# Step 6: Final Status
echo -e "${GREEN}🎉 Project started successfully!${NC}"
echo -e "${BLUE}📱 Frontend: http://localhost:3000${NC}"
echo -e "${BLUE}🔧 Backend: http://localhost:5001${NC}"
echo -e "${BLUE}🗄️  MongoDB: mongodb://localhost:27017${NC}"
echo ""
echo -e "${YELLOW}To stop the project, run: ./stop-project.sh${NC}"
echo -e "${YELLOW}Or press Ctrl+C in this terminal${NC}"

# Keep script running
wait
