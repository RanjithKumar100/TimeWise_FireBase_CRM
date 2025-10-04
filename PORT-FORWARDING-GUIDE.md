# Complete Router Port Forwarding Guide for TimeWise

## Step-by-Step Router Port Forwarding Process

### Step 1: Access Your Router's Admin Panel

1. **Open your web browser** (Chrome, Firefox, Edge, etc.)
2. **Type the router IP address** in the address bar: `http://192.168.1.1`
3. **Press Enter**

### Step 2: Login to Router Admin Panel

**Common Default Credentials** (try these first):
- Username: `admin` | Password: `admin`
- Username: `admin` | Password: `password`
- Username: `admin` | Password: `1234`
- Username: `admin` | Password: (blank/empty)
- Username: (blank) | Password: `admin`

**If defaults don't work:**
- Check router label/sticker on the device itself
- Look for credentials printed on router bottom/back
- Try manufacturer defaults (see brand-specific section below)

### Step 3: Navigate to Port Forwarding Section

**Look for these menu items** (names vary by router brand):
- "Port Forwarding"
- "Virtual Servers"
- "NAT Forwarding"
- "Application & Gaming"
- "Advanced" → "Port Forwarding"
- "NAT/Gaming" → "Port Forwarding"
- "Firewall" → "Port Forwarding"

### Step 4: Create Port Forwarding Rule

**Fill in these details exactly:**

| Field Name | Value | Alternative Names |
|------------|-------|-------------------|
| **Service Name** | `TimeWise-CRM` | Rule Name, Application Name |
| **Protocol** | `TCP` | Type, Protocol Type |
| **External Port Start** | `9002` | WAN Port, Outside Port, Start Port |
| **External Port End** | `9002` | WAN Port End, Outside Port End, End Port |
| **Internal IP** | `192.168.1.92` | LAN IP, Private IP, Server IP |
| **Internal Port Start** | `9002` | LAN Port, Private Port, Local Port |
| **Internal Port End** | `9002` | LAN Port End, Private Port End |
| **Status** | `Enabled` | Enable, Active |

### Step 5: Save and Apply Settings

1. **Click "Save"** or "Apply" button
2. **Wait for router to restart** (may take 1-2 minutes)
3. **Some routers require a reboot** - look for "Reboot" or "Restart" button

---

## Brand-Specific Instructions

### TP-Link Routers
1. Login → **Advanced** → **NAT Forwarding** → **Virtual Servers**
2. Click **Add** button
3. Fill details and click **Save**

### Netgear Routers
1. Login → **Dynamic DNS** → **Port Forwarding/Port Triggering**
2. Select **Port Forwarding**
3. Click **Add Custom Service**

### D-Link Routers
1. Login → **Advanced** → **Port Forwarding**
2. Click **Add** button
3. Select **TCP** protocol

### Linksys Routers
1. Login → **Smart Wi-Fi Tools** → **Port Forwarding**
2. Click **Add New Rule**
3. Fill in port details

### ASUS Routers
1. Login → **Adaptive QoS** → **Traditional QoS** → **Port Forwarding**
2. Enable **Port Forwarding**
3. Add new rule

### Huawei Routers
1. Login → **Advanced** → **NAT Forwarding** → **Port Mapping**
2. Click **New** button
3. Configure port mapping

---

## Testing Your Port Forward

### Method 1: Online Port Checker
1. Visit: https://www.portchecktool.com/
2. Enter your **public IP address**
3. Enter port: **9002**
4. Click **Check Port**

### Method 2: Find Your Public IP
```bash
# Run this command to get your public IP:
powershell "Invoke-WebRequest -Uri 'https://api.ipify.org' -UseBasicParsing | Select-Object -ExpandProperty Content"
```

### Method 3: Test from External Network
From another network (mobile hotspot, friend's house):
- Browse to: `http://YOUR_PUBLIC_IP:9002`
- Should show TimeWise login page

---

## Common Issues and Solutions

### Issue 1: Can't Access Router (192.168.1.1)
**Solution:**
```bash
# Check your gateway:
ipconfig
# Look for "Default Gateway" - use that IP instead of 192.168.1.1
```

### Issue 2: Forgot Router Password
**Solutions:**
1. **Factory Reset**: Hold reset button for 10-30 seconds while powered on
2. **WPS Reset**: Some routers reset via WPS button
3. **Check router label** for default credentials

### Issue 3: Port Forward Not Working
**Troubleshooting:**
1. **Disable UPnP** in router settings (can conflict)
2. **Check firewall settings** in router
3. **Reboot router** after making changes
4. **Try different external port** (8080, 3000, 8000)
5. **Enable DMZ** for your IP (less secure but works)

### Issue 4: ISP Blocks Ports
**Solutions:**
1. **Use common ports**: 80, 443, 8080, 3000
2. **Contact ISP** to unblock ports
3. **Use CloudFlare Tunnel** (advanced solution)

---

## Alternative Solutions

### Option 1: Use Different Port
```bash
# Change to port 8080 (commonly allowed):
npm run dev -- -p 8080 -H 0.0.0.0

# Update firewall rule:
netsh advfirewall firewall add rule name="TimeWise-8080" dir=in action=allow protocol=TCP localport=8080
```

### Option 2: Enable DMZ (Easier but less secure)
1. **Router Settings** → **DMZ** or **DMZ Host**
2. **Enable DMZ** for IP: `192.168.1.92`
3. **Save settings**

⚠️ **Warning**: DMZ exposes your computer to the internet - less secure!

### Option 3: Use ngrok (Temporary Solution)
```bash
# Install ngrok and create tunnel:
npx ngrok http 9002
# Gives you public URL like: https://abc123.ngrok.io
```

---

## Security Recommendations

1. **Change default router password** after setup
2. **Only forward necessary ports**
3. **Use HTTPS** when possible
4. **Monitor access logs**
5. **Consider VPN** for secure access
6. **Update router firmware** regularly

---

## Final Verification Checklist

- [ ] Router admin panel accessible
- [ ] Port forwarding rule created with correct values
- [ ] Router settings saved and applied
- [ ] Router rebooted if necessary
- [ ] Windows firewall allows port 9002
- [ ] TimeWise app running on port 9002
- [ ] Public IP address obtained
- [ ] External port test successful
- [ ] Application accessible from external network

## Need Help?

If you're still having issues:

1. **Run the diagnostic script:**
   ```bash
   network-troubleshoot.bat
   ```

2. **Check your router model and search for:**
   `"[YOUR ROUTER MODEL] port forwarding guide"`

3. **Take screenshots** of your router's port forwarding page and settings

Your TimeWise application should now be accessible from external networks using:
`http://YOUR_PUBLIC_IP:9002`