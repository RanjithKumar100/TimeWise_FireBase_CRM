# TimeWise Production Hosting Guide

## Overview
This guide provides step-by-step instructions to host TimeWise CRM on your Windows Server 2022 with the domain `timesheet.toprockglobal.com`.

---

## 🖥️ Server Requirements

### Hardware Specifications
- **CPU**: 4+ cores (8 cores recommended)
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 100GB SSD minimum (500GB recommended)
- **Network**: 1Gbps connection with static public IP
- **OS**: Windows Server 2022 ✅ (Fully Compatible)

### Alternative OS Options
- Windows Server 2019/2016
- Ubuntu 20.04+ LTS
- CentOS 8+

---

## 📋 Pre-Deployment Checklist

### Domain & Network Requirements
- [ ] Admin access to `toprockglobal.com` DNS management
- [ ] Static public IP address for your server
- [ ] Router access for port forwarding configuration
- [ ] Firewall configuration permissions

### Server Access Requirements
- [ ] Administrator privileges on Windows Server 2022
- [ ] Internet connectivity on the server
- [ ] Remote Desktop or physical access to server

---

## 🔧 Phase 1: Server Environment Setup

### 1.1 Install Node.js
```powershell
# Download Node.js 18+ LTS
Invoke-WebRequest -Uri "https://nodejs.org/dist/v18.18.0/node-v18.18.0-x64.msi" -OutFile "nodejs.msi"
Start-Process msiexec.exe -Wait -ArgumentList '/I nodejs.msi /quiet'

# Verify installation
node --version
npm --version
```

### 1.2 Install MongoDB Community Server
```powershell
# Download MongoDB 6.0+ from: https://www.mongodb.com/try/download/community
# During installation:
# ✅ Install as Windows Service
# ✅ Install MongoDB Compass (GUI tool)
# ✅ Create data directory: C:\data\db

# Verify MongoDB service is running
sc query MongoDB
```

### 1.3 Install Git (if not already installed)
```powershell
# Download Git from: https://git-scm.com/download/win
# Or install via chocolatey:
choco install git
```

---

## 🌐 Phase 2: Network Configuration

### 2.1 Configure Windows Firewall
```powershell
# Allow TimeWise application port
New-NetFirewallRule -DisplayName "TimeWise App" -Direction Inbound -Protocol TCP -LocalPort 9002 -Action Allow

# Allow MongoDB (if external access needed)
New-NetFirewallRule -DisplayName "MongoDB" -Direction Inbound -Protocol TCP -LocalPort 27017 -Action Allow

# Allow HTTP and HTTPS
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

### 2.2 Router Port Forwarding Configuration
Configure your router to forward these ports to your server:
```
External Port 80   → Server IP:80   (HTTP)
External Port 443  → Server IP:443  (HTTPS)
External Port 9002 → Server IP:9002 (Direct app access)
```

---

## 🚀 Phase 3: Application Deployment

### 3.1 Create Application Directory
```powershell
# Create main directory
mkdir C:\inetpub\timesheet
cd C:\inetpub\timesheet

# Set proper permissions
icacls C:\inetpub\timesheet /grant "IIS_IUSRS:(OI)(CI)F" /T
```

### 3.2 Deploy Application Code
```powershell
# Clone your repository (replace with your repo URL)
git clone https://github.com/your-org/TimeWise_FireBase_CRM.git .

# Install dependencies
npm ci --production

# Build the application
npm run build
```

### 3.3 Create Environment Configuration
Create `.env.local` file in the application root:
```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/timewise

# Authentication Secrets (Generate secure keys)
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters
NEXTAUTH_SECRET=your-nextauth-secret-key-minimum-32-characters

# Environment
NODE_ENV=production
PORT=9002
HOST=0.0.0.0

# Email Configuration (if using email features)
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-email@company.com
SMTP_PASS=your-email-password
SMTP_FROM=noreply@toprockglobal.com
```

### 3.4 Initialize Database
```powershell
# Start the application to run initial setup
npm start

# Or run database seeding if available
npm run seed
```

---

## 🌍 Phase 4: Web Server Configuration

### 4.1 Install IIS and Required Modules
```powershell
# Enable IIS features
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpRedirect
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpLogging
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebSockets

# Install URL Rewrite Module
# Download from: https://www.iis.net/downloads/microsoft/url-rewrite
```

### 4.2 Create IIS Site Configuration
Create `web.config` in `C:\inetpub\timesheet\`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="TimeWise Proxy" stopProcessing="true">
          <match url=".*" />
          <conditions>
            <add input="{CACHE_URL}" pattern="^(.+)://" />
            <add input="{REQUEST_URI}" negate="true" pattern="^/health" />
          </conditions>
          <action type="Rewrite" url="http://localhost:9002/{R:0}" />
        </rule>
      </rules>
    </rewrite>
    <webSocket enabled="true" />
    <httpErrors errorMode="Detailed" />
  </system.webServer>
</configuration>
```

### 4.3 Create IIS Website
1. Open IIS Manager
2. Right-click "Sites" → "Add Website"
3. **Site Name**: TimeWise
4. **Physical Path**: `C:\inetpub\timesheet`
5. **Binding Type**: HTTP
6. **Port**: 80
7. **Host Name**: `timesheet.toprockglobal.com`

---

## 🔒 Phase 5: Domain and SSL Setup

### 5.1 DNS Configuration
Contact your domain provider and add these DNS records:
```dns
Type: A
Name: timesheet
Value: [YOUR_SERVER_PUBLIC_IP]
TTL: 300

# Alternative CNAME approach:
Type: CNAME
Name: timesheet
Value: toprockglobal.com
TTL: 300
```

### 5.2 SSL Certificate Installation

#### Option A: Let's Encrypt (Free)
```powershell
# Download and install win-acme
# From: https://github.com/win-acme/win-acme/releases

# Run certificate generation
.\wacs.exe --target manual --host timesheet.toprockglobal.com --store iis
```

#### Option B: Commercial SSL Certificate
1. Purchase SSL certificate for `timesheet.toprockglobal.com`
2. Generate Certificate Signing Request (CSR) in IIS
3. Install the issued certificate in IIS
4. Bind certificate to your website

### 5.3 Update IIS Binding for HTTPS
1. In IIS Manager, select your website
2. Click "Bindings" in the Actions panel
3. Add new binding:
   - **Type**: HTTPS
   - **Port**: 443
   - **Host Name**: `timesheet.toprockglobal.com`
   - **SSL Certificate**: Select your installed certificate

---

## 🔄 Phase 6: Service Configuration

### 6.1 Create Windows Service for TimeWise
Create `install-service.js`:
```javascript
const Service = require('node-windows').Service;

const svc = new Service({
  name: 'TimeWise Application',
  description: 'TimeWise Timesheet Management System',
  script: 'C:\\inetpub\\timesheet\\server.js',
  nodeOptions: [
    '--max_old_space_size=4096'
  ],
  env: {
    name: "NODE_ENV",
    value: "production"
  }
});

svc.on('install', () => {
  console.log('Service installed successfully');
  svc.start();
});

svc.on('alreadyinstalled', () => {
  console.log('Service already installed, starting...');
  svc.start();
});

svc.install();
```

Install and run:
```powershell
npm install -g node-windows
node install-service.js
```

### 6.2 Configure Service Auto-Start
```powershell
# Set service to start automatically
sc config "TimeWise Application" start= auto

# Start the service
sc start "TimeWise Application"

# Verify service status
sc query "TimeWise Application"
```

---

## 📊 Phase 7: Monitoring and Maintenance

### 7.1 Setup Application Monitoring
Create monitoring script `monitor.ps1`:
```powershell
# Check if TimeWise service is running
$service = Get-Service -Name "TimeWise Application" -ErrorAction SilentlyContinue
if ($service.Status -ne "Running") {
    Start-Service "TimeWise Application"
    Write-EventLog -LogName Application -Source "TimeWise Monitor" -EventId 1001 -Message "TimeWise service restarted"
}

# Check if website is responding
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9002/api/health/db" -TimeoutSec 10
    if ($response.StatusCode -ne 200) {
        throw "Health check failed"
    }
} catch {
    Restart-Service "TimeWise Application"
    Write-EventLog -LogName Application -Source "TimeWise Monitor" -EventId 1002 -Message "TimeWise application restarted due to health check failure"
}
```

Schedule this script to run every 5 minutes using Task Scheduler.

### 7.2 Setup Backup Strategy
Create backup script `backup.ps1`:
```powershell
$backupDate = Get-Date -Format "yyyy-MM-dd-HHmm"
$backupPath = "C:\Backups"

# Create backup directories
New-Item -Path "$backupPath\MongoDB\$backupDate" -ItemType Directory -Force
New-Item -Path "$backupPath\Application\$backupDate" -ItemType Directory -Force

# Backup MongoDB
mongodump --db timewise --out "$backupPath\MongoDB\$backupDate"

# Backup application files
Copy-Item -Path "C:\inetpub\timesheet" -Destination "$backupPath\Application\$backupDate" -Recurse -Force

# Compress backups
Compress-Archive -Path "$backupPath\MongoDB\$backupDate" -DestinationPath "$backupPath\MongoDB\timewise-db-$backupDate.zip"
Compress-Archive -Path "$backupPath\Application\$backupDate" -DestinationPath "$backupPath\Application\timewise-app-$backupDate.zip"

# Clean up old backups (keep last 7 days)
Get-ChildItem -Path "$backupPath\MongoDB" -Filter "*.zip" | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-7)} | Remove-Item
Get-ChildItem -Path "$backupPath\Application" -Filter "*.zip" | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-7)} | Remove-Item
```

Schedule daily backups using Task Scheduler.

---

## 🧪 Phase 8: Testing and Validation

### 8.1 Local Testing Checklist
- [ ] MongoDB service is running
- [ ] TimeWise service is running
- [ ] Application responds on `http://localhost:9002`
- [ ] IIS site is configured and running
- [ ] Local access works: `http://localhost`

### 8.2 External Access Testing
- [ ] Domain resolves correctly: `nslookup timesheet.toprockglobal.com`
- [ ] HTTP access works: `http://timesheet.toprockglobal.com`
- [ ] HTTPS access works: `https://timesheet.toprockglobal.com`
- [ ] SSL certificate is valid and trusted

### 8.3 Application Functionality Testing
- [ ] User login/registration works
- [ ] Timesheet entry creation works
- [ ] Admin panel is accessible
- [ ] Reports generation works
- [ ] Email notifications work (if configured)

---

## 🔧 Troubleshooting Guide

### Common Issues and Solutions

#### Issue: Application won't start
```powershell
# Check Node.js service logs
Get-EventLog -LogName Application -Source "TimeWise Application" -Newest 10

# Check application logs
Get-Content C:\inetpub\timesheet\logs\application.log -Tail 50
```

#### Issue: Database connection failed
```powershell
# Check MongoDB service
sc query MongoDB

# Test MongoDB connection
mongo --eval "db.runCommand('ping')"

# Check MongoDB logs
Get-Content "C:\Program Files\MongoDB\Server\6.0\log\mongod.log" -Tail 20
```

#### Issue: Domain not resolving
```powershell
# Test DNS resolution
nslookup timesheet.toprockglobal.com

# Test from external network
# Use online tools like: https://www.whatsmydns.net/
```

#### Issue: SSL certificate problems
```powershell
# Check certificate binding
netsh http show sslcert

# Test SSL certificate
# Use online tools like: https://www.ssllabs.com/ssltest/
```

---

## 📈 Performance Optimization

### Production Optimizations
1. **Enable Node.js Clustering**
2. **Configure MongoDB Indexes**
3. **Setup CDN for Static Assets**
4. **Enable Gzip Compression in IIS**
5. **Configure Application Caching**

### Scaling Considerations
- **Load Balancer**: For multiple server instances
- **Database Clustering**: MongoDB replica sets
- **CDN Integration**: CloudFlare or similar
- **Monitoring Tools**: Application Insights or similar

---

## 💰 Estimated Costs

### Infrastructure Costs (Monthly)
- **Server Hosting**: $100-300
- **Domain**: $1-2
- **SSL Certificate**: Free (Let's Encrypt) or $4-17
- **Backup Storage**: $10-50
- **Monitoring Tools**: $0-50

### One-time Setup Costs
- **Domain Registration**: $10-15/year
- **Commercial SSL**: $50-200/year (optional)
- **Professional Services**: $500-2000 (if outsourced)

---

## ⏱️ Implementation Timeline

- **Day 1**: Server setup, software installation
- **Day 2**: Application deployment, IIS configuration
- **Day 3**: Domain setup, SSL configuration
- **Day 4**: Testing, monitoring setup
- **Day 5**: Documentation, team training

**Total Estimated Time**: 5 business days

---

## 📞 Support and Maintenance

### Regular Maintenance Tasks
- [ ] **Weekly**: Check service status and logs
- [ ] **Weekly**: Verify backup completion
- [ ] **Monthly**: Apply Windows updates
- [ ] **Monthly**: Update Node.js and dependencies
- [ ] **Quarterly**: Review SSL certificate expiration
- [ ] **Quarterly**: Performance optimization review

### Emergency Contacts
- Server Administrator: [Your IT Contact]
- Domain Provider: [Provider Support]
- SSL Certificate Provider: [Certificate Support]
- Application Developer: [Developer Contact]

---

## 📚 Additional Resources

### Documentation Links
- [Node.js Production Deployment](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [MongoDB Production Deployment](https://docs.mongodb.com/manual/administration/production-notes/)
- [IIS Configuration Reference](https://docs.microsoft.com/en-us/iis/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

### Useful Tools
- **MongoDB Compass**: GUI for database management
- **Postman**: API testing tool
- **SSL Labs**: SSL certificate testing
- **GTmetrix**: Website performance testing

---

*This guide was generated for TimeWise CRM v0.1.0 - Last updated: 2025-09-25*