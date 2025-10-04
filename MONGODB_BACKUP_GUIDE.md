# TimeWise MongoDB Backup System

## Overview
This automated backup system creates compressed MongoDB backups every 15 days at 2:00 AM and maintains up to 5 most recent backups automatically.

## 📋 Prerequisites

### 1. Install MongoDB Database Tools
Download and install MongoDB Database Tools from:
https://www.mongodb.com/try/download/database-tools

Make sure `mongodump` and `mongorestore` commands are available in your system PATH.

### 2. Verify Installation
Open Command Prompt and run:
```bash
mongodump --version
mongorestore --version
```

## 🚀 Quick Setup

### Step 1: Setup Automatic Backup Schedule
1. **Run as Administrator**: Right-click `scripts/setup-backup-schedule.bat` and select "Run as administrator"
2. This will create a Windows scheduled task named "TimeWise MongoDB Backup"
3. The backup will run every 15 days at 2:00 AM

### Step 2: Test Backup Manually
Run `scripts/backup-database.bat` to test the backup system immediately.

## 📁 File Structure

```
scripts/
├── mongodb-backup.js           # Main backup script
├── mongodb-restore.js          # Restore utility
├── backup-database.bat         # Manual backup runner
├── restore-database.bat        # Manual restore runner
└── setup-backup-schedule.bat   # Schedule setup script

backups/                        # Backup storage directory
├── timewise_backup_2025-09-18.archive
├── timewise_backup_2025-09-03.archive
├── backup.log                  # Backup operations log
└── restore.log                 # Restore operations log
```

## 🔧 Manual Operations

### Create Backup Now
Double-click `scripts/backup-database.bat` or run:
```bash
cd scripts
node mongodb-backup.js
```

### Restore from Backup
Double-click `scripts/restore-database.bat` or run:
```bash
cd scripts
node mongodb-restore.js
```

### View Scheduled Task
1. Press `Win + R`, type `taskschd.msc`, press Enter
2. Look for "TimeWise MongoDB Backup" in the task list

## ⚙️ Configuration

### Backup Settings (mongodb-backup.js)
- **Database**: `Timewise`
- **URI**: `mongodb://localhost:27017`
- **Backup Directory**: `./backups/`
- **Max Backups**: `5` (automatic cleanup)
- **Format**: Compressed archive with gzip

### Schedule Settings
- **Frequency**: Every 15 days
- **Time**: 2:00 AM
- **User**: SYSTEM (runs even when no user is logged in)

## 📊 Backup Features

### ✅ What's Included
- **Complete database backup** with all collections
- **Compressed format** (gzip) to save space
- **Automatic cleanup** (keeps only 5 recent backups)
- **Detailed logging** with timestamps
- **Error handling** and recovery
- **Backup verification** and size reporting

### 📈 Backup Information
Each backup includes:
- All user accounts and passwords
- Work log entries with time data
- System configuration
- Audit logs and notifications
- Leave records and permissions

## 🛠️ Troubleshooting

### Common Issues

#### 1. "mongodump not found"
**Solution**: Install MongoDB Database Tools and add to system PATH

#### 2. "Access denied" during schedule setup
**Solution**: Run `setup-backup-schedule.bat` as Administrator

#### 3. Backup fails with connection error
**Solution**: Ensure MongoDB service is running:
```bash
net start MongoDB
```

#### 4. Insufficient disk space
**Solution**:
- Free up disk space
- Adjust `MAX_BACKUPS` in `mongodb-backup.js`
- Move backup directory to another drive

### Backup Logs
Check `backups/backup.log` and `backups/restore.log` for detailed operation history.

## 🔐 Security Considerations

### Backup Security
- Backups contain sensitive data (user credentials, personal information)
- Store backup directory in a secure location
- Consider encrypting backup files for additional security
- Regularly test restore procedures

### Access Control
- Scheduled task runs as SYSTEM user
- Backup files inherit directory permissions
- Restrict access to backup directory

## 📅 Maintenance

### Regular Tasks
1. **Monthly**: Verify backup schedule is running
2. **Quarterly**: Test restore procedure with a backup
3. **Annually**: Review and update backup retention policy

### Monitoring
- Check `backup.log` for successful backups
- Verify backup file sizes are reasonable
- Test restore process periodically

## 🆘 Emergency Procedures

### Quick Restore (Data Loss Recovery)
1. Stop the TimeWise application
2. Run `restore-database.bat`
3. Select the most recent backup
4. Type "YES" to confirm restoration
5. Restart the TimeWise application

### Backup Verification
```bash
# List backup contents (for archive files)
mongodump --archive="backups/timewise_backup_2025-09-18.archive" --gzip --dryRun
```

## 🔧 Advanced Configuration

### Custom Backup Location
Edit `mongodb-backup.js` and change:
```javascript
const BACKUP_DIR = path.join('D:', 'TimeWise', 'backups'); // Custom location
```

### Different Schedule
Modify `setup-backup-schedule.bat`:
```batch
/sc daily /mo 7    # Every 7 days instead of 15
/st 03:00          # 3:00 AM instead of 2:00 AM
```

### Additional Databases
Add more databases to backup in `mongodb-backup.js`:
```javascript
const DATABASES = ['Timewise', 'AnotherDB'];
```

## 📞 Support

If you encounter issues with the backup system:
1. Check the log files in the `backups/` directory
2. Verify MongoDB service is running
3. Ensure sufficient disk space is available
4. Test MongoDB tools manually with simple commands

## 🎯 Best Practices

1. **Test restores regularly** - Backups are only good if they can be restored
2. **Monitor backup sizes** - Sudden changes might indicate issues
3. **Keep multiple backup locations** - Consider copying to external storage
4. **Document any customizations** - Make notes of configuration changes
5. **Monitor backup logs** - Set up alerts for backup failures if possible

---

*Generated for TimeWise Firebase CRM - MongoDB Backup System v1.0*