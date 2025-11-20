# 💾 TimeWise CRM - Complete Database Backup Guide

**Last Updated**: November 20, 2024

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Backup Methods](#backup-methods)
5. [Restore Methods](#restore-methods)
6. [Automated Backups](#automated-backups)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

TimeWise CRM includes a comprehensive backup and restore system for your MongoDB database.

### Features

✅ **Automated Backups**
- Compressed `.archive` files with gzip
- Automatic cleanup (keeps last 7 backups by default)
- Detailed logging
- Timestamp-based naming

✅ **Flexible Restore**
- Interactive selection
- Automatic or manual mode
- Safe restore with confirmation
- Optional data dropping

✅ **Easy to Use**
- Double-click BAT files
- NPM scripts
- Command-line interface

---

## 📦 Prerequisites

### Required: MongoDB Database Tools

**Download from**: https://www.mongodb.com/try/download/database-tools

**Installation:**
1. Download MongoDB Database Tools for Windows
2. Run the installer
3. Add to PATH (installer should do this automatically)
4. Verify installation:
   ```bash
   mongodump --version
   mongorestore --version
   ```

**If not in PATH:**
```bash
# Add to System PATH:
C:\Program Files\MongoDB\Tools\100\bin
```

---

## 🚀 Quick Start

### Create a Backup

**Option 1: Double-Click (Easiest)**
```
📂 scripts/database/backup-now.bat
```
Just double-click this file!

**Option 2: NPM Script**
```bash
npm run db:backup
```

**Option 3: Command Line**
```bash
node scripts/database/mongodb-backup-improved.js
```

### Restore a Backup

**Option 1: Double-Click (Easiest)**
```
📂 scripts/database/restore-backup.bat
```
Interactive mode - select from list!

**Option 2: NPM Script**
```bash
npm run db:restore
```

**Option 3: Command Line**
```bash
node scripts/database/mongodb-restore.js
```

---

## 💾 Backup Methods

### 1. Manual Backup (On-Demand)

#### Windows BAT File
```batch
# Double-click:
scripts/database/backup-now.bat
```

**What it does:**
- Reads MongoDB URI from `.env.local`
- Creates compressed backup with timestamp
- Saves to `backups/database/`
- Auto-cleans old backups (keeps 7)
- Shows size and duration
- Logs to `backups/database/backup.log`

#### NPM Command
```bash
npm run db:backup
```

**Output Example:**
```
🚀 Starting backup at 11/20/2024, 2:30:00 PM

🔍 Checking MongoDB tools installation...
✓ mongodump found: mongodump version: 100.8.0

╔════════════════════════════════════════════════════════════════╗
║         TimeWise CRM - MongoDB Backup Process                  ║
╚════════════════════════════════════════════════════════════════╝

🗄️  Database: Timewise
📁 Backup Location: C:\...\backups\database\timewise_Timewise_2024-11-20_14-30-00.archive
🔐 MongoDB URI: mongodb://*****@localhost:27017/Timewise

✅ Backup completed successfully!
⏱️  Duration: 2.45s
💾 Backup Size: 1.23 MB
📍 Location: C:\...\backups\database\timewise_Timewise_2024-11-20_14-30-00.archive

🧹 Cleaning up old backups...
📊 Found 8 existing backup(s)
🗑️  Removing 1 old backup(s)...
   ✓ Deleted: timewise_Timewise_2024-11-13_14-30-00.archive (1.20 MB)

═══════════════════════════════════════════════════════════════════
🎉 BACKUP COMPLETED SUCCESSFULLY!
═══════════════════════════════════════════════════════════════════
```

### 2. List All Backups

```bash
npm run db:backup:list
```

**Output:**
```
📦 Available Backups (7):
────────────────────────────────────────────────────────────────────
1. timewise_Timewise_2024-11-20_14-30-00.archive
   Size: 1.23 MB | Date: 11/20/2024, 2:30:00 PM
2. timewise_Timewise_2024-11-19_14-30-00.archive
   Size: 1.20 MB | Date: 11/19/2024, 2:30:00 PM
...
────────────────────────────────────────────────────────────────────
```

### 3. Configuration

**Backup Settings** (in `.env.local`):
```env
MONGODB_URI=mongodb://localhost:27017/Timewise
MAX_BACKUPS=7  # Optional: Default is 7
```

**Backup Location:**
```
TimeWise_FireBase_CRM/
└── backups/
    └── database/
        ├── timewise_Timewise_2024-11-20_14-30-00.archive
        ├── timewise_Timewise_2024-11-19_14-30-00.archive
        ├── backup.log
        └── restore.log
```

---

## ♻️ Restore Methods

### 1. Interactive Restore (Recommended)

```bash
npm run db:restore
```

**Steps:**
1. Shows list of available backups
2. Select backup number
3. Choose whether to drop existing data
4. Confirm restore
5. Database restored!

**Example:**
```
╔════════════════════════════════════════════════════════════════╗
║         TimeWise CRM - Available Backups                       ║
╚════════════════════════════════════════════════════════════════╝

1. timewise_Timewise_2024-11-20_14-30-00.archive
   Size: 1.23 MB | Created: 11/20/2024, 2:30:00 PM

2. timewise_Timewise_2024-11-19_14-30-00.archive
   Size: 1.20 MB | Created: 11/19/2024, 2:30:00 PM

Enter backup number to restore (or 0 to cancel): 1

⚠️  WARNING: This will restore the database!
   Backup: timewise_Timewise_2024-11-20_14-30-00.archive
   Target Database: Timewise

Drop existing data before restore? (yes/no): no
Are you sure you want to continue? (yes/no): yes

🔄 Starting restore process...

✅ Restore completed successfully!
⏱️  Duration: 1.87s
🗄️  Database: Timewise
```

### 2. Windows BAT File

```batch
# Double-click:
scripts/database/restore-backup.bat
```

### 3. Specific Backup File

```bash
node scripts/database/mongodb-restore.js "C:\path\to\backup.archive"
```

**With drop flag:**
```bash
node scripts/database/mongodb-restore.js "C:\path\to\backup.archive" --drop
```

---

## ⏰ Automated Backups

### Windows Task Scheduler

**Setup (One-Time):**

1. **Run as Administrator:**
   ```batch
   scripts/database/setup-backup-schedule.bat
   ```

2. **Configuration:**
   - Task Name: "TimeWise MongoDB Backup"
   - Frequency: Every 15 days
   - Time: 2:00 AM
   - Runs as: SYSTEM

**Customize Schedule:**

Edit `setup-backup-schedule.bat`:
```batch
schtasks /create ^
  /tn "TimeWise MongoDB Backup" ^
  /tr "\"%BACKUP_SCRIPT%\"" ^
  /sc daily ^            ← Change frequency
  /mo 1 ^                ← Every 1 day (instead of 15)
  /st 02:00 ^            ← Change time
  /ru "SYSTEM" ^
  /f
```

**Frequency Options:**
- `/sc daily /mo 1` - Every day
- `/sc daily /mo 7` - Every 7 days
- `/sc weekly` - Every week
- `/sc monthly` - Every month

**View Scheduled Task:**
1. Press `Win + R`
2. Type `taskschd.msc`
3. Look for "TimeWise MongoDB Backup"

**Delete Scheduled Task:**
```batch
schtasks /delete /tn "TimeWise MongoDB Backup" /f
```

### Cron (Linux/Mac)

If deploying on Linux:

```bash
# Edit crontab
crontab -e

# Add this line for daily backup at 2 AM:
0 2 * * * cd /path/to/TimeWise_FireBase_CRM && npm run db:backup >> backups/database/cron.log 2>&1
```

---

## ✅ Best Practices

### 1. Regular Backups

**Recommended Schedule:**
- **Production**: Daily backups
- **Development**: Weekly backups
- **Before Updates**: Always backup before deploying

### 2. Off-Site Backups

Store backups in multiple locations:

```bash
# Copy to network drive
xcopy /Y backups\database\*.archive \\server\backups\timewise\

# Or upload to cloud storage
# Use AWS S3, Google Drive, Dropbox, etc.
```

### 3. Test Restores

**Monthly Practice:**
1. Create test database
2. Restore backup to test database
3. Verify data integrity
4. Delete test database

### 4. Monitor Backup Logs

```bash
# View backup log
type backups\database\backup.log

# View recent backups
npm run db:backup:list
```

### 5. Backup Retention

Default: 7 backups (about 1 week)

**Adjust retention:**
```env
# .env.local
MAX_BACKUPS=30  # Keep 30 backups
```

### 6. Before Major Changes

**Always backup before:**
- Software updates
- Database migrations
- Schema changes
- Bulk data operations
- Major configuration changes

```bash
# Quick backup before update
npm run db:backup
```

---

## 🔧 Troubleshooting

### Problem: "mongodump not found"

**Solution:**
1. Install MongoDB Database Tools
2. Add to PATH: `C:\Program Files\MongoDB\Tools\100\bin`
3. Restart terminal
4. Test: `mongodump --version`

### Problem: "Connection failed"

**Solution:**
1. Check MongoDB is running:
   ```bash
   # Windows
   net start MongoDB

   # Or check services
   services.msc
   ```

2. Verify connection string in `.env.local`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/Timewise
   ```

3. Test connection:
   ```bash
   mongosh mongodb://localhost:27017/Timewise
   ```

### Problem: "Permission denied"

**Solution:**
- Run as Administrator
- Check backup folder permissions
- Check disk space

### Problem: "Backup file too large"

**Solution:**
1. Check database size:
   ```bash
   mongosh
   use Timewise
   db.stats()
   ```

2. Increase MAX_BACKUPS if needed
3. Clean up old data in database

### Problem: "Restore failed"

**Solution:**
1. Check backup file exists and isn't corrupted
2. Ensure MongoDB is running
3. Try with `--drop` flag to replace existing data
4. Check disk space

---

## 📊 Backup File Information

### File Naming Convention

```
timewise_[DATABASE]_[TIMESTAMP].archive
```

**Example:**
```
timewise_Timewise_2024-11-20_14-30-00.archive
         ^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^
         Database  YYYY-MM-DD_HH-MM-SS
```

### File Format

- **Format**: MongoDB Archive (compressed)
- **Compression**: gzip
- **Extension**: `.archive`
- **Typical Size**: 1-5 MB (depends on data)

### Backup Contents

Complete database backup including:
- All collections (Users, WorkLogs, Leaves, etc.)
- All documents
- Indexes
- Collection metadata

**What's NOT included:**
- MongoDB configuration
- User authentication data (separate from app)
- File uploads (if any)

---

## 📝 NPM Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run db:backup` | Create manual backup |
| `npm run db:restore` | Restore from backup (interactive) |
| `npm run db:backup:list` | List all available backups |
| `npm run db:seed` | Create admin user |

---

## 🎯 Quick Reference Card

```
┌─────────────────────────────────────────────┐
│  TIMEWISE CRM - BACKUP QUICK REFERENCE      │
├─────────────────────────────────────────────┤
│  CREATE BACKUP                              │
│  » npm run db:backup                        │
│  » scripts/database/backup-now.bat          │
├─────────────────────────────────────────────┤
│  RESTORE BACKUP                             │
│  » npm run db:restore                       │
│  » scripts/database/restore-backup.bat      │
├─────────────────────────────────────────────┤
│  LIST BACKUPS                               │
│  » npm run db:backup:list                   │
├─────────────────────────────────────────────┤
│  SCHEDULE AUTO-BACKUP (ONE-TIME SETUP)      │
│  » scripts/database/setup-backup-schedule.bat │
├─────────────────────────────────────────────┤
│  BACKUP LOCATION                            │
│  » backups/database/                        │
└─────────────────────────────────────────────┘
```

---

**Developed by Lab of Future (LOF)**
