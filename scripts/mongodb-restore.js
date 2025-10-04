const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const MONGODB_URI = 'mongodb://localhost:27017';
const DATABASE_NAME = 'Timewise';
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

// List available backups
const listAvailableBackups = () => {
  console.log('🔍 Scanning for available backups...\n');

  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('❌ No backup directory found!');
    return [];
  }

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(file => {
      const fullPath = path.join(BACKUP_DIR, file);
      return (file.startsWith('timewise_backup_') &&
              (fs.statSync(fullPath).isDirectory() || file.endsWith('.archive')));
    })
    .map(file => {
      const fullPath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(fullPath);
      const size = stats.isDirectory()
        ? 'Directory'
        : `${(stats.size / (1024 * 1024)).toFixed(2)} MB`;

      return {
        name: file,
        path: fullPath,
        mtime: stats.mtime,
        size: size,
        isArchive: file.endsWith('.archive')
      };
    })
    .sort((a, b) => b.mtime - a.mtime); // Sort by date, newest first

  if (files.length === 0) {
    console.log('❌ No backups found in the backup directory!');
    return [];
  }

  console.log('📋 Available backups:\n');
  files.forEach((file, index) => {
    const type = file.isArchive ? '📦 Archive' : '📁 Directory';
    console.log(`${index + 1}. ${file.name}`);
    console.log(`   ${type} | ${file.size} | ${file.mtime.toLocaleString()}\n`);
  });

  return files;
};

// Restore from directory backup
const restoreFromDirectory = async (backupPath) => {
  const dbPath = path.join(backupPath, DATABASE_NAME);

  if (!fs.existsSync(dbPath)) {
    throw new Error(`Database backup not found in ${dbPath}`);
  }

  console.log(`🔄 Restoring from directory: ${dbPath}`);

  const command = `mongorestore --uri="${MONGODB_URI}" --drop --dir="${dbPath}"`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }

      if (stderr) {
        console.log('⚠️  Restore warnings:', stderr);
      }

      console.log('✅ Directory restore completed!');
      if (stdout) console.log(stdout);
      resolve();
    });
  });
};

// Restore from archive backup
const restoreFromArchive = async (archivePath) => {
  console.log(`🔄 Restoring from archive: ${archivePath}`);

  const command = `mongorestore --uri="${MONGODB_URI}" --drop --archive="${archivePath}" --gzip`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }

      if (stderr) {
        console.log('⚠️  Restore warnings:', stderr);
      }

      console.log('✅ Archive restore completed!');
      if (stdout) console.log(stdout);
      resolve();
    });
  });
};

// Confirm restore operation
const confirmRestore = async (backupName) => {
  console.log('\n⚠️  WARNING: This operation will REPLACE the current database!');
  console.log(`📥 Selected backup: ${backupName}`);
  console.log(`🗄️  Target database: ${DATABASE_NAME}`);
  console.log('\nAll current data will be lost and replaced with the backup data.');

  const answer = await question('\n❓ Are you sure you want to continue? (type "YES" to confirm): ');

  return answer.toUpperCase() === 'YES';
};

// Main restore function
const performRestore = async () => {
  console.log('🔄 TimeWise MongoDB Restore Utility\n');

  try {
    // Check if mongorestore is available
    await new Promise((resolve, reject) => {
      exec('mongorestore --version', (error) => {
        if (error) {
          reject(new Error('mongorestore not found. Please install MongoDB Database Tools.'));
        } else {
          resolve();
        }
      });
    });

    // List available backups
    const backups = listAvailableBackups();

    if (backups.length === 0) {
      console.log('❌ No backups available for restore.');
      return;
    }

    // Get user selection
    const selection = await question(`\n❓ Select backup to restore (1-${backups.length}): `);
    const selectedIndex = parseInt(selection) - 1;

    if (selectedIndex < 0 || selectedIndex >= backups.length) {
      console.log('❌ Invalid selection!');
      return;
    }

    const selectedBackup = backups[selectedIndex];

    // Confirm restore
    const confirmed = await confirmRestore(selectedBackup.name);
    if (!confirmed) {
      console.log('❌ Restore cancelled by user.');
      return;
    }

    console.log('\n🚀 Starting restore process...');
    const startTime = new Date();

    // Perform restore based on backup type
    if (selectedBackup.isArchive) {
      await restoreFromArchive(selectedBackup.path);
    } else {
      await restoreFromDirectory(selectedBackup.path);
    }

    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n🎉 Restore completed successfully!');
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📁 Restored from: ${selectedBackup.name}`);

    // Log restore completion
    const logEntry = `${new Date().toISOString()} - Restore completed: ${selectedBackup.name}\n`;
    fs.appendFileSync(path.join(BACKUP_DIR, 'restore.log'), logEntry);

  } catch (error) {
    console.error('\n💥 Restore failed!');
    console.error(`❌ Error: ${error.message}`);

    // Log restore failure
    const logEntry = `${new Date().toISOString()} - Restore failed: ${error.message}\n`;
    fs.appendFileSync(path.join(BACKUP_DIR, 'restore.log'), logEntry);

    throw error;
  } finally {
    rl.close();
  }
};

// Run restore if script is called directly
if (require.main === module) {
  performRestore()
    .then(() => {
      console.log('\n✨ Restore script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Restore script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { performRestore, listAvailableBackups };