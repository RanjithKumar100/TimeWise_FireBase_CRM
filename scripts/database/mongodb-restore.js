const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Timewise';
const BACKUP_DIR = path.join(__dirname, '..', '..', 'backups', 'database');

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

// List all backups
const listBackups = () => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      console.log('❌ Backup directory not found:', BACKUP_DIR);
      return [];
    }

    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('timewise_') && file.endsWith('.archive'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        size: getFileSize(path.join(BACKUP_DIR, file)),
        date: fs.statSync(path.join(BACKUP_DIR, file)).mtime
      }))
      .sort((a, b) => b.date - a.date);

    return files;
  } catch (error) {
    console.error('❌ Error listing backups:', error.message);
    return [];
  }
};

// Restore from backup
const restoreBackup = async (backupPath, options = {}) => {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         TimeWise CRM - MongoDB Restore Process                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log();

  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  console.log(`🗄️  Target Database: ${DATABASE_NAME}`);
  console.log(`📁 Restore From: ${backupPath}`);
  console.log(`💾 Backup Size: ${getFileSize(backupPath)}`);
  console.log(`🔐 MongoDB URI: ${MONGODB_URI.replace(/\/\/.*@/, '//*****@')}`);

  if (options.drop) {
    console.log(`⚠️  WARNING: --drop flag enabled! Existing data will be DELETED!`);
  }

  console.log();

  // mongorestore command
  let command = `mongorestore --uri="${MONGODB_URI}" --archive="${backupPath}" --gzip`;

  if (options.drop) {
    command += ' --drop'; // Drop existing collections before restore
  }

  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    console.log('🔄 Starting restore process...\n');

    exec(command, (error, stdout, stderr) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (error) {
        console.error('❌ Restore failed!');
        console.error(`⏱️  Duration: ${duration}s`);
        console.error(`💥 Error: ${error.message}`);
        reject(error);
        return;
      }

      console.log('✅ Restore completed successfully!');
      console.log(`⏱️  Duration: ${duration}s`);
      console.log(`🗄️  Database: ${DATABASE_NAME}`);

      if (stdout) {
        console.log(`\n📊 Restore Details:\n${stdout}`);
      }

      if (stderr && !stderr.includes('done')) {
        console.log(`⚠️  Warnings: ${stderr}`);
      }

      // Log restore completion
      const logEntry = {
        timestamp: new Date().toISOString(),
        database: DATABASE_NAME,
        backupFile: path.basename(backupPath),
        duration: duration,
        status: 'success',
        dropEnabled: options.drop || false
      };

      const logFile = path.join(BACKUP_DIR, 'restore.log');
      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');

      resolve({
        database: DATABASE_NAME,
        backupFile: path.basename(backupPath),
        duration: duration
      });
    });
  });
};

// Interactive restore
const interactiveRestore = async () => {
  const backups = listBackups();

  if (backups.length === 0) {
    console.log('❌ No backups found in:', BACKUP_DIR);
    console.log('   Please create a backup first using: npm run db:backup');
    return;
  }

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         TimeWise CRM - Available Backups                       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log();

  backups.forEach((backup, index) => {
    console.log(`${index + 1}. ${backup.name}`);
    console.log(`   Size: ${backup.size} | Created: ${backup.date.toLocaleString()}`);
    console.log();
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = (question) => {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  };

  try {
    const selection = await askQuestion('Enter backup number to restore (or 0 to cancel): ');
    const backupIndex = parseInt(selection) - 1;

    if (backupIndex === -1) {
      console.log('❌ Restore cancelled');
      rl.close();
      return;
    }

    if (backupIndex < 0 || backupIndex >= backups.length) {
      console.log('❌ Invalid selection');
      rl.close();
      return;
    }

    const selectedBackup = backups[backupIndex];

    console.log();
    console.log('⚠️  WARNING: This will restore the database!');
    console.log(`   Backup: ${selectedBackup.name}`);
    console.log(`   Target Database: ${DATABASE_NAME}`);
    console.log();

    const dropAnswer = await askQuestion('Drop existing data before restore? (yes/no): ');
    const shouldDrop = dropAnswer.toLowerCase() === 'yes' || dropAnswer.toLowerCase() === 'y';

    console.log();
    const confirmAnswer = await askQuestion('Are you sure you want to continue? (yes/no): ');

    if (confirmAnswer.toLowerCase() !== 'yes' && confirmAnswer.toLowerCase() !== 'y') {
      console.log('❌ Restore cancelled');
      rl.close();
      return;
    }

    console.log();
    rl.close();

    await restoreBackup(selectedBackup.path, { drop: shouldDrop });

    console.log('\n' + '═'.repeat(80));
    console.log('🎉 RESTORE COMPLETED SUCCESSFULLY!');
    console.log('═'.repeat(80));

  } catch (error) {
    console.error('\n' + '═'.repeat(80));
    console.error('💥 RESTORE FAILED!');
    console.error('═'.repeat(80));
    console.error(`❌ Error: ${error.message}`);

    rl.close();
    process.exit(1);
  }
};

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === 'list') {
    const backups = listBackups();
    if (backups.length === 0) {
      console.log('📦 No backups found');
    } else {
      console.log(`\n📦 Available Backups (${backups.length}):`);
      console.log('─'.repeat(80));
      backups.forEach((file, index) => {
        console.log(`${index + 1}. ${file.name}`);
        console.log(`   Size: ${file.size} | Date: ${file.date.toLocaleString()}`);
      });
      console.log('─'.repeat(80));
    }
  } else if (args[0] && fs.existsSync(args[0])) {
    // Restore specific backup file
    const drop = args.includes('--drop');
    restoreBackup(args[0], { drop })
      .then(() => {
        console.log('\n✨ Restore completed');
        process.exit(0);
      })
      .catch(() => {
        process.exit(1);
      });
  } else {
    // Interactive mode
    interactiveRestore()
      .then(() => {
        process.exit(0);
      })
      .catch(() => {
        process.exit(1);
      });
  }
}

module.exports = { restoreBackup, listBackups };
