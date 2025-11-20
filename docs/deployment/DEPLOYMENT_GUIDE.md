# TimeWise CRM - IIS Reverse Proxy Deployment Guide

## ✅ Step 1: Build Complete
The application has been rebuilt with the new domain configuration.
- Updated URLs from `timewise.cmis.ac.in:9002` to `timewise.cmis.ac.in`
- Build successful ✓

---

## 🚀 Step 2: Run IIS Setup Script (AS ADMINISTRATOR)

### **Open PowerShell as Administrator:**

1. Press `Win + X`
2. Click **"Windows PowerShell (Admin)"** or **"Terminal (Admin)"**
3. Navigate to project folder:
   ```powershell
   cd C:\Users\TRG\Documents\LOF-CS\TimeWise_FireBase_CRM
   ```

4. Run the setup script:
   ```powershell
   .\setup-iis-reverse-proxy.ps1
   ```

### **What the script does:**
- ✅ Installs IIS with WebSocket support
- ✅ Downloads and installs URL Rewrite Module
- ✅ Downloads and installs Application Request Routing (ARR)
- ✅ Enables ARR Proxy functionality
- ✅ Creates web.config for reverse proxy
- ✅ Creates IIS website and application pool
- ✅ Configures Windows Firewall (ports 80, 443)

---

## 📝 Alternative: Manual Step-by-Step Commands

If you prefer to run commands manually, here's the complete sequence:

### **1. Install IIS Features**
```powershell
Install-WindowsFeature -Name Web-Server -IncludeManagementTools
Install-WindowsFeature -Name Web-WebSockets
```

### **2. Download and Install URL Rewrite**
```powershell
$urlRewriteUrl = "https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi"
$urlRewritePath = "$env:TEMP\urlrewrite.msi"
Invoke-WebRequest -Uri $urlRewriteUrl -OutFile $urlRewritePath
Start-Process msiexec.exe -ArgumentList "/i `"$urlRewritePath`" /quiet /norestart" -Wait
```

### **3. Download and Install ARR**
```powershell
$arrUrl = "https://download.microsoft.com/download/E/9/8/E9849D6A-020E-47E4-9FD0-A023E99B54EB/requestRouter_amd64.msi"
$arrPath = "$env:TEMP\arr.msi"
Invoke-WebRequest -Uri $arrUrl -OutFile $arrPath
Start-Process msiexec.exe -ArgumentList "/i `"$arrPath`" /quiet /norestart" -Wait
```

### **4. Enable ARR Proxy**
```powershell
Import-Module WebAdministration
Set-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter "system.webServer/proxy" -Name "enabled" -Value "True"
```

### **5. Create IIS Site**
```powershell
$siteName = "TimeWise"
$appPoolName = "TimeWiseAppPool"
$sitePath = "C:\Users\TRG\Documents\LOF-CS\TimeWise_FireBase_CRM"

# Create app pool
New-WebAppPool -Name $appPoolName
Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name managedRuntimeVersion -Value ''

# Create website
New-Website -Name $siteName -PhysicalPath $sitePath -Port 80 -ApplicationPool $appPoolName -HostHeader "timewise.cmis.ac.in"
Start-Website -Name $siteName
```

### **6. Configure Firewall**
```powershell
New-NetFirewallRule -DisplayName "HTTP Inbound" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "HTTPS Inbound" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
```

---

## 🔄 Step 3: Setup PM2 (Keep Next.js Running)

### **Install PM2:**
```powershell
npm install -g pm2
npm install -g pm2-windows-startup
```

### **Configure PM2 Startup:**
```powershell
pm2-startup install
```

### **Start Your App:**
```powershell
cd C:\Users\TRG\Documents\LOF-CS\TimeWise_FireBase_CRM
pm2 start npm --name "timewise" -- start
pm2 save
```

### **Check PM2 Status:**
```powershell
pm2 status
pm2 logs timewise
```

---

## 🧪 Step 4: Testing

### **Test 1: Backend Running (Port 9002)**
```powershell
Invoke-WebRequest -Uri "http://localhost:9002" -Method GET
```
**Expected:** Should return HTML from Next.js

### **Test 2: IIS Reverse Proxy (Port 80)**
```powershell
Invoke-WebRequest -Uri "http://localhost" -Headers @{"Host"="timewise.cmis.ac.in"}
```
**Expected:** Should return the same HTML as Test 1

### **Test 3: From Browser**
Open browser and navigate to:
```
http://timewise.cmis.ac.in
```
**Expected:** Login page should load without port number in URL

### **Test 4: API Endpoints**
```powershell
Invoke-WebRequest -Uri "http://timewise.cmis.ac.in/api/health/db" -Method GET
```
**Expected:** Database health check response

---

## 🔍 Troubleshooting

### **Issue: "Page cannot be displayed"**
**Check:**
1. Is Next.js running on port 9002?
   ```powershell
   netstat -ano | findstr :9002
   ```
2. Is IIS site running?
   ```powershell
   Get-Website | Where-Object {$_.Name -eq "TimeWise"}
   ```

### **Issue: "HTTP Error 502.3 - Bad Gateway"**
**Solution:** Next.js backend is not running
```powershell
cd C:\Users\TRG\Documents\LOF-CS\TimeWise_FireBase_CRM
npm start
```

### **Issue: "HTTP Error 404.0 - Not Found"**
**Solution:** Check web.config exists and ARR is enabled
```powershell
Test-Path "C:\Users\TRG\Documents\LOF-CS\TimeWise_FireBase_CRM\web.config"
Get-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter "system.webServer/proxy" -Name "enabled"
```

### **View IIS Logs:**
```powershell
notepad "C:\inetpub\logs\LogFiles\W3SVC1\*"
```

---

## 📊 Current Status

### **Files Modified:**
- ✅ `.env.local` - Updated URLs
- ✅ `.env.production.local` - Updated URLs
- ✅ `next.config.ts` - Already configured for proxy
- ✅ Application rebuilt successfully

### **Files Created:**
- ✅ `setup-iis-reverse-proxy.ps1` - Automated setup script
- ✅ `web.config` - Reverse proxy configuration
- ✅ `DEPLOYMENT_GUIDE.md` - This guide

### **Next Steps:**
1. ⏭️ Run `setup-iis-reverse-proxy.ps1` as Administrator
2. ⏭️ Start Next.js with PM2
3. ⏭️ Test access via http://timewise.cmis.ac.in
4. ⏭️ (Optional) Setup SSL certificate for HTTPS

---

## 🔒 Optional: Add HTTPS with SSL

### **Using Let's Encrypt (Free):**

1. **Install Win-ACME (Free SSL tool for Windows)**
   - Download: https://www.win-acme.com/
   - Extract to `C:\win-acme`

2. **Run Win-ACME:**
   ```powershell
   cd C:\win-acme
   .\wacs.exe
   ```

3. **Follow wizard:**
   - Select: "N: Create certificate"
   - Select: "1: IIS (default bindings)"
   - Choose your site: "TimeWise"
   - Enter email for renewal notifications

4. **Auto-renewal:**
   - Win-ACME automatically creates scheduled task for renewal

### **After SSL Installation:**
- Access site: `https://timewise.cmis.ac.in`
- HTTP automatically redirects to HTTPS

---

## 📞 Support

### **Common Commands:**

```powershell
# View website status
Get-Website | Format-Table Name, State, Bindings

# Restart IIS site
Restart-Website -Name "TimeWise"

# View PM2 apps
pm2 list

# Restart Next.js app
pm2 restart timewise

# View Next.js logs
pm2 logs timewise --lines 50

# Check if port 9002 is in use
netstat -ano | findstr :9002

# Test MongoDB connection
mongosh mongodb://localhost:27017/Timewise
```

---

## ✅ Success Checklist

- [ ] IIS installed and running
- [ ] URL Rewrite module installed
- [ ] ARR module installed and proxy enabled
- [ ] IIS website created (http://timewise.cmis.ac.in)
- [ ] Firewall rules configured (ports 80, 443)
- [ ] PM2 installed and configured
- [ ] Next.js running on port 9002 with PM2
- [ ] Can access http://timewise.cmis.ac.in (no port number!)
- [ ] Login page loads correctly
- [ ] API endpoints responding
- [ ] Database connection working

---

**Deployment Date:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Server:** Windows Server 2022
**Domain:** timewise.cmis.ac.in
**Backend Port:** 9002 (internal)
**Public Port:** 80 (HTTP) / 443 (HTTPS)
