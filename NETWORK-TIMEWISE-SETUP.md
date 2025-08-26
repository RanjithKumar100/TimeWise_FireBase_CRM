# 🌐 Network-Wide TimeWise Hostname Setup

## 🎯 Goal: Make `http://timewise:9002` work for everyone

**Server IP**: `192.168.1.43:9002` → **Easy URL**: `http://timewise:9002`

---

## 🏠 METHOD 1: Router DNS Setup (BEST - ONE SETUP FOR ALL)

### ✅ Why This is Best:
- ✨ **Setup once** → Works for all devices
- 📱 **Automatic** for phones/tablets  
- 🆕 **New devices** work immediately
- 🔄 **No maintenance** needed

### Steps:
1. **Access Your Router**
   - Open browser: `http://192.168.1.1`
   - Login with admin credentials

2. **Find DNS Settings** (Look for one of these):
   - "Local DNS"
   - "DNS Management"
   - "Host Names"  
   - "Static DNS Entries"
   - "DHCP Reservations"
   - "Custom Hostnames"

3. **Add Hostname Entry**
   - **Hostname**: `timewise`
   - **IP Address**: `192.168.1.43`
   - **Save Settings**

4. **Restart Router**
   - Some routers need restart
   - Wait 2-3 minutes

5. **Test on Any Device**
   - `ping timewise` (should respond from 192.168.1.43)
   - Visit `http://timewise:9002`

---

## 💻 METHOD 2: Individual Device Setup

### For Windows PCs

#### Quick Setup:
1. **Download & Run**: `setup-server-hostname.bat`
2. **Right-click** → "Run as Administrator"  
3. **Follow prompts**

#### Manual Setup:
```cmd
# Run Command Prompt as Administrator
notepad C:\Windows\System32\drivers\etc\hosts

# Add this line at the end:
192.168.1.43    timewise

# Save and close
ipconfig /flushdns
```

### For Mac Computers
```bash
# Open Terminal
sudo nano /etc/hosts

# Add this line:
192.168.1.43    timewise

# Save (Ctrl+X, Y, Enter)
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

### For Linux Computers
```bash
# Open Terminal  
sudo nano /etc/hosts

# Add this line:
192.168.1.43    timewise

# Save and restart DNS
sudo systemctl restart systemd-resolved
# OR
sudo service network-manager restart
```

### For Android Phones/Tablets

#### Option 1: Use Router Method (Recommended)
#### Option 2: Root + Hosts Editor App
1. Install "Hosts Editor" app
2. Add: `192.168.1.43 timewise`

#### Option 3: DNS Override Apps
- Use apps like "1.1.1.1" with custom DNS

### For iPhones/iPads

#### Option 1: Use Router Method (Recommended)
#### Option 2: DNS Override
- iOS Settings → WiFi → Configure DNS → Manual
- Add custom DNS that includes your hostname

#### Option 3: Keep Using IP
- Bookmark: `http://192.168.1.43:9002`

---

## 🔧 NETWORK ADMINISTRATOR SETUP

### Router Configuration Examples:

#### Linksys Routers:
1. Advanced → Network Administration
2. Local Access → Host Name

#### Netgear Routers:
1. Advanced → Dynamic DNS
2. Or Advanced → LAN Setup → Address Reservation

#### TP-Link Routers:  
1. Advanced → Network → DHCP Server
2. Address Reservation

#### ASUS Routers:
1. Adaptive QoS → Game Mode
2. Or LAN → DHCP Server

#### D-Link Routers:
1. Setup → Network Settings
2. DHCP Reservation

---

## 🧪 TESTING INSTRUCTIONS

### 1. Test DNS Resolution
```cmd
# Windows/Mac/Linux
ping timewise

# Expected response:
# PING timewise (192.168.1.43): 56 data bytes
# 64 bytes from 192.168.1.43: icmp_seq=0 ttl=64 time=1.234 ms
```

### 2. Test TimeWise Access
- Open browser: `http://timewise:9002`
- Should show TimeWise login page
- Login with your credentials

### 3. Test from Different Devices
- Computer: `http://timewise:9002`
- Phone: `http://timewise:9002`  
- Tablet: `http://timewise:9002`

---

## 📋 DISTRIBUTION CHECKLIST

### For IT/Admin:
- [ ] Choose setup method (Router DNS recommended)
- [ ] Configure router OR prepare individual setup
- [ ] Test from admin workstation
- [ ] Create user instructions
- [ ] Distribute setup to team

### For End Users:
- [ ] Follow setup instructions for your device type
- [ ] Test hostname resolution: `ping timewise`
- [ ] Access TimeWise: `http://timewise:9002`
- [ ] Bookmark the new URL
- [ ] Update any shortcuts/favorites

---

## 🆘 TROUBLESHOOTING

### "Can't resolve timewise"
- ❌ DNS not set up properly
- ✅ Check router DNS settings
- ✅ Or follow individual device setup
- ✅ Flush DNS cache: `ipconfig /flushdns`

### "Site can't be reached"  
- ❌ Server may be down
- ✅ Try direct IP: `http://192.168.1.43:9002`
- ✅ Contact server administrator

### Works on some devices, not others
- ❌ Mixed setup (some configured, some not)
- ✅ Use router method for consistent setup
- ✅ Or configure missing devices individually

### Router method not working
- ❌ Router may not support custom hostnames
- ✅ Use individual device setup method
- ✅ Or upgrade router firmware

---

## 📞 QUICK REFERENCE

### URLs:
- **Primary**: `http://timewise:9002`
- **Backup**: `http://192.168.1.43:9002`

### Test Commands:
- **DNS**: `ping timewise`
- **Web**: Open `http://timewise:9002`

### Admin Info:
- **Server**: Windows PC at 192.168.1.43
- **Database**: MongoDB TIMEWISE
- **Users**: 14 active accounts

---

## 🎉 SUCCESS INDICATORS

✅ `ping timewise` responds from 192.168.1.43  
✅ `http://timewise:9002` loads login page  
✅ Login works with existing credentials  
✅ All features functional (timesheets, admin, etc.)  
✅ Works from all network devices  

**Everyone can now access TimeWise easily at `http://timewise:9002`!** 🚀