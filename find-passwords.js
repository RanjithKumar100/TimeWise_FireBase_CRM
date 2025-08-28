const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function findPasswords() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('TIMEWISE');
    const users = await db.collection('users').find({}).toArray();
    
    console.log('🔓 Working Login Credentials:\n');
    
    const commonPasswords = ['admin123', 'user123', 'password', '123456', 'test123'];
    
    for (const user of users) {
      if (user.password) {
        for (const pwd of commonPasswords) {
          try {
            const isValid = await bcrypt.compare(pwd, user.password);
            if (isValid) {
              console.log(`✅ Username: ${user.email || user.name}`);
              console.log(`   Password: ${pwd}`);
              console.log(`   Role: ${user.role}`);
              console.log(`   Name: ${user.name}\n`);
              break;
            }
          } catch (err) {
            // Skip
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

findPasswords();