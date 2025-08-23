# 📧 Email Notification Setup Guide

## Overview
The TimeWise system now includes automated email notifications for users who miss timesheet entries. This guide will help you configure and test the email functionality.

## 🔧 Email Configuration

### Step 1: Environment Variables
Add the following environment variables to your `.env.production.local` or `.env.local` file:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Optional: Set app URL for email links
NEXT_PUBLIC_APP_URL=http://your-server-ip:9002

# Optional: Enable cron jobs in development
ENABLE_CRON=true

# Optional: Set timezone for cron jobs
TIMEZONE=America/New_York
```

### Step 2: Email Provider Setup

#### For Gmail:
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "TimeWise"
   - Use this password in `EMAIL_PASS`

#### For Outlook/Hotmail:
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

#### For Yahoo:
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

#### For Custom SMTP:
```env
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_SECURE=false  # Set to true for port 465
```

## 🚀 Features

### Automated Daily Notifications
- **Schedule**: Monday-Friday at 9:00 AM
- **Logic**: Checks for missing business day entries within the 6-day window
- **Prevention**: Won't send duplicate emails for the same missing dates on the same day

### Manual Notifications
- **Admin Control**: Send notifications immediately via admin dashboard
- **Force Resend**: Override duplicate prevention if needed
- **User Targeting**: Send to specific users or all users with missing entries

### Email Content
- **Personalized**: Includes user name and specific missing dates
- **Urgency Indicators**: Shows days remaining for each missing entry
- **Direct Links**: Clickable link to the timesheet dashboard
- **Professional Design**: HTML email with company branding

## 🎯 How It Works

### Daily Check Process
1. **User Identification**: Finds all active users (excludes admins)
2. **Business Day Calculation**: Identifies work days in the last 6 days
3. **Missing Entry Detection**: Compares logged dates against business days
4. **Time Validation**: Only includes entries still within the 6-day window
5. **Email Generation**: Creates personalized notifications
6. **Duplicate Prevention**: Checks if notification was already sent today

### Email Trigger Conditions
- User has missing timesheet entries for business days
- Missing dates are still within the 6-day editing window
- No notification was sent today for the same missing dates
- Email service is properly configured

## 📊 Admin Dashboard Features

### Quick Actions Tab
- **Check Missing Entries**: Preview who needs notifications
- **Send Notifications**: Send emails to users with missing entries
- **Force Resend**: Override duplicate prevention

### Statistics Tab
- **30-Day Summary**: Total notifications sent, success/failure rates
- **Success Rate**: Percentage of successfully delivered emails
- **Performance Metrics**: Track notification effectiveness

### Recent Results Tab
- **Real-time Results**: View results from latest notification batch
- **Error Details**: See specific failure reasons for troubleshooting
- **User Status**: Track which users were notified, skipped, or failed

### Automation Tab
- **Cron Job Status**: View automated schedule status
- **Manual Trigger**: Test daily check process
- **Configuration**: View timezone and schedule settings

## 🧪 Testing Email Setup

### 1. Test Email Configuration
```bash
# Navigate to Admin Dashboard → Notifications → Quick Actions
# Click "Test Configuration" button
```

### 2. Manual Check
```bash
# Check for missing entries without sending
# Navigate to Admin Dashboard → Notifications → Quick Actions
# Click "Check Missing Entries"
```

### 3. Send Test Notifications
```bash
# Send notifications to users with missing entries
# Navigate to Admin Dashboard → Notifications → Quick Actions
# Click "Send New Notifications"
```

### 4. Trigger Daily Check
```bash
# Manually run the automated daily process
# Navigate to Admin Dashboard → Notifications → Automation
# Click "Trigger Daily Check"
```

## 🔍 Troubleshooting

### Common Issues

#### "Email Not Configured" Error
- Check all EMAIL_* environment variables are set
- Verify EMAIL_USER and EMAIL_PASS are correct
- Test with "Test Configuration" button

#### "Email Sending Failed" Error
- Check SMTP host and port settings
- Verify authentication credentials
- Check firewall/network restrictions on SMTP ports

#### No Users Found with Missing Entries
- Ensure users have "User" role (not "Admin")
- Verify users are marked as active
- Check if entries exist within the 6-day window

#### Notifications Not Sending Automatically
- Check ENABLE_CRON=true in environment
- Verify cron job is running in Automation tab
- Check server timezone settings

### Debug Information
The system logs detailed information for troubleshooting:

```bash
# Check server logs for:
🔔 Daily missing timesheet check
📧 Email sending attempts  
❌ Error messages with details
✅ Success confirmations
```

## 📋 Email Template Preview

### Subject
```
⏰ TimeWise Reminder: Missing Timesheet Entries
```

### Content Highlights
- **Personal Greeting**: "Hello [User Name]"
- **Missing Dates**: Clearly listed business days
- **Time Urgency**: "X days remaining" warning
- **Direct Action**: Link to timesheet dashboard
- **Professional Footer**: Company branding and contact info

### Urgency Levels
- **Normal** (3+ days remaining): Standard reminder
- **Urgent** (1-2 days remaining): Red warning text
- **Critical** (0 days remaining): Entry deadline expired

## 🔒 Security & Privacy

### Data Protection
- No sensitive timesheet data included in emails
- Only missing dates and deadline information shared
- User authentication required to access actual timesheets

### Email Security
- Uses secure SMTP connections (TLS)
- App passwords recommended over account passwords
- Email credentials stored in environment variables only

## 🚀 Going Live

### Production Checklist
1. ✅ Set EMAIL_* environment variables
2. ✅ Test email configuration
3. ✅ Verify cron jobs are enabled
4. ✅ Set correct timezone
5. ✅ Test manual notifications
6. ✅ Monitor first automated run
7. ✅ Check notification statistics

### Maintenance
- Monitor email delivery success rates
- Update email templates as needed
- Adjust cron schedule if required
- Review notification logs periodically

## 📞 Support

If you encounter issues:

1. **Check Environment Variables**: Ensure all EMAIL_* vars are set correctly
2. **Test Configuration**: Use admin dashboard test feature
3. **Review Logs**: Check console output for error details
4. **Network/Firewall**: Verify SMTP ports (587/465) aren't blocked
5. **Provider Settings**: Confirm SMTP settings with your email provider

The email notification system will help ensure timely timesheet submission and improve overall compliance with your team's time tracking requirements! 🎯