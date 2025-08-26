const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkExistingUsers() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to TIMEWISE database');
    
    const db = client.db('TIMEWISE');
    
    // Check all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📊 Collections in TIMEWISE database:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Check for users in different possible collection names
    const possibleUserCollections = ['users', 'Users', 'User', 'user'];
    
    for (const collectionName of possibleUserCollections) {
      try {
        const collection = db.collection(collectionName);
        const users = await collection.find({}).toArray();
        
        if (users.length > 0) {
          console.log(`\n👥 Found ${users.length} users in '${collectionName}' collection:`);
          users.forEach(user => {
            console.log(`  - Name: ${user.name || user.username || 'N/A'}`);
            console.log(`    Email: ${user.email || 'N/A'}`);
            console.log(`    Role: ${user.role || 'N/A'}`);
            console.log(`    ID: ${user._id || user.userId || user.id || 'N/A'}`);
            console.log(`    Active: ${user.isActive !== undefined ? user.isActive : 'N/A'}`);
            console.log('    ---');
          });
        }
      } catch (err) {
        // Collection doesn't exist, skip silently
      }
    }
    
    // Check for work logs
    const possibleWorkCollections = ['worklogs', 'workLogs', 'WorkLogs', 'timesheet', 'timesheets'];
    
    for (const collectionName of possibleWorkCollections) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        
        if (count > 0) {
          console.log(`\n📋 Found ${count} work entries in '${collectionName}' collection`);
          
          // Show a sample entry
          const sample = await collection.findOne();
          if (sample) {
            console.log('Sample entry structure:');
            console.log(JSON.stringify(sample, null, 2));
          }
        }
      } catch (err) {
        // Collection doesn't exist, skip silently
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkExistingUsers();