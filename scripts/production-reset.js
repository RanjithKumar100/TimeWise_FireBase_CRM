/**
 * Complete Production Reset Script
 * Resets everything for a fresh start from today
 * 
 * This script will:
 * 1. Clean all database collections
 * 2. Reset any server-side caches
 * 3. Clear build caches
 * 4. Generate fresh start instructions
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.production.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = MONGODB_URI?.split('/').pop()?.split('?')[0] || 'TIMEWISE';

async function completeReset() {
    console.log('🔄 TIMEWISE - Complete Production Reset');
    console.log('=' .repeat(60));
    console.log(`📅 Reset Date: ${new Date().toISOString().split('T')[0]}`);
    console.log(`📍 Database: ${DB_NAME}`);
    console.log('');

    const client = new MongoClient(MONGODB_URI);

    try {
        // Step 1: Database Cleanup
        console.log('🗄️  STEP 1: Database Reset');
        console.log('-'.repeat(30));
        
        await client.connect();
        const db = client.db(DB_NAME);
        
        const collections = ['users', 'worklogs', 'auditlogs', 'notificationlogs'];
        let totalDeleted = 0;

        for (const collectionName of collections) {
            const collection = db.collection(collectionName);
            const count = await collection.countDocuments();
            
            if (count > 0) {
                await collection.deleteMany({});
                console.log(`✅ Cleared ${collectionName}: ${count} documents removed`);
                totalDeleted += count;
            } else {
                console.log(`✅ ${collectionName}: already empty`);
            }
        }

        console.log(`📊 Total documents removed: ${totalDeleted}`);
        await client.close();

        // Step 2: Clear Next.js caches
        console.log('');
        console.log('💾 STEP 2: Clear Build Caches');
        console.log('-'.repeat(30));
        
        const cachePaths = [
            '.next',
            'node_modules/.cache',
            '.vercel',
            'dist'
        ];

        for (const cachePath of cachePaths) {
            if (fs.existsSync(cachePath)) {
                try {
                    fs.rmSync(cachePath, { recursive: true, force: true });
                    console.log(`✅ Cleared: ${cachePath}`);
                } catch (error) {
                    console.log(`⚠️  Could not clear ${cachePath}: ${error.message}`);
                }
            } else {
                console.log(`✅ ${cachePath}: not found (already clean)`);
            }
        }

        // Step 3: Generate client reset instructions
        console.log('');
        console.log('🌐 STEP 3: Client Reset Instructions');
        console.log('-'.repeat(30));
        
        const clientResetScript = generateClientResetScript();
        fs.writeFileSync('scripts/client-reset.html', clientResetScript);
        console.log('✅ Created client-reset.html for browser localStorage cleanup');

        // Step 4: Create fresh start checklist
        console.log('');
        console.log('📋 STEP 4: Fresh Start Checklist');
        console.log('-'.repeat(30));
        
        const checklist = generateFreshStartChecklist();
        fs.writeFileSync('FRESH_START_CHECKLIST.md', checklist);
        console.log('✅ Created FRESH_START_CHECKLIST.md');

        // Step 5: Summary
        console.log('');
        console.log('=' .repeat(60));
        console.log('🎉 PRODUCTION RESET COMPLETE!');
        console.log('=' .repeat(60));
        console.log('📅 Everything reset for fresh start from today');
        console.log('🗄️  Database: Completely clean');
        console.log('💾 Caches: Cleared');
        console.log('🌐 Client instructions: Generated');
        console.log('');
        console.log('📋 NEXT STEPS:');
        console.log('1. Open client-reset.html in browser to clear localStorage');
        console.log('2. Follow FRESH_START_CHECKLIST.md');
        console.log('3. Create your first admin user');
        console.log('4. Start production operations');
        console.log('');
        console.log('🚀 Ready for Production Phase 1!');

    } catch (error) {
        console.error('❌ Reset failed:', error);
        process.exit(1);
    }
}

function generateClientResetScript() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TIMEWISE - Client Reset</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
        }
        .btn {
            background: #ff4444;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px;
        }
        .btn:hover { background: #cc3333; }
        .success { color: #22c55e; font-weight: bold; }
        .warning { color: #f59e0b; }
        .info { background: #e5f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔄 TIMEWISE Client Reset</h1>
            <p>Clear all browser storage for fresh production start</p>
        </div>

        <div class="info">
            <strong>📅 Reset Date:</strong> ${new Date().toISOString().split('T')[0]}<br>
            <strong>🎯 Purpose:</strong> Clean client-side data for production phase 1
        </div>

        <h3>🧹 What will be cleared:</h3>
        <ul>
            <li>🔐 Authentication tokens</li>
            <li>🔔 Dismissed notifications</li>
            <li>💾 Cached user preferences</li>
            <li>📊 Temporary work log data</li>
            <li>🌐 All localStorage entries</li>
        </ul>

        <div style="text-align: center; margin: 30px 0;">
            <button class="btn" onclick="clearAllStorage()">
                🗑️ Clear All Browser Data
            </button>
        </div>

        <div id="result"></div>

        <div class="info">
            <p class="warning"><strong>⚠️ Important:</strong></p>
            <ul>
                <li>This will log you out of the application</li>
                <li>All unsaved draft data will be lost</li>
                <li>You'll need to login again after reset</li>
            </ul>
        </div>
    </div>

    <script>
        function clearAllStorage() {
            try {
                let cleared = [];
                
                // Clear localStorage
                const localStorageKeys = Object.keys(localStorage);
                if (localStorageKeys.length > 0) {
                    localStorage.clear();
                    cleared.push(\`localStorage (\${localStorageKeys.length} items)\`);
                }
                
                // Clear sessionStorage
                const sessionStorageKeys = Object.keys(sessionStorage);
                if (sessionStorageKeys.length > 0) {
                    sessionStorage.clear();
                    cleared.push(\`sessionStorage (\${sessionStorageKeys.length} items)\`);
                }
                
                // Clear cookies (TIMEWISE related)
                document.cookie.split(";").forEach(function(c) { 
                    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                });
                
                // Clear cache
                if ('caches' in window) {
                    caches.keys().then(cacheNames => {
                        cacheNames.forEach(cacheName => {
                            caches.delete(cacheName);
                        });
                    });
                    cleared.push('Service worker caches');
                }

                const result = document.getElementById('result');
                result.innerHTML = \`
                    <div class="success">
                        <h3>✅ Reset Complete!</h3>
                        <p>Cleared: \${cleared.join(', ')}</p>
                        <p>📅 Reset completed at: \${new Date().toLocaleString()}</p>
                        <p><strong>🔄 Please refresh the page and login again</strong></p>
                    </div>
                \`;

                // Auto refresh after 3 seconds
                setTimeout(() => {
                    window.location.reload();
                }, 3000);

            } catch (error) {
                document.getElementById('result').innerHTML = \`
                    <div style="color: red;">
                        <h3>❌ Error during reset:</h3>
                        <p>\${error.message}</p>
                        <p><strong>Please manually clear browser data via browser settings</strong></p>
                    </div>
                \`;
            }
        }

        // Show current storage info on load
        window.onload = function() {
            const localCount = Object.keys(localStorage).length;
            const sessionCount = Object.keys(sessionStorage).length;
            
            if (localCount > 0 || sessionCount > 0) {
                document.getElementById('result').innerHTML = \`
                    <div class="info">
                        <p><strong>📊 Current Storage:</strong></p>
                        <p>localStorage: \${localCount} items</p>
                        <p>sessionStorage: \${sessionCount} items</p>
                    </div>
                \`;
            } else {
                document.getElementById('result').innerHTML = \`
                    <div class="success">
                        <p>✅ Browser storage is already clean!</p>
                    </div>
                \`;
            }
        };
    </script>
</body>
</html>`;
}

function generateFreshStartChecklist() {
    const today = new Date().toISOString().split('T')[0];
    
    return `# 🚀 TIMEWISE - Fresh Start Checklist

**Production Phase 1 - Started: ${today}**

## ✅ Completed
- [x] Database completely cleaned
- [x] All user accounts removed
- [x] All work logs cleared 
- [x] All audit logs cleared
- [x] All notification logs cleared
- [x] Build caches cleared
- [x] Client reset tools created

## 📋 Next Steps (Complete in order)

### 1. 🌐 Client-Side Reset
- [ ] Open \`scripts/client-reset.html\` in your browser
- [ ] Click "Clear All Browser Data" button
- [ ] Refresh the browser page

### 2. 🔧 Environment Verification
- [ ] Verify \`.env.production.local\` settings
- [ ] Check MongoDB connection string
- [ ] Verify email configuration (if using notifications)
- [ ] Test database connectivity

### 3. 🏗️ Application Setup
- [ ] Run \`npm install\` to ensure dependencies
- [ ] Run \`npm run build\` to create fresh build
- [ ] Start the application: \`npm run start\`
- [ ] Verify application loads correctly

### 4. 👤 Create Admin Account
- [ ] Navigate to registration/signup page
- [ ] Create your first admin user account
- [ ] Verify admin login works
- [ ] Test admin dashboard access

### 5. 🧪 Initial Testing
- [ ] Test user registration (create a test user)
- [ ] Test work log creation
- [ ] Test work log editing/deletion
- [ ] Test notification system (if configured)
- [ ] Test role-based access (admin vs user)

### 6. 📊 Production Configuration
- [ ] Set up production monitoring
- [ ] Configure backup procedures
- [ ] Set up log rotation
- [ ] Configure security settings
- [ ] Test production deployment

### 7. 🎯 Go Live
- [ ] Deploy to production server
- [ ] Update DNS/domain settings
- [ ] Test production URL access
- [ ] Create real user accounts
- [ ] Begin production data entry

## 📞 Troubleshooting

### Database Issues
- Check MongoDB service is running
- Verify connection string in environment file
- Check network connectivity and firewall settings

### Application Issues  
- Clear browser cache completely
- Check for JavaScript console errors
- Verify all environment variables are set
- Ensure all dependencies are installed

### Authentication Issues
- Clear localStorage and cookies
- Check JWT secret configuration
- Verify password hashing is working

## 🎉 Success Criteria

You'll know everything is working when:
- ✅ Database is empty and accepting new data
- ✅ Admin account created successfully
- ✅ Users can register and login
- ✅ Work logs can be created and managed
- ✅ Notifications work (if configured)
- ✅ No errors in browser console
- ✅ All features function as expected

## 📝 Notes

**Reset Date:** ${today}
**Database:** ${DB_NAME}
**Environment:** Production Phase 1

---
**Good luck with your fresh production start! 🚀**

*Keep this checklist until production is fully operational and tested.*`;
}

// Run the reset
if (require.main === module) {
    completeReset().catch(console.error);
}