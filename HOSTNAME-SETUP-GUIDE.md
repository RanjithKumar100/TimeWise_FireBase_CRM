# 🌐 Custom Hostname Setup for TimeWise Server

**Server IP**: `192.168.1.43:9002`  
**Desired Hostname**: `http://timewise:9002`

## 🎯 Two Setup Methods

### Method 1: Router DNS Setup (Recommended)
*One-time setup, works for all devices automatically*

### Method 2: Individual Device Setup  
*Manual setup needed on each device*

---

## 🏠 Method 1: Router DNS Setup (Best Option)

### Step 1: Access Your Router
1. Open browser and go to: `http://192.168.1.1`
2. Login with admin credentials

### Step 2: Find DNS/Local DNS Settings
Look for one of these sections:
- **Local DNS**
- **DNS Management** 
- **Host Names**
- **Static DNS**
- **DHCP Reservations**

### Step 3: Add DNS Entry
Add this mapping:
- **Hostname**: `timewise`
- **IP Address**: `192.168.1.43`

### Step 4: Save and Restart Router
- Save settings
- Restart router if required
- Wait 2-3 minutes for changes

### ✅ Result
All devices on network can access: `http://timewise:9002`

---

## 💻 Method 2: Individual Device Setup

### For Windows Devices

#### Step 1: Open Hosts File
```cmd
# Run as Administrator
notepad C:\Windows\System32\drivers\etc\hosts
```

#### Step 2: Add Entry
Add this line at the end:
```
192.168.1.43    timewise
```

#### Step 3: Save and Test

### For Mac/Linux Devices

#### Step 1: Edit Hosts File
```bash
sudo nano /etc/hosts
```

#### Step 2: Add Entry
```
192.168.1.43    timewise
```

#### Step 3: Save and Flush DNS
```bash
# Mac
sudo dscacheutil -flushcache

# Linux
sudo systemctl restart systemd-resolved
```

### For Mobile Devices

#### Android:
1. Root required OR use apps like "Hosts Editor"
2. Edit `/system/etc/hosts`
3. Add: `192.168.1.43 timewise`

#### iPhone:
1. Requires jailbreak OR use DNS override apps
2. Or use router method (recommended)

---

## 🔧 Application Configuration Update

Update TimeWise app to use hostname:

### File: `.env.local`
```env
# Change this line:
NEXT_PUBLIC_APP_URL=http://timewise:9002

# Optional: Set API URL
NEXT_PUBLIC_API_URL=http://timewise:9002
```

### File: `next.config.ts`
Add allowed origins:
```typescript
const nextConfig: NextConfig = {
  // ... existing config
  
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          // ... other headers
        ],
      },
    ];
  },
  
  // Add this for development
  experimental: {
    allowedDevOrigins: ['timewise:9002'],
  },
};
```

---

## 🧪 Testing Steps

### 1. Test DNS Resolution
```cmd
# Windows
ping timewise

# Should respond from 192.168.1.43
```

### 2. Test TimeWise Access
Open browser: `http://timewise:9002`

### 3. Verify All Features
- Login functionality
- Admin dashboard  
- User dashboard
- Email notifications

---

## 🎉 Benefits of Custom Hostname

✅ **User-Friendly**: Easy to remember  
✅ **Professional**: No IP addresses  
✅ **Consistent**: Same URL for everyone  
✅ **Future-Proof**: IP changes don't matter  
✅ **Branding**: Custom company name  

---

## 🆘 Troubleshooting

### DNS Not Working
1. Clear browser cache
2. Flush DNS cache
3. Restart devices
4. Check router settings

### Still Using IP
1. Update browser bookmarks
2. Clear browser history
3. Update .env.local file
4. Restart TimeWise server

### Mobile Issues
- Use router method
- Or provide direct IP as backup

---

## 🚀 Quick Start Commands

```bash
# Test hostname resolution
ping timewise

# Access TimeWise
http://timewise:9002

# Admin login
Username: Administrator
Password: [your password]
```

**Recommended**: Start with **Method 1 (Router DNS)** for easiest network-wide setup!