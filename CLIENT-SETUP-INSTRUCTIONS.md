# 📱 Client Device Setup Instructions

## 🎯 Goal: Access TimeWise at `http://timewise:9002`

**Server**: `192.168.1.43:9002` → **Custom URL**: `http://timewise:9002`

---

## 🏠 Method 1: Router Setup (Recommended)

### ✅ Benefits: 
- ✨ One setup affects all devices
- 🔄 Automatic for new devices  
- 📱 Works on phones/tablets
- 💻 No individual device setup

### Steps:
1. **Access Router**: Go to `http://192.168.1.1` in browser
2. **Login**: Use admin credentials
3. **Find DNS Settings**: Look for "Local DNS" or "Host Names"
4. **Add Entry**: 
   - Hostname: `timewise`
   - IP: `192.168.1.43`
5. **Save & Restart**: Router may need restart
6. **Test**: Visit `http://timewise:9002`

---

## 💻 Method 2: Individual Device Setup

### Windows Devices

#### Quick Setup (Run as Admin):
1. **Download**: `setup-hostname.bat` from TimeWise server
2. **Right-click** → "Run as Administrator"
3. **Follow prompts**
4. **Test**: Visit `http://timewise:9002`

#### Manual Setup:
```cmd
# Open Command Prompt as Administrator
notepad C:\Windows\System32\drivers\etc\hosts

# Add this line at the end:
192.168.1.43    timewise

# Save and close
```

### Mac Devices
```bash
# Open Terminal
sudo nano /etc/hosts

# Add this line:
192.168.1.43    timewise

# Save (Ctrl+X, Y, Enter)
sudo dscacheutil -flushcache
```

### Linux Devices
```bash
# Open Terminal
sudo nano /etc/hosts

# Add this line:
192.168.1.43    timewise

# Save and restart DNS
sudo systemctl restart systemd-resolved
```

### Android Devices
**Option 1**: Root + Hosts Editor app
**Option 2**: Use router method (recommended)
**Option 3**: Keep using IP `http://192.168.1.43:9002`

### iPhone/iPad
**Option 1**: Use router method (recommended)  
**Option 2**: DNS override apps (advanced)
**Option 3**: Keep using IP `http://192.168.1.43:9002`

---

## 🧪 Testing Your Setup

### 1. Test DNS Resolution
```cmd
# Windows/Mac/Linux
ping timewise

# Should show: 192.168.1.43
```

### 2. Test TimeWise Access
Open browser: `http://timewise:9002`

### 3. Bookmark the URL
Save `http://timewise:9002` as bookmark

---

## 🆘 Troubleshooting

### "Can't resolve timewise"
- ❌ Hostname not set up properly
- ✅ Use router method OR individual setup
- ✅ Check hosts file entry
- ✅ Restart device

### "Site can't be reached"
- ❌ TimeWise server may be down
- ✅ Check `http://192.168.1.43:9002` directly
- ✅ Contact server administrator

### "Mixed content warnings"
- ❌ Browser security (HTTP not HTTPS)
- ✅ Normal for internal servers
- ✅ Click "Advanced" → "Proceed"

### Mobile devices not working
- ✅ Use router method instead
- ✅ Or keep using IP address

---

## 📞 Support

### For Users:
- **Primary URL**: `http://timewise:9002`
- **Backup URL**: `http://192.168.1.43:9002`
- **Admin Contact**: [Your IT contact]

### For IT Setup:
- **Server IP**: `192.168.1.43`
- **Port**: `9002`
- **Database**: MongoDB on TIMEWISE
- **Service**: TimeWise Timesheet System

---

## 🎉 Success Indicators

✅ **DNS Works**: `ping timewise` responds from `192.168.1.43`  
✅ **Site Loads**: `http://timewise:9002` shows login page  
✅ **Login Works**: Can access dashboard  
✅ **All Features**: Can create/edit timesheets  

**Ready to use TimeWise with the friendly hostname!** 🚀