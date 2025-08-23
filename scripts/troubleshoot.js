#!/usr/bin/env node

const os = require('os');
const { exec } = require('child_process');
const http = require('http');

console.log('🔧 Firebase Timesheet Troubleshooting Tool\n');

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

// Function to check if port is available
function checkPort(host, port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    
    server.listen(port, host, () => {
      server.close(() => {
        resolve(false); // Port is available
      });
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true); // Port is in use (good)
      } else {
        reject(err);
      }
    });
  });
}

// Function to test HTTP connection
function testConnection(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data.slice(0, 200) + '...'
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function runDiagnostics() {
  const serverIP = getLocalIP();
  const port = 9002;
  
  console.log('📍 System Information:');
  console.log(`   - Server IP: ${serverIP}`);
  console.log(`   - Target Port: ${port}`);
  console.log(`   - Platform: ${os.platform()}`);
  console.log(`   - Node Version: ${process.version}\n`);
  
  console.log('🔍 Port Status:');
  try {
    const portInUse = await checkPort('0.0.0.0', port);
    if (portInUse) {
      console.log(`   ✅ Port ${port} is in use (server likely running)`);
    } else {
      console.log(`   ❌ Port ${port} is available (server not running)`);
    }
  } catch (error) {
    console.log(`   ⚠️ Could not check port: ${error.message}`);
  }
  
  console.log('\n🌐 Connection Tests:');
  
  // Test localhost
  try {
    console.log('   Testing localhost...');
    const result = await testConnection(`http://localhost:${port}`);
    console.log(`   ✅ Localhost: Status ${result.statusCode}`);
  } catch (error) {
    console.log(`   ❌ Localhost: ${error.message}`);
  }
  
  // Test server IP
  if (serverIP !== 'localhost') {
    try {
      console.log(`   Testing ${serverIP}...`);
      const result = await testConnection(`http://${serverIP}:${port}`);
      console.log(`   ✅ Network IP: Status ${result.statusCode}`);
    } catch (error) {
      console.log(`   ❌ Network IP: ${error.message}`);
    }
  }
  
  console.log('\n📋 MongoDB Status:');
  exec('mongo --eval "db.stats()" TIMEWISE', (error, stdout, stderr) => {
    if (error) {
      console.log('   ❌ MongoDB connection failed');
      console.log('   💡 Make sure MongoDB is running');
    } else {
      console.log('   ✅ MongoDB is accessible');
    }
    
    console.log('\n🔧 Recommendations:');
    console.log('   1. Ensure MongoDB is running');
    console.log('   2. Start the server: npm run start:prod');
    console.log('   3. Check Windows Firewall for port 9002');
    console.log('   4. Verify all devices are on the same network');
    console.log(`   5. Access the app at: http://${serverIP}:${port}`);
  });
}

runDiagnostics().catch(console.error);