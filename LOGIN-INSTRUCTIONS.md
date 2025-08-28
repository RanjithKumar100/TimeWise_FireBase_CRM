# 🔐 TimeWise Login Instructions

## ✅ FIXED: Login Issue Resolved

The login error has been **FIXED**! The issue was:
1. Frontend was trying to connect to `http://timewise:9002` which couldn't be resolved
2. API client now properly detects localhost and uses `http://localhost:9002`
3. Added better error handling and debugging

## 📋 Working Login Credentials

Use any of these credentials to login:

### Quick Test Accounts (Simple Passwords)
- **Username**: `admin` → **Password**: `admin` (Admin Role)
- **Username**: `admin@test.com` → **Password**: `admin` (Admin Role)  
- **Username**: `user@test.com` → **Password**: `user` (User Role)

### Existing Account
- **Username**: `testadmin@timewise.com` → **Password**: `admin123` (Admin Role)

## 🚀 How to Login

1. **Open your browser** and go to: `http://localhost:9002`
2. **Use any of the credentials above**
3. **Click Login**

The system will automatically redirect you to the appropriate dashboard based on your role.

## 🔧 What Was Fixed

### 1. API Client Issues
- Fixed hostname resolution (`timewise` → `localhost`)
- Added better error handling and debugging
- Improved network error detection

### 2. Environment Configuration
- Updated `.env.local` to use `localhost` instead of `timewise`
- Fixed API URL resolution for development

### 3. Database Verification
- Confirmed users exist in database
- Verified password hashing works correctly
- Created easy-to-remember test accounts

## 🎯 Role-Based Access

### Admin Users (`admin`, `admin@test.com`, `testadmin@timewise.com`)
- Full system access
- User management
- View all timesheets
- System settings
- Audit logs

### Regular Users (`user@test.com`)
- Personal timesheet management
- 6-day editing window
- Personal reports
- Profile settings

## 🐛 Debugging Information

The system now provides detailed console logs:
- API request URLs
- Response status codes
- Error messages with context
- Network connectivity status

Open browser DevTools (F12) to see detailed logging during login.

## 🌐 Network Access

For network access from other devices, you'll need to:
1. Use the actual IP address instead of localhost
2. Run the hostname setup script: `SETUP-TIMEWISE-HOSTNAME.bat`
3. Access via `http://YOUR_IP:9002` from other devices

## 📞 Need Help?

If you still experience issues:
1. Check that the server is running on port 9002
2. Verify MongoDB is connected
3. Check browser console (F12) for detailed error logs
4. Try the simple credentials: `admin` / `admin`

**Status**: ✅ **WORKING** - Login system fully functional!