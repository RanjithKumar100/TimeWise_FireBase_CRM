const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function debugResetIssue() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('TIMEWISE');
    
    // Get the latest reset token
    const resetToken = await db.collection('passwordresettokens').findOne({}, { sort: { createdAt: -1 } });
    console.log('🔑 Latest Reset Token:');
    console.log(`  User ID: ${resetToken?.userId}`);
    console.log(`  Email: ${resetToken?.userEmail}`);
    console.log(`  Used: ${resetToken?.used}`);
    console.log(`  Token: ${resetToken?.token.substring(0, 20)}...`);
    
    if (resetToken) {
      // Find user by the reset token's userId
      const userByTokenId = await db.collection('users').findOne({ userId: resetToken.userId });
      console.log('\n👤 User found by token userId:');
      if (userByTokenId) {
        console.log(`  Name: ${userByTokenId.name}`);
        console.log(`  Email: ${userByTokenId.email}`);
        console.log(`  User ID: ${userByTokenId.userId}`);
        console.log(`  Active: ${userByTokenId.isActive}`);
      } else {
        console.log('  User NOT FOUND by userId from token!');
      }
      
      // Find user by email
      const userByEmail = await db.collection('users').findOne({ 
        email: resetToken.userEmail.toLowerCase(),
        isActive: true 
      });
      console.log('\n📧 User found by email:');
      if (userByEmail) {
        console.log(`  Name: ${userByEmail.name}`);
        console.log(`  Email: ${userByEmail.email}`);
        console.log(`  User ID: ${userByEmail.userId}`);
        console.log(`  Active: ${userByEmail.isActive}`);
        
        // Check if IDs match
        if (userByTokenId && userByEmail.userId === userByTokenId.userId) {
          console.log('  ✅ User IDs match!');
        } else {
          console.log('  ❌ User IDs DO NOT match!');
          console.log(`    Token userId: ${resetToken.userId}`);
          console.log(`    Email user userId: ${userByEmail.userId}`);
        }
        
        // Test the password to see if it was actually updated
        try {
          const testPassword = 'testpass123';
          const isValid = await bcrypt.compare(testPassword, userByEmail.password);
          console.log(`  🔐 Password '${testPassword}' is valid: ${isValid}`);
        } catch (err) {
          console.log(`  ❌ Error testing password: ${err.message}`);
        }
      } else {
        console.log('  User NOT FOUND by email!');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

debugResetIssue();