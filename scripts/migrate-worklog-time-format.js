const { MongoClient } = require('mongodb');

// Configuration
const MONGODB_URI = 'mongodb://localhost:27017/Timewise';
const DATABASE_NAME = 'Timewise';
const COLLECTION_NAME = 'worklogs';

async function migrateWorklogTimeFormat() {
  console.log('🔄 Starting WorkLog time format migration...');

  let client;

  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Find all work logs that have hoursSpent but missing hours or minutes fields
    const worklogsToMigrate = await collection.find({
      $and: [
        { hoursSpent: { $exists: true } },
        {
          $or: [
            { hours: { $exists: false } },
            { minutes: { $exists: false } }
          ]
        }
      ]
    }).toArray();

    console.log(`📊 Found ${worklogsToMigrate.length} work logs to migrate`);

    if (worklogsToMigrate.length === 0) {
      console.log('✨ No migration needed - all work logs already have hours/minutes format');
      return;
    }

    // Process each work log
    let migratedCount = 0;

    for (const worklog of worklogsToMigrate) {
      try {
        const hoursSpent = worklog.hoursSpent || 0;

        // Convert decimal hours to hours and minutes
        const hours = Math.floor(hoursSpent);
        const minutes = Math.round((hoursSpent - hours) * 60);

        // Update the work log
        await collection.updateOne(
          { _id: worklog._id },
          {
            $set: {
              hours: hours,
              minutes: minutes
            },
            $unset: {
              hoursSpent: ""  // Remove the old hoursSpent field
            }
          }
        );

        migratedCount++;

        if (migratedCount % 10 === 0) {
          console.log(`⏳ Migrated ${migratedCount}/${worklogsToMigrate.length} work logs...`);
        }

      } catch (error) {
        console.error(`❌ Failed to migrate work log ${worklog._id}:`, error);
      }
    }

    console.log(`✅ Successfully migrated ${migratedCount} work logs`);

    // Verify migration
    const remainingOldFormat = await collection.countDocuments({ hoursSpent: { $exists: true } });
    const newFormatCount = await collection.countDocuments({
      hours: { $exists: true },
      minutes: { $exists: true }
    });

    console.log('\n📈 Migration Summary:');
    console.log(`- Work logs with old format remaining: ${remainingOldFormat}`);
    console.log(`- Work logs with new format: ${newFormatCount}`);

    if (remainingOldFormat === 0) {
      console.log('🎉 Migration completed successfully! All work logs now use hours/minutes format.');
    } else {
      console.log('⚠️  Some work logs still have the old format. You may need to run this script again.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateWorklogTimeFormat()
    .then(() => {
      console.log('✨ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateWorklogTimeFormat };