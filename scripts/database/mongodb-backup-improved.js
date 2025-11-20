const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

// Configuration from environment or defaults
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Timewise';
const BACKUP_DIR = path.join(__dirname, '..', '..', 'backups', 'database');
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS) || 7; // Keep 7 days of backups

// Extract database name from URI
const getDatabaseName = (uri) => {
  try {
    const match = uri.match(/\/([^/?]+)(\?|$)/);
    return match ? match[1] : 'Timewise';
  } catch {
    return 'Timewise';
  }
};

const DATABASE_NAME = getDatabaseName(MONGODB_URI);

// Create backup directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`📁 Created backup directory: ${BACKUP_DIR}`);
}

// Generate backup filename with timestamp
const generateBackupFilename = () => {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '')
    .replace('T', '_');
  return `timewise_${DATABASE_NAME}_${timestamp}`;
};

// Get human-readable file size
const getFileSize = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    const bytes = stats.size;
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  } catch {
    return 'Unknown';
  }
};

// Clean up old backups (keep only MAX_BACKUPS)
const cleanupOldBackups = () => {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('timewise_') && file.endsWith('.archive'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        mtime: fs.statSync(path.join(BACKUP_DIR, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime); // Sort by modification time, newest first

    console.log(`📊 Found ${files.length} existing backup(s)`);

    // Remove old backups if we exceed MAX_BACKUPS
    if (files.length > MAX_BACKUPS) {
      const filesToDelete = files.slice(MAX_BACKUPS);
      console.log(`🗑️  Removing ${filesToDelete.length} old backup(s)...`);

      filesToDelete.forEach(file => {
        try {
          fs.unlinkSync(file.path);
          console.log(`   ✓ Deleted: ${file.name} (${getFileSize(file.path)})`);
        } catch (error) {
          console.error(`   ✗ Failed to remove ${file.name}: ${error.message}`);
        }
      });
    } else {
      console.log(`✓ No cleanup needed (${files.length}/${MAX_BACKUPS} backups)`);
    }
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  }
};

// List all backups
const listBackups = () => {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('timewise_') && file.endsWith('.archive'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        size: getFileSize(path.join(BACKUP_DIR, file)),
        date: fs.statSync(path.join(BACKUP_DIR, file)).mtime
      }))
      .sort((a, b) => b.date - a.date);

    if (files.length === 0) {
      console.log('📦 No backups found');
      return [];
    }

    console.log(`\n📦 Available Backups (${files.length}):`);
    console.log('─'.repeat(80));
    files.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name}`);
      console.log(`   Size: ${file.size} | Date: ${file.date.toLocaleString()}`);
    });
    console.log('─'.repeat(80));

    return files;
  } catch (error) {
    console.error('❌ Error listing backups:', error.message);
    return [];
  }
};

// Create compressed backup
const createBackup = async () => {
  const backupName = generateBackupFilename();
  const archivePath = path.join(BACKUP_DIR, `${backupName}.archive`);

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         TimeWise CRM - MongoDB Backup Process                  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log();
  console.log(`🗄️  Database: ${DATABASE_NAME}`);
  console.log(`📁 Backup Location: ${archivePath}`);
  console.log(`🔐 MongoDB URI: ${MONGODB_URI.replace(/\/\/.*@/, '//*****@')}`); // Hide credentials
  console.log();

  // mongodump command with --archive and --gzip for compression
  const command = `mongodump --uri="${MONGODB_URI}" --archive="${archivePath}" --gzip`;

  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    exec(command, (error, stdout, stderr) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (error) {
        console.error('❌ Backup failed!');
        console.error(`⏱️  Duration: ${duration}s`);
        console.error(`💥 Error: ${error.message}`);
        reject(error);
        return;
      }

      const size = getFileSize(archivePath);

      console.log('✅ Backup completed successfully!');
      console.log(`⏱️  Duration: ${duration}s`);
      console.log(`💾 Backup Size: ${size}`);
      console.log(`📍 Location: ${archivePath}`);

      if (stderr && !stderr.includes('done dumping')) {
        console.log(`⚠️  Warnings: ${stderr}`);
      }

      resolve({
        path: archivePath,
        size: size,
        duration: duration,
        database: DATABASE_NAME
      });
    });
  });
};

// Main backup function
const performBackup = async () => {
  const startTime = new Date();
  console.log(`🚀 Starting backup at ${startTime.toLocaleString()}\n`);

  try {
    // Check if mongodump is available
    console.log('🔍 Checking MongoDB tools installation...');
    await new Promise((resolve, reject) => {
      exec('mongodump --version', (error, stdout) => {
        if (error) {
          reject(new Error(
            'mongodump not found!\n' +
            '   Please install MongoDB Database Tools:\n' +
            '   https://www.mongodb.com/try/download/database-tools'
          ));
        } else {
          console.log(`✓ mongodump found: ${stdout.split('\n')[0]}\n`);
          resolve();
        }
      });
    });

    // Create backup
    const result = await createBackup();

    // Clean up old backups
    console.log('\n🧹 Cleaning up old backups...');
    cleanupOldBackups();

    // Log backup completion
    const logEntry = {
      timestamp: new Date().toISOString(),
      database: result.database,
      size: result.size,
      duration: result.duration,
      path: result.path,
      status: 'success'
    };

    const logFile = path.join(BACKUP_DIR, 'backup.log');
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');

    console.log('\n' + '═'.repeat(80));
    console.log('🎉 BACKUP COMPLETED SUCCESSFULLY!');
    console.log('═'.repeat(80));

    return result;

  } catch (error) {
    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.error('\n' + '═'.repeat(80));
    console.error('💥 BACKUP FAILED!');
    console.error('═'.repeat(80));
    console.error(`⏱️  Duration: ${duration}s`);
    console.error(`❌ Error: ${error.message}`);

    // Log backup failure
    const logEntry = {
      timestamp: new Date().toISOString(),
      database: DATABASE_NAME,
      duration: duration,
      status: 'failed',
      error: error.message
    };

    const logFile = path.join(BACKUP_DIR, 'backup.log');
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');

    throw error;
  }
};

// Command line interface
const args = process.argv.slice(2);
const command = args[0];

if (require.main === module) {
  if (command === 'list') {
    listBackups();
  } else if (command === 'cleanup') {
    console.log('🧹 Running cleanup...\n');
    cleanupOldBackups();
  } else {
    performBackup()
      .then(() => {
        console.log('\n✨ Backup script completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n💥 Backup script failed');
        process.exit(1);
      });
  }
}

module.exports = { performBackup, cleanupOldBackups, listBackups };
