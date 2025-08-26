/**
 * Database Cleanup Script for Production Phase 1
 * This script will clean all collections in the MongoDB database
 * 
 * ⚠️  WARNING: This will permanently delete ALL data from the database
 * Make sure you have backups if needed before running this script
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.production.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = MONGODB_URI?.split('/').pop()?.split('?')[0] || 'TIMEWISE';

const COLLECTIONS_TO_CLEAN = [
  'users',
  'worklogs', 
  'auditlogs',
  'notificationlogs'
];

async function cleanupDatabase() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  console.log('🧹 Starting Database Cleanup for Production Phase 1');
  console.log('=' .repeat(60));
  console.log(`📍 Database: ${DB_NAME}`);
  console.log(`🔗 Connection: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);
  console.log('');

  const client = new MongoClient(MONGODB_URI);

  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected successfully');

    const db = client.db(DB_NAME);

    // Get all existing collections
    const collections = await db.listCollections().toArray();
    const existingCollections = collections.map(col => col.name);
    
    console.log('');
    console.log('📂 Found collections:', existingCollections.join(', ') || 'None');
    console.log('');

    let totalDeleted = 0;
    let collectionsProcessed = 0;

    // Clean each specified collection
    for (const collectionName of COLLECTIONS_TO_CLEAN) {
      if (existingCollections.includes(collectionName)) {
        console.log(`🗑️  Cleaning collection: ${collectionName}`);
        
        const collection = db.collection(collectionName);
        const countBefore = await collection.countDocuments();
        
        if (countBefore > 0) {
          const result = await collection.deleteMany({});
          console.log(`   📊 Deleted ${result.deletedCount} documents`);
          totalDeleted += result.deletedCount;
        } else {
          console.log(`   📊 Collection was already empty`);
        }
        
        collectionsProcessed++;
      } else {
        console.log(`⚠️  Collection '${collectionName}' does not exist, skipping...`);
      }
    }

    console.log('');
    console.log('=' .repeat(60));
    console.log('📈 CLEANUP SUMMARY');
    console.log('=' .repeat(60));
    console.log(`📂 Collections processed: ${collectionsProcessed}`);
    console.log(`🗑️  Total documents deleted: ${totalDeleted}`);
    console.log('');

    // Verify cleanup
    console.log('🔍 Verifying cleanup...');
    for (const collectionName of COLLECTIONS_TO_CLEAN) {
      if (existingCollections.includes(collectionName)) {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`   ${collectionName}: ${count} documents remaining`);
      }
    }

    console.log('');
    console.log('✅ Database cleanup completed successfully!');
    console.log('🚀 Ready for Production Phase 1');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Confirmation prompt
function askForConfirmation() {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('⚠️  WARNING: This will permanently delete ALL data from the database!');
    console.log('📍 Database:', DB_NAME);
    console.log('🔗 URI:', MONGODB_URI?.replace(/\/\/.*@/, '//***:***@'));
    console.log('');
    
    rl.question('❓ Are you sure you want to proceed? Type "YES" to continue: ', (answer) => {
      rl.close();
      resolve(answer.toUpperCase() === 'YES');
    });
  });
}

// Main execution
async function main() {
  console.log('🧹 TIMEWISE - Database Cleanup Script');
  console.log('=' .repeat(60));
  
  const confirmed = await askForConfirmation();
  
  if (confirmed) {
    console.log('');
    console.log('✅ Confirmation received. Starting cleanup...');
    console.log('');
    await cleanupDatabase();
  } else {
    console.log('');
    console.log('❌ Cleanup cancelled by user');
    console.log('💡 No changes were made to the database');
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n❌ Process interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n❌ Process terminated');
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { cleanupDatabase };