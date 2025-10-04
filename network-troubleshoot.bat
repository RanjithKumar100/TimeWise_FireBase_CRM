@echo off
echo =================================
echo TimeWise Network Troubleshooting
echo =================================
echo.
echo Your IP: 192.168.1.92
echo Port: 9002
echo.

echo 1. Testing local access...
powershell "Test-NetConnection -ComputerName 192.168.1.92 -Port 9002"
echo.

echo 2. Checking if service is running...
netstat -ano | findstr :9002
echo.

echo 3. Checking firewall rules...
netsh advfirewall firewall show rule name="TimeWise-Port-9002"
echo.

echo 4. Testing from different network interface...
powershell "Test-NetConnection -ComputerName localhost -Port 9002"
echo.

echo =================================
echo Next Steps for Router Configuration:
echo =================================
echo 1. Access your router admin panel at: http://192.168.1.1
echo 2. Look for "Port Forwarding" or "Virtual Servers"
echo 3. Add rule: External Port 9002 -> Internal IP 192.168.1.92:9002
echo 4. Or enable "DMZ" for IP 192.168.1.92 (less secure but easier)
echo.
pause