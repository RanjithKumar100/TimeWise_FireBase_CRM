# ✅ PERMANENT SOLUTION - Port 9002 Conflict

## 🎯 The Problem
The error `EADDRINUSE: address already in use 0.0.0.0:9002` happens because:
1. Previous Node.js processes didn't terminate properly
2. Multiple server instances are trying to use the same port
3. Background processes are holding the port

## 🚀 IMMEDIATE SOLUTIONS

### Option 1: One-Command Fix
```cmd
# Copy and paste this single command:
for /f "tokens=5" %a in ('netstat -ano ^| findstr ":9002"') do taskkill /F /PID %a && npx kill-port 9002 && npm run dev
```

### Option 2: Use the Quick Fix Script
```cmd
# Run this, then start normally:
QUICK-FIX.bat
npm run dev
```

### Option 3: Use the Smart Starter (RECOMMENDED)
```cmd
# This automatically handles everything:
start-timewise.bat
```

## 🛠️ Manual Steps (If Scripts Don't Work)

### Step 1: Find Processes Using Port 9002
```cmd
netstat -ano | findstr :9002
```

### Step 2: Kill Each Process
```cmd
# Replace XXXX with the actual PID numbers
taskkill /F /PID XXXX
taskkill /F /PID YYYY
```

### Step 3: Nuclear Option (Kill All Node.js)
```cmd
taskkill /F /IM node.exe
```

### Step 4: Start Server
```cmd
npm run dev
```

## 🔧 Prevention Tips

### Always Use These Commands:

#### To Start Server:
```cmd
# Best practice - use the script
start-timewise.bat

# Or manual with cleanup
npx kill-port 9002 && npm run dev
```

#### To Stop Server:
```cmd
# Proper way to stop
Ctrl + C (in the server terminal)

# Force stop if needed
taskkill /F /IM node.exe
```

#### To Restart Server:
```cmd
# Stop first, then start
Ctrl + C
npm run dev

# Or use the manager
server-manager.bat
```

## 🎯 ROOT CAUSE & PERMANENT FIX

The issue happens because:
1. **Background processes** from Claude Code execution
2. **Improper shutdowns** of previous servers
3. **Multiple terminals** running servers

### Permanent Solution:
Always use `start-timewise.bat` which:
- ✅ Automatically detects port conflicts
- ✅ Kills existing processes
- ✅ Cleans up properly
- ✅ Starts server fresh
- ✅ Shows all access URLs

## 🧪 Test Your Fix

### 1. Run the Solution
```cmd
start-timewise.bat
```

### 2. Verify Server Started
You should see:
```
✅ Previous server stopped
🌐 Starting server on port 9002...
▲ Next.js 15.3.3
- Local:        http://localhost:9002
- Network:      http://0.0.0.0:9002
✓ Ready in XXXXms
```

### 3. Test Access
Open browser to: `http://localhost:9002`
Should redirect to login page.

## 🆘 Emergency Commands

### If Nothing Works:
```cmd
# Nuclear option - kill everything
taskkill /F /IM node.exe
taskkill /F /IM cmd.exe /FI "WINDOWTITLE eq TimeWise*"

# Wait 5 seconds
timeout /t 5

# Start fresh
npm run dev
```

### Check What's Using Port 9002:
```cmd
netstat -ano | findstr :9002
```

### Kill Specific Process:
```cmd
taskkill /F /PID [PID_NUMBER]
```

---

## 🎉 SUCCESS INDICATORS

✅ No error messages  
✅ Server shows "Ready in XXXXms"  
✅ Can access http://localhost:9002  
✅ Login page loads correctly  

**Use `start-timewise.bat` for foolproof server starting!** 🚀