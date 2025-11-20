const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const MONGODB_URI = 'mongodb://localhost:27017';
const DATABASE_NAME = 'Timewise';
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const MAX_BACKUPS = 5; // Keep only 5 most recent backups

// Create backup directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Generate backup filename with timestamp
const generateBackupFilename = () => {
  const now = new Date();
  const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  return `timewise_backup_${timestamp}`;
};

// Clean up old backups (keep only MAX_BACKUPS)
const cleanupOldBackups = () => {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('timewise_backup_'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        mtime: fs.statSync(path.join(BACKUP_DIR, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime); // Sort by modification time, newest first

    // Remove old backups if we exceed MAX_BACKUPS
    if (files.length > MAX_BACKUPS) {
      const filesToDelete = files.slice(MAX_BACKUPS);
      filesToDelete.forEach(file => {
        try {
          if (fs.statSync(file.path).isDirectory()) {
            fs.rmSync(file.path, { recursive: true, force: true });
          } else {
            fs.unlinkSync(file.path);
          }
          console.log(`🗑️  Removed old backup: ${file.name}`);
        } catch (error) {
          console.error(`❌ Failed to remove backup ${file.name}:`, error.message);
        }
      });
    }
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  }
};

// Create MongoDB backup using mongodump
const createBackup = async () => {
  const backupName = generateBackupFilename();
  const backupPath = path.join(BACKUP_DIR, backupName);

  console.log('🔄 Starting MongoDB backup...');
  console.log(`📁 Backup location: ${backupPath}`);
  console.log(`🗄️  Database: ${DATABASE_NAME}`);

  // mongodump command
  const command = `mongodump --uri="${MONGODB_URI}/${DATABASE_NAME}" --out="${backupPath}"`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Backup failed:', error.message);
        reject(error);
        return;
      }

      if (stderr) {
        console.log('⚠️  Backup warnings:', stderr);
      }

      console.log('✅ Backup completed successfully!');
      console.log(`📊 Backup details:\n${stdout}`);

      // Get backup size
      try {
        const stats = fs.statSync(backupPath);
        const size = (stats.size / (1024 * 1024)).toFixed(2); // Convert to MB
        console.log(`💾 Backup size: ${size} MB`);
      } catch (sizeError) {
        console.log('📏 Could not determine backup size');
      }

      resolve(backupPath);
    });
  });
};

// Create compressed backup
const createCompressedBackup = async () => {
  const backupName = generateBackupFilename();
  const archivePath = path.join(BACKUP_DIR, `${backupName}.archive`);

  console.log('🔄 Starting MongoDB compressed backup...');
  console.log(`📁 Archive location: ${archivePath}`);
  console.log(`🗄️  Database: ${DATABASE_NAME}`);

  // mongodump with --archive option for compression
  const command = `mongodump --uri="${MONGODB_URI}/${DATABASE_NAME}" --archive="${archivePath}" --gzip`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Compressed backup failed:', error.message);
        reject(error);
        return;
      }

      if (stderr) {
        console.log('⚠️  Backup warnings:', stderr);
      }

      console.log('✅ Compressed backup completed successfully!');
      if (stdout) console.log(`📊 Backup details:\n${stdout}`);

      // Get backup size
      try {
        const stats = fs.statSync(archivePath);
        const size = (stats.size / (1024 * 1024)).toFixed(2); // Convert to MB
        console.log(`💾 Compressed backup size: ${size} MB`);
      } catch (sizeError) {
        console.log('📏 Could not determine backup size');
      }

      resolve(archivePath);
    });
  });
};

// Main backup function
const performBackup = async () => {
  const startTime = new Date();
  console.log(`🚀 Starting backup process at ${startTime.toLocaleString()}`);

  try {
    // Check if mongodump is available
    await new Promise((resolve, reject) => {
      exec('mongodump --version', (error) => {
        if (error) {
          reject(new Error('mongodump not found. Please install MongoDB Database Tools.'));
        } else {
          resolve();
        }
      });
    });

    // Create compressed backup (more efficient)
    const backupPath = await createCompressedBackup();

    // Clean up old backups
    console.log('🧹 Cleaning up old backups...');
    cleanupOldBackups();

    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n🎉 Backup process completed successfully!');
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📁 Backup saved to: ${backupPath}`);

    // Log backup completion to a file
    const logEntry = `${new Date().toISOString()} - Backup completed: ${path.basename(backupPath)}\n`;
    fs.appendFileSync(path.join(BACKUP_DIR, 'backup.log'), logEntry);

    return backupPath;

  } catch (error) {
    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.error('\n💥 Backup process failed!');
    console.error(`⏱️  Duration: ${duration} seconds`);
    console.error(`❌ Error: ${error.message}`);

    // Log backup failure
    const logEntry = `${new Date().toISOString()} - Backup failed: ${error.message}\n`;
    fs.appendFileSync(path.join(BACKUP_DIR, 'backup.log'), logEntry);

    throw error;
  }
};

// Run backup if script is called directly
if (require.main === module) {
  performBackup()
    .then((backupPath) => {
      console.log('✨ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { performBackup, cleanupOldBackups };