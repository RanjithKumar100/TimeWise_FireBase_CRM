/**
 * Script to update all import paths after restructuring
 * Run with: node scripts/deployment/update-imports.js
 */

const fs = require('fs');
const path = require('path');

const importMappings = {
  // API imports
  "@/lib/api'": "@/lib/api/client'",
  '@/lib/api"': '@/lib/api/client"',
  "@/lib/api-utils'": "@/lib/api/utils'",
  '@/lib/api-utils"': '@/lib/api/utils"',

  // Auth imports
  "@/lib/auth'": "@/lib/auth/index'",
  '@/lib/auth"': '@/lib/auth/index"',

  // Database imports
  "@/lib/mongodb'": "@/lib/database/mongodb'",
  '@/lib/mongodb"': '@/lib/database/mongodb"',
  "@/lib/seed'": "@/lib/database/seed'",
  '@/lib/seed"': '@/lib/database/seed"',

  // Service imports
  "@/lib/email'": "@/lib/services/email/index'",
  '@/lib/email"': '@/lib/services/email/index"',
  "from '@/lib/email'": "from '@/lib/services/email'",
  'from "@/lib/email"': 'from "@/lib/services/email"',
  "@/lib/notification-service'": "@/lib/services/notification/index'",
  '@/lib/notification-service"': '@/lib/services/notification/index"',
  "from '@/lib/notification-service'": "from '@/lib/services/notification'",
  'from "@/lib/notification-service"': 'from "@/lib/services/notification"',
  "@/lib/cron-service'": "@/lib/services/cron/index'",
  '@/lib/cron-service"': '@/lib/services/cron/index"',
  "from '@/lib/cron-service'": "from '@/lib/services/cron'",
  'from "@/lib/cron-service"': 'from "@/lib/services/cron"',

  // Utils imports
  "@/lib/date-utils'": "@/lib/utils/date'",
  '@/lib/date-utils"': '@/lib/utils/date"',
  "@/lib/time-utils'": "@/lib/utils/time'",
  '@/lib/time-utils"': '@/lib/utils/time"',
  "@/lib/permissions'": "@/lib/utils/permissions'",
  '@/lib/permissions"': '@/lib/utils/permissions"',
  "@/lib/utils'": "@/lib/utils/helpers'",
  '@/lib/utils"': '@/lib/utils/helpers"',
  "from '@/lib/utils'": "from '@/lib/utils/helpers'",
  'from "@/lib/utils"': 'from "@/lib/utils/helpers"',
  "@/lib/debug'": "@/lib/utils/debug'",
  '@/lib/debug"': '@/lib/utils/debug"',
  "@/lib/startup'": "@/lib/utils/startup'",
  '@/lib/startup"': '@/lib/utils/startup"',

  // Constants imports
  "@/lib/colors'": "@/lib/constants/colors'",
  '@/lib/colors"': '@/lib/constants/colors"',
  "@/lib/data'": "@/lib/constants/data'",
  '@/lib/data"': '@/lib/constants/data"',
};

function updateFileImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    for (const [oldImport, newImport] of Object.entries(importMappings)) {
      if (content.includes(oldImport)) {
        content = content.replace(new RegExp(oldImport.replace(/'/g, "\\'"), 'g'), newImport);
        updated = true;
      }
    }

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

function walkDirectory(dir, fileCallback) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, .next, .git
      if (!['node_modules', '.next', '.git', 'backups'].includes(file)) {
        walkDirectory(filePath, fileCallback);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      fileCallback(filePath);
    }
  });
}

console.log('🔄 Starting import path updates...\n');

const srcDir = path.join(__dirname, '..', '..', 'src');
let updatedCount = 0;

walkDirectory(srcDir, (filePath) => {
  if (updateFileImports(filePath)) {
    updatedCount++;
  }
});

console.log(`\n✅ Import update complete! Updated ${updatedCount} files.`);
