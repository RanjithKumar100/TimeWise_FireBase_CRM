#!/usr/bin/env node

const http = require('http');
const os = require('os');

// Function to get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
}

const serverIP = getLocalIP();
const port = 9002;

console.log('🔍 Checking Firebase Timesheet Server Status...\n');

// Check if server is running
const options = {
  hostname: serverIP,
  port: port,
  path: '/',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log('✅ Server Status: RUNNING');
  console.log(`📍 Server Address: http://${serverIP}:${port}`);
  console.log(`🌐 Status Code: ${res.statusCode}`);
  console.log(`📊 Response Headers:`, res.headers);
  console.log('\n🎉 Server is accessible from the network!');
  console.log('\n📱 Users can access the application at:');
  console.log(`   👉 http://${serverIP}:${port}`);
});

req.on('error', (error) => {
  console.log('❌ Server Status: NOT RUNNING');
  console.log(`📍 Expected Address: http://${serverIP}:${port}`);
  console.log(`🔥 Error: ${error.message}`);
  console.log('\n🔧 Troubleshooting:');
  console.log('   1. Start the server: npm run start:prod');
  console.log('   2. Check if port 9002 is available');
  console.log('   3. Verify firewall settings');
  console.log(`   4. Test locally first: curl http://localhost:${port}`);
});

req.on('timeout', () => {
  console.log('⏰ Request timed out - server might be slow or not responding');
  req.destroy();
});

req.end();