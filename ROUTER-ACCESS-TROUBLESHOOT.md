# Router Access Troubleshooting Guide

## Your router at 192.168.1.1 isn't responding on HTTP (port 80)

### Try These Alternative Access Methods:

## Method 1: HTTPS Access
Try accessing your router using HTTPS instead:
```
https://192.168.1.1
```

## Method 2: Alternative Ports
Some routers use different ports:
```
http://192.168.1.1:8080
http://192.168.1.1:80
http://192.168.1.1:8000
http://192.168.1.1:443
https://192.168.1.1:8443
```

## Method 3: Find Router Brand and Model
Look for a label on your physical router that shows:
- Brand (TP-Link, Netgear, D-Link, etc.)
- Model number
- Default IP address (might not be 192.168.1.1)

## Method 4: Check Network Settings
Run this to verify your gateway:
```cmd
ipconfig /all
```
Look for "Default Gateway" - this is your router's IP address.

## Method 5: Router Web Interface Alternatives

### If router web access is disabled:
Some routers have mobile apps:
- **TP-Link**: Tether app
- **Netgear**: Netgear Nighthawk app  
- **ASUS**: ASUS Router app
- **D-Link**: D-Link WiFi app
- **Linksys**: Linksys app

### Windows Router Configuration:
Some routers can be configured through Windows Network settings:
1. Go to **Settings** → **Network & Internet**
2. Click your network connection
3. Look for **Gateway** or **Router** settings

## Quick Test Commands:
```cmd
# Test basic connectivity
ping 192.168.1.1

# Check what ports are open on router
nmap -p 1-1000 192.168.1.1

# Alternative: Use PowerShell
powershell "1..1000 | ForEach-Object { $port = $_; if (Test-NetConnection -ComputerName 192.168.1.1 -Port $port -InformationLevel Quiet) { Write-Output 'Port $port is open' } }"
```

## What to Look for in Router Interface:

Once you access your router, look for these sections:
1. **Advanced Settings** or **Advanced**
2. **NAT** or **Network Address Translation**  
3. **Port Forwarding** or **Virtual Servers**
4. **Firewall** or **Security**
5. **Gaming** or **Applications**

## Exact Port Forward Settings:
- **Service Name**: TimeWise-CRM
- **Protocol**: TCP
- **External Port**: 9002
- **Internal IP**: 192.168.1.92
- **Internal Port**: 9002
- **Status**: Enabled

## Alternative Solution - UPnP
If port forwarding is too complex, try enabling UPnP:
1. In router settings, find **UPnP** option
2. **Enable UPnP**
3. Save and restart router
4. Your application may automatically create the port forward

## Last Resort - DMZ
If all else fails, enable DMZ (less secure):
1. Find **DMZ** or **DMZ Host** in router settings
2. Set DMZ IP to: **192.168.1.92**
3. Enable DMZ
4. Save settings

⚠️ **Warning**: DMZ exposes your entire computer to the internet!