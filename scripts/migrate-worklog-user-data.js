// Migration script to populate user information in existing WorkLog records
// This preserves historical user data for cases where users might be deleted later

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function migrateWorkLogUserData() {
  try {
    console.log('🔄 Starting WorkLog user data migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get references to collections
    const User = mongoose.connection.collection('users');
    const WorkLog = mongoose.connection.collection('worklogs');
    
    // Find all work logs that are missing user information
    const workLogsToUpdate = await WorkLog.find({
      $or: [
        { userName: { $exists: false } },
        { userEmail: { $exists: false } },
        { userRole: { $exists: false } },
        { userName: null },
        { userEmail: null },
        { userRole: null }
      ]
    }).toArray();
    
    console.log(`📊 Found ${workLogsToUpdate.length} work logs to update`);
    
    if (workLogsToUpdate.length === 0) {
      console.log('✅ No work logs need updating');
      return;
    }
    
    // Get unique user IDs
    const userIds = [...new Set(workLogsToUpdate.map(log => log.userId))];
    console.log(`👥 Fetching user data for ${userIds.length} users`);
    
    // Fetch all users
    const users = await User.find({ userId: { $in: userIds } }).toArray();
    const userMap = new Map(users.map(user => [user.userId, user]));
    
    console.log(`📋 Found ${users.length} matching users`);
    
    // Update work logs in batches
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const log of workLogsToUpdate) {
      const user = userMap.get(log.userId);
      
      if (user) {
        await WorkLog.updateOne(
          { _id: log._id },
          {
            $set: {
              userName: user.name,
              userEmail: user.email,
              userRole: user.role
            }
          }
        );
        updatedCount++;
        
        if (updatedCount % 10 === 0) {
          console.log(`📝 Updated ${updatedCount}/${workLogsToUpdate.length} work logs...`);
        }
      } else {
        console.log(`⚠️  User not found for work log ${log.logId} (userId: ${log.userId})`);
        skippedCount++;
        
        // Set placeholder data for deleted users
        await WorkLog.updateOne(
          { _id: log._id },
          {
            $set: {
              userName: 'Deleted User',
              userEmail: 'deleted@example.com',
              userRole: 'User'
            }
          }
        );
      }
    }
    
    console.log(`✅ Migration completed!`);
    console.log(`   - Updated: ${updatedCount} work logs`);
    console.log(`   - Skipped (deleted users): ${skippedCount} work logs`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  migrateWorkLogUserData()
    .then(() => {
      console.log('🎉 Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateWorkLogUserData };