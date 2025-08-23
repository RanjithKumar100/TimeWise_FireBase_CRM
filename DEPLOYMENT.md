# Firebase Timesheet - Server Deployment Guide

This guide will help you deploy the Firebase Timesheet application on a server that can be accessed by multiple users from different devices using an IP address.

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```bash
# Run the automated deployment script
npm run server:deploy
```

### Option 2: Manual Setup
```bash
# 1. Configure server IP
npm run server:setup

# 2. Build the application
npm run build

# 3. Start the production server
npm run start:prod
```

## 📋 Prerequisites

### 1. Node.js & npm
- Node.js version 18+ installed
- npm package manager

### 2. MongoDB Database
Choose one of these options:

**Option A: Local MongoDB**
- Install MongoDB on your server
- Default connection: `mongodb://localhost:27017/TIMEWISE`

**Option B: MongoDB Atlas (Cloud)**
- Create a free MongoDB Atlas account
- Get your connection string
- Update `MONGODB_URI` in `.env.production.local`

### 3. Network Configuration
- Ensure port `9002` is open and accessible
- Configure firewall if necessary
- Server should be on the same network as client devices

## ⚙️ Configuration

### 1. Environment Variables
Edit `.env.production.local`:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/TIMEWISE
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.xxxxx.mongodb.net/timewise

# JWT Secret - CHANGE THIS FOR SECURITY
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Server Configuration (auto-configured by setup script)
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:9002
```

### 2. Security Setup
**IMPORTANT**: Change the JWT secret for production:
```bash
# Generate a secure random string (32+ characters)
# You can use online generators or this command:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🖥️ Server Deployment

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Server
```bash
# This will auto-detect your server IP and configure the environment
npm run server:setup
```

### Step 3: Build Application
```bash
npm run build
```

### Step 4: Start Production Server
```bash
npm run start:prod
```

### Step 5: Access the Application
- Server will be running on: `http://YOUR_SERVER_IP:9002`
- Share this URL with users on your network
- Users can access from any device (phones, tablets, laptops)

## 👥 Default Login Credentials

**Admin Account:**
- Email: `admin@timewise.com`
- Password: `admin123`

**User Account:**
- Email: `user@timewise.com`  
- Password: `user123`

**⚠️ IMPORTANT**: Change these default passwords after first login!

## 📱 Client Access

Users can access the application from any device:

### Desktop/Laptop
- Open web browser
- Go to: `http://YOUR_SERVER_IP:9002`

### Mobile Devices
- Open mobile browser (Chrome, Safari, etc.)
- Go to: `http://YOUR_SERVER_IP:9002`
- Bookmark for easy access

### Network Requirements
- All devices must be on the same network as the server
- Or server must be accessible over the internet (requires additional security setup)

## 🔧 Troubleshooting

### Common Issues

**1. Cannot access from other devices**
- Check firewall settings on server
- Ensure port 9002 is open
- Verify all devices are on same network
- Try: `telnet YOUR_SERVER_IP 9002`

**2. MongoDB connection failed**
- Check if MongoDB service is running
- Verify MongoDB URI in environment file
- Check MongoDB logs for errors

**3. Application won't start**
- Check Node.js version (18+ required)
- Verify all dependencies installed: `npm install`
- Check server logs for error messages

### Network Testing

**Test server connectivity:**
```bash
# From another device on the network
ping YOUR_SERVER_IP
telnet YOUR_SERVER_IP 9002
```

**Check if server is listening:**
```bash
# On the server machine
netstat -an | grep 9002
# OR
ss -tulpn | grep 9002
```

## 🔒 Security Considerations

### For Production Use:
1. **Change JWT Secret** - Use a strong, random secret key
2. **Change Default Passwords** - Update admin and user passwords
3. **Enable HTTPS** - Consider using a reverse proxy (nginx/apache) with SSL
4. **Firewall** - Restrict access to necessary ports only
5. **Updates** - Keep dependencies updated regularly

### Network Security:
- Use on trusted networks only
- Consider VPN for remote access
- Monitor access logs regularly

## 📊 Monitoring & Maintenance

### View Server Logs
```bash
# Server will output logs to console
# Consider using PM2 for production process management:
npm install -g pm2
pm2 start npm --name "timesheet" -- run start:prod
pm2 logs timesheet
```

### Database Backup
```bash
# For local MongoDB
mongodump --db TIMEWISE --out ./backup/$(date +%Y%m%d)

# For MongoDB Atlas, use their backup features
```

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review server console logs for errors
3. Verify network connectivity between devices
4. Ensure MongoDB is running and accessible

## 🎉 Success!

Once deployed successfully:
- ✅ Server is accessible via IP address
- ✅ Multiple users can login simultaneously  
- ✅ Data is synchronized across all devices
- ✅ Mobile-responsive interface works on all devices
- ✅ Admin can manage users and view all reports
- ✅ Users can track their time and view personal reports