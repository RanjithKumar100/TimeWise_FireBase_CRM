# 🚀 Quick Start Guide - TimeWise CRM

## Choose Your Startup Mode

### 🔵 Development Mode (Recommended for Testing)
**Double-click:** `start-timewise.bat`

**What it does:**
- ✅ Checks Node.js installation
- ✅ Installs dependencies if needed
- ✅ Creates .env.local if missing
- ✅ Kills existing processes
- ✅ Starts development server
- ✅ Opens browser automatically
- ✅ Hot reload enabled (auto-refresh on code changes)

**Access at:** http://localhost:9002

**Use when:**
- Testing the application
- Making changes to code
- Daily development work

---

### 🟢 Production Mode (For Live Server)
**Double-click:** `start-timewise-production.bat`

**What it does:**
- ✅ Installs PM2 if needed
- ✅ Builds optimized production bundle
- ✅ Starts with PM2 process manager
- ✅ Auto-restart on crash
- ✅ Runs in background (survives terminal close)
- ✅ Can auto-start on system reboot

**Access at:** http://localhost:9002

**Use when:**
- Deploying to production server
- Need 24/7 uptime
- Need auto-restart on crash
- Running on live server

---

## 📋 First Time Setup

1. **Install Node.js** (if not already installed)
   - Download from: https://nodejs.org
   - Recommended: v18.x or higher

2. **Install MongoDB**
   - Local: https://www.mongodb.com/try/download/community
   - OR use MongoDB Atlas (cloud): https://www.mongodb.com/atlas

3. **Run the startup script**
   - Development: Double-click `start-timewise.bat`
   - Production: Double-click `start-timewise-production.bat`

4. **Configure on first run**
   - The script will create `.env.local` from `.env.example`
   - Edit with your settings:
     - MongoDB connection string
     - JWT secret
     - Email credentials (optional)

5. **Create admin user**
   ```bash
   npm run db:seed
   ```
   Default credentials:
   - Email: admin@example.com
   - Password: admin123456

---

## 🎮 Common Commands

### Development
```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run lint          # Check code quality
npm run typecheck     # Check TypeScript errors
```

### Production (PM2)
```bash
npm run pm2:start     # Start with PM2
npm run pm2:stop      # Stop PM2 processes
npm run pm2:restart   # Restart app
npm run pm2:logs      # View logs
pm2 monit            # Real-time monitoring
pm2 list             # List all processes
```

### Database
```bash
npm run db:seed       # Create admin user
```

---

## 🔧 Troubleshooting

### Server won't start?
1. Check MongoDB is running
2. Check `.env.local` file exists and is configured
3. Run `npm install` to install dependencies
4. Check port 9002 is not already in use

### Dependencies error?
```bash
npm install
```

### Build error?
```bash
npm run clean
npm run build
```

### PM2 issues?
```bash
pm2 delete all        # Remove all processes
npm run pm2:start     # Start fresh
```

### Port already in use?
```bash
# Windows
netstat -ano | findstr :9002
taskkill /PID [PID_NUMBER] /F

# Or change port in .env.local
PORT=3000
```

---

## 📂 Project Structure

```
TimeWise_FireBase_CRM/
├── start-timewise.bat              ← Development startup
├── start-timewise-production.bat   ← Production startup
├── .env.local                       ← Your configuration
├── src/                             ← Source code
├── public/                          ← Static assets
├── scripts/                         ← Utility scripts
└── docs/                            ← Documentation
```

---

## 🌐 Access Points

| Role | Default Login |
|------|---------------|
| **Admin** | admin@example.com / admin123456 |
| **User** | Create via Admin Panel |
| **Inspection** | Create via Admin Panel |
| **Developer** | Create via Admin Panel |

---

## 📞 Support

- Documentation: See `docs/` folder
- Deployment Guide: `docs/deployment/DEPLOYMENT_GUIDE.md`
- Production Restructure: `docs/deployment/PRODUCTION_RESTRUCTURE.md`

---

## ⚡ Quick Commands Reference

| Action | Command |
|--------|---------|
| Start Dev Server | `start-timewise.bat` |
| Start Production | `start-timewise-production.bat` |
| View Logs | `npm run pm2:logs` |
| Restart App | `npm run pm2:restart` |
| Stop App | `npm run pm2:stop` |
| Create Admin | `npm run db:seed` |
| Build App | `npm run build` |
| Monitor | `pm2 monit` |

---

**Developed by Lab of Future (LOF)**
