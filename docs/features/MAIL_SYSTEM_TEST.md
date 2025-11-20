# Mail System Toggle - Testing Guide

## How to Test Mail System is Working Correctly

### Setup:
1. Navigate to `/dashboard/diagnostics` (Developer role required)
2. Find the **Mail System Control** panel
3. Check current status

---

## Test Cases:

### ✅ Test 1: Toggle Mail System OFF
1. **Action:** Turn OFF the mail system toggle
2. **Expected:**
   - Badge shows "Disabled" (red)
   - Red warning box appears
   - `system-config.json` updates to `"mailSystemEnabled": false`

### ✅ Test 2: Missing Timesheet Notification (Manual Trigger)
**With Mail System OFF:**
1. Go to Admin panel → Notification Management
2. Click "Check Missing Entries"
3. Click "Send Notifications"
4. **Expected:**
   - Console logs: `🚫 BLOCKED: Mail system is DISABLED`
   - No emails sent
   - Admin sees "Mail system currently disabled" banner

**With Mail System ON:**
1. Toggle mail system ON in diagnostics
2. Repeat steps above
3. **Expected:**
   - Console logs: `✅ Mail system enabled, proceeding to send email`
   - Emails ARE sent

### ✅ Test 3: Cron Job Notification
**With Mail System OFF:**
1. Wait for cron job to run (9 AM or hourly check)
2. **Expected in console:**
   ```
   🔔 Running daily missing timesheet check...
   📧 Mail system is disabled. Skipping notification sending.
   ```
3. **No emails sent**

### ✅ Test 4: Welcome Email (New User Creation)
**With Mail System OFF:**
1. Admin creates new user
2. **Expected console logs:**
   ```
   📬 sendEmail called for: newuser@example.com
   🔍 Mail system check result: false
   🚫 BLOCKED: Mail system is DISABLED. Email NOT sent
   ```
3. **No welcome email sent**

### ✅ Test 5: Password Reset Email
**With Mail System OFF:**
1. User requests password reset
2. **Expected console logs:**
   ```
   📬 sendEmail called for: user@example.com
   🔍 Mail system check result: false
   🚫 BLOCKED: Mail system is DISABLED
   ```
3. **No reset email sent**

---

## Console Log Patterns to Look For:

### When System is OFF:
```
🔍 Checking mail system status from: C:\...\system-config.json
📧 Mail system enabled status: false
📬 sendEmail called for: user@example.com | Subject: ...
🔍 Mail system check result: false
🚫 BLOCKED: Mail system is DISABLED. Email NOT sent to: user@example.com
```

### When System is ON:
```
🔍 Checking mail system status from: C:\...\system-config.json
📧 Mail system enabled status: true
📬 sendEmail called for: user@example.com | Subject: ...
🔍 Mail system check result: true
✅ Mail system enabled, proceeding to send email...
Email sent successfully: <message-id>
```

---

## If Emails Still Send When System is OFF:

### Debug Steps:
1. **Check system-config.json file:**
   ```bash
   cat system-config.json | grep mailSystemEnabled
   ```
   Should show: `"mailSystemEnabled": false`

2. **Check console logs** for these patterns:
   - If you see "🔍 Checking mail system status" - check is working
   - If you DON'T see this log - file reading is failing
   - If status shows `true` when toggle is OFF - file write failed

3. **Verify file path:**
   - The helper function reads from `process.cwd() + '/system-config.json'`
   - Make sure this file exists in project root

4. **Check server restart:**
   - After toggling, the Node.js server should NOT need restart
   - File is read on every email send (not cached)

5. **Look for multiple instances:**
   - Make sure only ONE dev server is running
   - Check: `tasklist | findstr node` (Windows)
   - Different server instance might have different config

---

## Expected Behavior Summary:

| Action | Mail OFF | Mail ON |
|--------|----------|---------|
| Missing timesheet notification | ❌ Blocked | ✅ Sent |
| Welcome email (new user) | ❌ Blocked | ✅ Sent |
| Password reset | ❌ Blocked | ✅ Sent |
| Cron job emails | ❌ Blocked | ✅ Sent |
| Manual admin notifications | ❌ Blocked | ✅ Sent |

---

## Admin UI Indicators:

**When Mail System is OFF:**
- ❌ Red alert banner in Notification Management
- 🔴 "Disabled" badge
- ⚠️ Warning message about contacting developer

**When Mail System is ON:**
- ✅ No red banner
- 🟢 "Active" badge
- ✅ Normal notification features work

---

## Quick Verification Command:

Run in terminal to watch logs:
```bash
npm run dev
```

Then trigger an email action and watch for:
- `🔍 Checking mail system status`
- `📧 Mail system enabled status: true/false`
- `🚫 BLOCKED` (if disabled)
- `✅ Mail system enabled` (if enabled)
