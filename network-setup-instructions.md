# 🌐 Network Access Setup for TIMEWISE

## ✅ **Configuration Complete:**
- **Server IP**: `192.168.1.43`
- **Port**: `9002`
- **Application URL**: `http://192.168.1.43:9002`
- **API URL**: `http://192.168.1.43:9002`

## 🔧 **What Was Fixed:**
1. ✅ Updated `NEXT_PUBLIC_API_URL` to use network IP instead of localhost
2. ✅ Updated `NEXT_PUBLIC_APP_URL` for email links
3. ✅ Rebuilt application with network configuration
4. ✅ Server is running on `0.0.0.0:9002` (accepts all network connections)

## 🚪 **Firewall Setup Required:**

### **Option 1: Run as Administrator (Recommended)**
Right-click Command Prompt → "Run as Administrator", then run:
```bash
netsh advfirewall firewall add rule name="TIMEWISE App Port 9002" dir=in action=allow protocol=TCP localport=9002
```

### **Option 2: Windows Firewall GUI**
1. Open Windows Security → Firewall & network protection
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" → Enter "9002" → Next
6. Select "Allow the connection" → Next
7. Select all profiles → Next
8. Name: "TIMEWISE App Port 9002" → Finish

## 🧪 **Test Network Access:**

### **From Same Machine:**
- ✅ `http://localhost:9002` (works)
- ✅ `http://192.168.1.43:9002` (works)

### **From Other Devices:**
- 📱 **Mobile/Tablet**: `http://192.168.1.43:9002`
- 💻 **Other Computers**: `http://192.168.1.43:9002`

## 🔑 **Login Credentials:**
- **Username**: `admin@timewise.com`
- **Password**: `Admin123!`

## 🐛 **Troubleshooting:**

### **If Remote Access Still Fails:**
1. **Check Windows Firewall** (see above)
2. **Check Router/Network**:
   - Ensure devices are on same network (192.168.1.x)
   - Some routers block inter-device communication
3. **Test with Command**:
   ```bash
   ping 192.168.1.43
   telnet 192.168.1.43 9002
   ```

### **Alternative IP (if needed):**
Run `ipconfig` to verify current IP:
```bash
ipconfig | findstr "IPv4"
```

## 🎯 **Current Status:**
- ✅ Server running on network IP
- ✅ Application configured for network access
- ⚠️  Firewall rule needs administrator privileges
- ✅ Ready for remote device testing

## 📱 **Next Steps:**
1. **Configure firewall** (run as administrator)
2. **Test from remote device**: `http://192.168.1.43:9002`
3. **Login with admin credentials**
4. **Enjoy network access!** 🚀