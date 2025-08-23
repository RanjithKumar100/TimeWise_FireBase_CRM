# 🚀 Firebase Timesheet - Quick Start Guide

## 📋 Prerequisites
1. **Node.js** (version 18+) installed
2. **MongoDB** running locally or MongoDB Atlas connection string
3. **Network access** - ensure devices are on same network

## ⚡ Super Quick Start

### Option 1: Automated (Recommended)
```bash
# Single command deployment
npm run server:deploy
```

### Option 2: Windows Batch File
```bash
# Double-click or run
start-server.bat
```

## 🔧 Manual Steps (if needed)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
```bash
# Auto-configure server IP
npm run server:setup
```

### Step 3: Build Application
```bash
# Clean build (fixes build errors)
npm run build:clean
```

### Step 4: Start Server
```bash
# Production server
npm run start:prod
```

## 🌐 Access the Application

### From Your Server Machine:
- `http://localhost:9002`

### From Other Devices:
- `http://YOUR_SERVER_IP:9002`
- Example: `http://192.168.1.100:9002`

## 🔐 Default Login Credentials

**Admin Account:**
- Email: `admin@timewise.com`
- Password: `admin123`

**User Account:**
- Email: `user@timewise.com`
- Password: `user123`

## 🛠️ Troubleshooting

### If Build Errors Occur:
```bash
# Clean everything and rebuild
npm run build:clean
```

### If Server Won't Start:
```bash
# Check server status
npm run server:check

# Run diagnostics
npm run server:troubleshoot
```

### If Login Fails:
1. Check browser console (F12)
2. Click "Debug Connection" button on login page
3. Verify MongoDB is running
4. Check firewall settings for port 9002

### Common Issues:

**"Cannot find module" errors:**
```bash
npm run clean
npm run build
```

**"Failed to fetch" errors:**
- Ensure server is running on port 9002
- Check Windows Firewall
- Verify devices are on same network

**MongoDB connection errors:**
- Start MongoDB service
- Check connection string in `.env.production.local`

## ✅ Success Indicators

When everything works correctly:
- ✅ Server starts without errors
- ✅ Can access login page from other devices
- ✅ Login credentials work across all devices
- ✅ No console errors in browser
- ✅ Users can create and view timesheets

## 📱 Mobile Access

Users can access from phones/tablets:
1. Connect to same WiFi network
2. Open mobile browser
3. Navigate to: `http://SERVER_IP:9002`
4. Bookmark for easy access

## 🔒 Security Notes

**IMPORTANT:** After setup:
1. Change default admin password
2. Change default user password  
3. Update JWT secret in `.env.production.local`
4. Use strong passwords for production

## 📞 Support

If issues persist:
1. Run: `npm run server:troubleshoot`
2. Check console logs and browser developer tools
3. Ensure MongoDB is accessible
4. Verify network connectivity between devices

The application should now be fully functional across all devices on your network!