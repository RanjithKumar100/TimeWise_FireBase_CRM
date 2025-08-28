const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function debugLogin() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to TIMEWISE database');
    
    const db = client.db('TIMEWISE');
    const users = await db.collection('users').find({}).toArray();
    
    console.log('\n🔍 User Authentication Debug:');
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Password Hash: ${user.password ? user.password.substring(0, 20) + '...' : 'NO PASSWORD'}`);
      
      // Try to verify with common passwords
      const commonPasswords = ['admin123', 'user123', 'password', '123456', user.name.toLowerCase()];
      
      if (user.password) {
        for (const pwd of commonPasswords) {
          try {
            const isValid = await bcrypt.compare(pwd, user.password);
            if (isValid) {
              console.log(`   ✅ FOUND PASSWORD: "${pwd}"`);
              break;
            }
          } catch (err) {
            console.log(`   ❌ Error checking password "${pwd}": ${err.message}`);
          }
        }
      }
    }
    
    // Test the actual login flow
    console.log('\n🧪 Testing Login API Logic:');
    
    // Find admin user
    const adminUser = users.find(u => u.email === 'admin@timewise.com');
    if (adminUser) {
      console.log('\n📋 Admin User Details:');
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Name: ${adminUser.name}`);
      
      // Test email lookup
      const emailLookup = await db.collection('users').findOne({
        $and: [
          { isActive: true },
          {
            $or: [
              { email: 'admin@timewise.com'.toLowerCase() },
              { name: { $regex: new RegExp(`^admin@timewise.com$`, 'i') } },
            ],
          },
        ],
      });
      
      console.log('   Email lookup result:', emailLookup ? 'FOUND' : 'NOT FOUND');
      
      // Test name lookup
      const nameLookup = await db.collection('users').findOne({
        $and: [
          { isActive: true },
          {
            $or: [
              { email: 'Administrator'.toLowerCase() },
              { name: { $regex: new RegExp(`^Administrator$`, 'i') } },
            ],
          },
        ],
      });
      
      console.log('   Name lookup result:', nameLookup ? 'FOUND' : 'NOT FOUND');
      
      if (nameLookup) {
        console.log('   Found user by name:', nameLookup.name, nameLookup.email);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

debugLogin();