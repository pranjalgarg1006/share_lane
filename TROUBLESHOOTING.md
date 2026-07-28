# 🚨 Campus Ride Sharing Project - Troubleshooting Guide

## 🔍 Common Issues & Solutions

### 1. **Port Already in Use Error (EADDRINUSE)**
**Error:** `Error: listen EADDRINUSE: address already in use :::5001`

**Cause:** Multiple backend servers running simultaneously

**Solution:**
```bash
# Kill all processes on port 5001
lsof -ti:5001 | xargs kill -9

# Or use the stop script
./stop-project.sh
```

### 2. **MongoDB Connection Refused**
**Error:** `Database connection error: connect ECONNREFUSED ::1:27017`

**Cause:** MongoDB not running

**Solution:**
```bash
# Start MongoDB
mongod --dbpath /opt/homebrew/var/mongodb --port 27017

# Or use the start script
./start-project.sh
```

### 3. **MongoDB Compass Version Error**
**Error:** `Invalid version. Must be a string. Got type "undefined"`

**Cause:** Multiple MongoDB instances or corrupted connection

**Solution:**
1. Close MongoDB Compass
2. Stop all MongoDB instances: `pkill -f mongod`
3. Start single MongoDB: `mongod --dbpath /opt/homebrew/var/mongodb --port 27017`
4. Reopen MongoDB Compass
5. Connect to: `mongodb://localhost:27017`

### 4. **Frontend Not Loading**
**Error:** `Failed to load resource: net::ERR_CONNECTION_REFUSED`

**Cause:** Backend server not running

**Solution:**
1. Check if backend is running: `curl http://localhost:5001/api/health`
2. Start backend: `cd backend && npm run dev`
3. Wait for "Server running on port 5001" message

### 5. **Login Fails with Correct Credentials**
**Cause:** Database connection issues or user not found

**Solution:**
1. Check MongoDB connection
2. Verify user exists in database
3. Check backend logs for specific errors

## 🚀 Proper Startup Sequence

### **Method 1: Using Scripts (Recommended)**
```bash
# Start everything
./start-project.sh

# Stop everything
./stop-project.sh
```

### **Method 2: Manual Startup**
```bash
# 1. Check what's running
ps aux | grep -E "(mongod|node|nodemon)" | grep -v grep

# 2. Clean up if needed
pkill -f "nodemon server.js"
pkill -f "node server.js"
pkill -f "react-scripts start"

# 3. Start MongoDB
mongod --dbpath /opt/homebrew/var/mongodb --port 27017 &

# 4. Wait and test MongoDB
sleep 5
mongosh --eval "db.adminCommand('ping')"

# 5. Start Backend
cd backend
npm run dev &

# 6. Wait and test Backend
sleep 5
curl http://localhost:5001/api/health

# 7. Start Frontend
cd ../frontend
npm start &
```

## 🔧 Daily Startup Checklist

### **Before Starting:**
- [ ] Check if any services are already running
- [ ] Clean up any zombie processes
- [ ] Verify MongoDB data directory exists

### **Startup Order:**
1. **MongoDB** (Database)
2. **Backend** (API Server)
3. **Frontend** (React App)

### **Verification:**
- [ ] MongoDB: `mongosh --eval "db.adminCommand('ping')"`
- [ ] Backend: `curl http://localhost:5001/api/health`
- [ ] Frontend: Open `http://localhost:3000`

## 🛠️ Maintenance Commands

### **Check Running Services:**
```bash
# Check all project-related processes
ps aux | grep -E "(mongod|node|nodemon|react-scripts)" | grep -v grep

# Check specific ports
lsof -i :27017  # MongoDB
lsof -i :5001   # Backend
lsof -i :3000   # Frontend
```

### **Clean Up Everything:**
```bash
# Kill all project processes
pkill -f "mongod"
pkill -f "nodemon"
pkill -f "react-scripts"
pkill -f "node server.js"

# Clear ports
lsof -ti:27017 | xargs kill -9 2>/dev/null || true
lsof -ti:5001 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
```

### **Reset Everything:**
```bash
# Stop everything
./stop-project.sh

# Wait 5 seconds
sleep 5

# Start everything
./start-project.sh
```

## 📋 Environment Requirements

### **Required Services:**
- **MongoDB**: Database server
- **Node.js**: Backend runtime
- **React**: Frontend framework

### **Required Ports:**
- **27017**: MongoDB
- **5001**: Backend API
- **3000**: Frontend

### **Required Directories:**
- `/opt/homebrew/var/mongodb`: MongoDB data directory
- `./backend`: Backend source code
- `./frontend`: Frontend source code

## 🚨 Emergency Recovery

### **If Everything is Broken:**
```bash
# 1. Kill everything
pkill -f "mongod"
pkill -f "node"
pkill -f "nodemon"

# 2. Wait
sleep 10

# 3. Start fresh
./start-project.sh
```

### **If MongoDB is Corrupted:**
```bash
# 1. Stop MongoDB
pkill -f "mongod"

# 2. Check data directory
ls -la /opt/homebrew/var/mongodb/

# 3. Start MongoDB with repair
mongod --dbpath /opt/homebrew/var/mongodb --port 27017 --repair

# 4. Start normally
mongod --dbpath /opt/homebrew/var/mongodb --port 27017
```

## 💡 Pro Tips

1. **Always use the startup script** to avoid conflicts
2. **Check running processes** before starting
3. **Wait for each service** to fully start before starting the next
4. **Keep MongoDB running** between development sessions
5. **Use Ctrl+C** to stop the startup script gracefully
6. **Check logs** if something fails

## 📞 Quick Commands Reference

```bash
# Start project
./start-project.sh

# Stop project
./stop-project.sh

# Check status
ps aux | grep -E "(mongod|node|nodemon)" | grep -v grep

# Test services
curl http://localhost:5001/api/health
curl http://localhost:3000

# Clean everything
pkill -f "mongod" && pkill -f "node" && pkill -f "nodemon"
```
