const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function createEasyLoginUsers() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to TIMEWISE database');
    
    const db = client.db('TIMEWISE');
    const usersCollection = db.collection('users');
    
    // Users with simple passwords for easy login
    const easyUsers = [
      {
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'admin',
        role: 'Admin'
      },
      {
        name: 'Test User',
        email: 'user@test.com', 
        password: 'user',
        role: 'User'
      },
      {
        name: 'Simple Admin',
        email: 'admin',
        password: 'admin',
        role: 'Admin'
      }
    ];
    
    console.log('🔧 Creating easy login users...\n');
    
    for (const userData of easyUsers) {
      // Check if user already exists
      const existingUser = await usersCollection.findOne({
        $or: [
          { email: userData.email },
          { name: userData.name }
        ]
      });
      
      if (existingUser) {
        console.log(`⚠️  User already exists: ${userData.name} (${userData.email})`);
        continue;
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Create user object
      const newUser = {
        userId: new Date().getTime().toString(),
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Insert user
      await usersCollection.insertOne(newUser);
      
      console.log(`✅ Created user: ${userData.name}`);
      console.log(`   Email/Username: ${userData.email}`);
      console.log(`   Password: ${userData.password}`);
      console.log(`   Role: ${userData.role}\n`);
    }
    
    console.log('🎉 Easy login users created successfully!');
    console.log('\n📋 You can now login with any of these credentials:');
    console.log('1. admin@test.com / admin (Admin)');
    console.log('2. user@test.com / user (User)');
    console.log('3. admin / admin (Admin)');
    console.log('4. testadmin@timewise.com / admin123 (Admin - existing)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

createEasyLoginUsers();