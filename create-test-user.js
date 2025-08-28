const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.production.local' });

async function createTestUser() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to TIMEWISE database');
    
    const db = client.db('TIMEWISE');
    const usersCollection = db.collection('users');
    
    // Hash password
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create test admin user
    const testUser = {
      userId: new Date().getTime().toString(),
      name: 'Test Admin',
      email: 'testadmin@timewise.com',
      password: hashedPassword,
      role: 'Admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: testUser.email });
    
    if (existingUser) {
      console.log('🔄 Updating existing test user password...');
      await usersCollection.updateOne(
        { email: testUser.email },
        { $set: { password: hashedPassword, updatedAt: new Date() } }
      );
      console.log('✅ Test user password updated!');
    } else {
      console.log('👤 Creating new test user...');
      await usersCollection.insertOne(testUser);
      console.log('✅ Test user created!');
    }
    
    console.log('\n🔐 Test Login Credentials:');
    console.log(`📧 Email/Username: ${testUser.email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🏷️  Role: ${testUser.role}`);
    
    console.log('\n🧪 Testing login...');
    const loginUser = await usersCollection.findOne({ email: testUser.email });
    const isValidPassword = await bcrypt.compare(password, loginUser.password);
    console.log(`🎯 Password verification: ${isValidPassword ? '✅ SUCCESS' : '❌ FAILED'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

createTestUser();