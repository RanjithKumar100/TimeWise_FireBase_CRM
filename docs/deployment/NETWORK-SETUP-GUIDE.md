# 🌐 TimeWise Network Setup Guide

## 🚨 CRITICAL ISSUE IDENTIFIED
**The TimeWise server is NOT currently running on port 9002!**

Your configuration is correct, but the server process is not active.

---

## ✅ STEP-BY-STEP SOLUTION

### **Step 1: Setup Firewall (Run as Administrator)**
```batch
# Right-click and "Run as Administrator"
setup-firewall-admin.bat
```

### **Step 2: Start the Server**
```batch
# Run this in your TimeWise directory
start-timewise-server.bat
```

### **Step 3: Verify Server is Running**
After starting, you should see output like:
```
▲ Next.js 15.3.3
- Local:        http://localhost:9002
- Network:      http://0.0.0.0:9002
✓ Ready in 2.3s
```

### **Step 4: Test Connectivity**

#### Local Test:
```
http://localhost:9002
```

#### Network Test (from your IP):
```
http://192.168.1.92:9002
```

#### From Another Computer:
```
http://192.168.1.92:9002
```

---

## 🛠️ TROUBLESHOOTING

### Problem: Port 9002 Not Listening
**Solution:**
1. Kill all Node processes: `taskkill /f /im node.exe`
2. Restart server: `npm run dev`
3. Verify with: `netstat -ano | findstr :9002`

### Problem: Still Can't Connect from Other Computers
**Solutions:**

#### Option A: Windows Defender Firewall
```batch
# Run as Administrator
netsh advfirewall firewall add rule name="TimeWise-Port-9002" dir=in action=allow protocol=TCP localport=9002
```

#### Option B: Disable Windows Firewall (Temporary)
```batch
# Run as Administrator - FOR TESTING ONLY
netsh advfirewall set allprofiles state off
# Re-enable after testing:
netsh advfirewall set allprofiles state on
```

#### Option C: Router Port Forwarding
1. Access router admin: `http://192.168.1.1`
2. Find "Port Forwarding" or "Virtual Server"
3. Add rule: `External Port 9002 -> Internal IP 192.168.1.92:9002`

#### Option D: DMZ (Easy but Less Secure)
1. Access router admin: `http://192.168.1.1`
2. Find "DMZ" settings
3. Set DMZ host to: `192.168.1.92`

---

## 🔍 DIAGNOSTIC COMMANDS

### Check if Server is Running:
```batch
netstat -ano | findstr :9002
```
**Expected Output:** Should show LISTENING on 0.0.0.0:9002

### Test Local Connectivity:
```batch
powershell -Command "Test-NetConnection -ComputerName localhost -Port 9002"
```
**Expected:** TcpTestSucceeded: True

### Test Network Connectivity:
```batch
powershell -Command "Test-NetConnection -ComputerName 192.168.1.92 -Port 9002"
```
**Expected:** TcpTestSucceeded: True

---

## 📋 QUICK CHECKLIST

- [ ] Server is running (`npm run dev` executed)
- [ ] Port 9002 is listening (`netstat -ano | findstr :9002`)
- [ ] Windows Firewall rules added (run `setup-firewall-admin.bat`)
- [ ] Local access works (`http://localhost:9002`)
- [ ] Network access works (`http://192.168.1.92:9002`)
- [ ] Router allows internal network traffic
- [ ] Other computers can ping your IP (`ping 192.168.1.92`)

---

## 🆘 IF STILL NOT WORKING

### Manual Server Start:
```batch
cd "C:\Users\TRG\Documents\LOF-CS\TimeWise_FireBase_CRM"
npm run dev
```

### Alternative Port Test:
```batch
# Try port 3000 instead
npm run dev -- -p 3000
# Then access: http://192.168.1.92:3000
```

### Network Interface Check:
```batch
ipconfig /all
# Ensure you're using the correct IP address
```

---

## ✨ SUCCESS INDICATORS

When everything is working correctly:

1. **Console Output:**
   ```
   ▲ Next.js 15.3.3
   - Local:        http://localhost:9002
   - Network:      http://0.0.0.0:9002
   ✓ Ready in 2.3s
   ```

2. **Netstat Output:**
   ```
   TCP    0.0.0.0:9002           0.0.0.0:0              LISTENING       12345
   ```

3. **Network Access:**
   - ✅ `http://localhost:9002` - Works locally
   - ✅ `http://192.168.1.92:9002` - Works from same computer
   - ✅ `http://192.168.1.92:9002` - Works from other computers

---

**Your IP Address:** `192.168.1.92`  
**TimeWise Port:** `9002`  
**Server URL:** `http://192.168.1.92:9002`