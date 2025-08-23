#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🚀 Firebase Timesheet Server Setup\n');

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

// Get server IP
const serverIP = getLocalIP();
console.log(`📍 Detected server IP: ${serverIP}`);

// Read and update .env.production.local
const envProdPath = path.join(__dirname, '..', '.env.production.local');
let envContent = fs.readFileSync(envProdPath, 'utf8');

// Update the API URL with the detected IP
envContent = envContent.replace(
  'NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:9002',
  `NEXT_PUBLIC_API_URL=http://${serverIP}:9002`
);

// Write back to file
fs.writeFileSync(envProdPath, envContent);

console.log('✅ Updated .env.production.local with server IP');
console.log('📝 Configuration Summary:');
console.log(`   - Server will run on: http://${serverIP}:9002`);
console.log(`   - Users can access from: http://${serverIP}:9002`);
console.log('   - Port: 9002');
console.log('   - Host: 0.0.0.0 (accepts connections from any IP)\n');

console.log('🔧 Next Steps:');
console.log('1. Make sure MongoDB is running');
console.log('2. Update JWT_SECRET in .env.production.local for security');
console.log('3. Configure your MongoDB connection in .env.production.local');
console.log('4. Run: npm run build');
console.log('5. Run: npm run start:prod');
console.log('\n🔥 Your timesheet app will be accessible from any device on the network!');