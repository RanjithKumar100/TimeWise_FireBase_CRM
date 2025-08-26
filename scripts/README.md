# Database Cleanup Scripts - Production Phase 1

This directory contains scripts to clean your MongoDB database and prepare it for production phase 1.

## ⚠️ **WARNING**
These scripts will **permanently delete ALL data** from your MongoDB database including:
- All user accounts
- All work log entries  
- All audit logs
- All notification logs

**Make sure you have backups if you need to preserve any existing data!**

## 📁 Files Included

| File | Description |
|------|-------------|
| `cleanup-database.js` | Main Node.js cleanup script |
| `cleanup-database.ps1` | PowerShell launcher script (Windows) |
| `cleanup-database.bat` | Batch file launcher (Windows) |
| `README.md` | This documentation file |

## 🚀 How to Run

### Option 1: Using Batch File (Easiest - Windows)
1. Double-click `cleanup-database.bat`
2. Follow the prompts
3. Type `YES` when asked to confirm

### Option 2: Using PowerShell (Windows)
```powershell
# Basic usage with confirmation
.\cleanup-database.ps1

# Force mode (skip confirmation)
.\cleanup-database.ps1 -Force
```

### Option 3: Using Node.js Directly
```bash
# Make sure you're in the project root directory
cd ..
node scripts/cleanup-database.js
```

## 📋 Prerequisites

1. **Node.js**: Ensure Node.js is installed and accessible via command line
2. **Environment File**: `.env.production.local` must exist with valid `MONGODB_URI`
3. **Database Access**: Ensure MongoDB server is running and accessible

## 🗂️ Collections Cleaned

The script will clean these MongoDB collections:
- `users` - User accounts and authentication data
- `worklogs` - Time tracking entries and work logs
- `auditlogs` - System audit trail and activity logs  
- `notificationlogs` - Email notification history

## 🔍 What the Script Does

1. **Connects** to MongoDB using `MONGODB_URI` from `.env.production.local`
2. **Lists** all existing collections in the database
3. **Deletes** all documents from the specified collections
4. **Verifies** cleanup by counting remaining documents
5. **Reports** summary of deleted documents

## ✅ After Cleanup

Once cleanup is complete, your database will be empty and ready for production phase 1. You should:

1. **Verify Configuration**: Check your `.env.production.local` settings
2. **Create Admin User**: Set up your first admin account
3. **Test Application**: Ensure all functionality works correctly
4. **Deploy to Production**: Move to your production server

## 🔧 Troubleshooting

### "Node.js not found" Error
- Install Node.js from [nodejs.org](https://nodejs.org/)
- Ensure Node.js is added to your system PATH

### "Environment file not found" Error  
- Make sure `.env.production.local` exists in the project root
- Verify it contains a valid `MONGODB_URI` setting

### Database Connection Errors
- Ensure MongoDB server is running
- Check that `MONGODB_URI` is correct
- Verify network connectivity to database

### Permission Errors
- Ensure the database user has delete permissions
- Check if database is locked or in use by other processes

## 📞 Support

If you encounter issues:
1. Check the error messages carefully
2. Verify all prerequisites are met
3. Ensure database credentials are correct
4. Try running the script directly with Node.js for more detailed error output

## 🎯 Production Readiness

After successful cleanup, your TIMEWISE application will be ready for production phase 1 with:
- Clean database state
- No test or development data
- Proper environment configuration
- Ready for user registration and data entry

**Good luck with your production deployment! 🚀**