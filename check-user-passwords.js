const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function checkUserPasswords() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to TIMEWISE database');
    
    const db = client.db('TIMEWISE');
    const usersCollection = db.collection('users');
    
    const users = await usersCollection.find({}).toArray();
    
    console.log('\n🔐 User Authentication Details:');
    console.log('=====================================');
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.name}`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`🏷️  Role: ${user.role}`);
      console.log(`🆔 UserID: ${user.userId || 'N/A'}`);
      console.log(`🟢 Active: ${user.isActive}`);
      console.log(`🔒 Has Password: ${user.password ? 'Yes' : 'No'}`);
      console.log(`🔒 Password Length: ${user.password ? user.password.length : 'N/A'}`);
      console.log(`🔒 Looks Hashed: ${user.password && user.password.startsWith('$') ? 'Yes' : 'No'}`);
      
      if (user.password) {
        // Test common passwords
        const commonPasswords = ['admin123', 'admin', 'password', '123456', user.name.toLowerCase(), user.email.split('@')[0]];
        
        for (const testPassword of commonPasswords) {
          try {
            if (user.password.startsWith('$')) {
              // It's bcrypt hashed
              const matches = await bcrypt.compare(testPassword, user.password);
              if (matches) {
                console.log(`🎯 PASSWORD FOUND: "${testPassword}"`);
                break;
              }
            } else {
              // Plain text comparison
              if (user.password === testPassword) {
                console.log(`🎯 PASSWORD (Plain): "${testPassword}"`);
                break;
              }
            }
          } catch (err) {
            // Skip on error
          }
        }
      }
      
      console.log('---');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkUserPasswords();