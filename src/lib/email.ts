import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter!: nodemailer.Transporter;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      // Debug: Log environment variables (without sensitive data)
      console.log('Email service initialization:', {
        host: process.env.EMAIL_HOST || 'not set',
        port: process.env.EMAIL_PORT || 'not set',
        user: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}***@${process.env.EMAIL_USER.split('@')[1] || 'not set'}` : 'not set',
        hasPass: !!process.env.EMAIL_PASS,
        NODE_ENV: process.env.NODE_ENV
      });

      const emailConfig: EmailConfig = {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER || '',
          pass: process.env.EMAIL_PASS || '',
        },
      };

      if (!emailConfig.auth.user || !emailConfig.auth.pass) {
        console.warn('Email configuration incomplete:', {
          missingUser: !emailConfig.auth.user,
          missingPass: !emailConfig.auth.pass,
          host: emailConfig.host,
          port: emailConfig.port
        });
        this.isConfigured = false;
        return;
      }

      this.transporter = nodemailer.createTransport(emailConfig);
      this.isConfigured = true;
      
      console.log('Email service initialized successfully with:', {
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        user: `${emailConfig.auth.user.substring(0, 3)}***@${emailConfig.auth.user.split('@')[1]}`
      });
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  // Force re-initialization (useful for runtime config changes)
  reinitialize() {
    this.initializeTransporter();
  }

  // Check if email is configured
  isEmailConfigured(): boolean {
    return this.isConfigured;
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured) {
      // Try to reinitialize in case env vars were loaded after construction
      this.reinitialize();
      
      if (!this.isConfigured) {
        console.log('Email verification failed: Service not configured');
        return false;
      }
    }

    try {
      console.log('Verifying email connection...');
      await this.transporter.verify();
      console.log('Email connection verified successfully');
      return true;
    } catch (error) {
      console.error('Email connection verification failed:', error);
      this.isConfigured = false; // Mark as not configured if verification fails
      return false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured) {
      console.error('Email service not configured properly');
      return false;
    }

    try {
      const mailOptions = {
        from: `TimeWise System <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  generateMissingTimesheetEmail(userName: string, missingDates: Date[], daysRemaining: number): { subject: string; html: string; text: string } {
    // Check if any missing date is yesterday (more urgent)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    const hasYesterdayMissing = missingDates.some(date => 
      date.toISOString().split('T')[0] === yesterdayString
    );
    
    const isUrgent = hasYesterdayMissing || daysRemaining <= 2;
    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const missingDatesText = missingDates.map(formatDate).join(', ');
    
    const subject = isUrgent 
      ? `🚨 URGENT: TimeWise Missing Timesheet - Action Required!`
      : `⏰ TimeWise Reminder: Missing Timesheet Entries`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Timesheet Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .alert { background: #fef3cd; border: 1px solid #facc15; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .missing-dates { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px; }
          .urgency { color: #dc2626; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ TimeWise Reminder</h1>
            <p>Missing Timesheet Entry Notification</p>
          </div>
          
          <div class="content">
            <h2>Hello ${userName},</h2>
            
            <div class="alert">
              <strong>${isUrgent ? '🚨 URGENT ACTION REQUIRED:' : '⚠️ Action Required:'}</strong> You have missing timesheet entries that need to be submitted ${hasYesterdayMissing ? 'including yesterday\'s work!' : ''}.
            </div>
            
            ${hasYesterdayMissing ? `
            <div style="background: #fef2f2; border: 2px solid #dc2626; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <p style="color: #dc2626; font-weight: bold; margin: 0;">⚠️ YESTERDAY'S TIMESHEET MISSING!</p>
              <p style="color: #dc2626; margin: 5px 0 0 0;">Please submit your timesheet for yesterday immediately to avoid deadline expiration.</p>
            </div>
            ` : ''}
            
            <h3>Missing Entries for:</h3>
            <div class="missing-dates">
              <p><strong>${missingDatesText}</strong></p>
            </div>
            
            <div class="alert">
              <p class="urgency">⏰ Please enter your missing timesheet data as soon as possible!</p>
              ${daysRemaining <= 2 ? '<p><strong>⚠️ URGENT:</strong> Please submit your entries as soon as possible to avoid deadline expiration.</p>' : ''}
            </div>
            
            <h3>What you need to do:</h3>
            <ul>
              <li>Log into the TimeWise system</li>
              <li>Navigate to your dashboard</li>
              <li>Fill in the missing timesheet entries for the dates listed above</li>
              <li>Ensure all required fields are completed (Vertical, Country, Task, Hours)</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/dashboard/user" class="button">
                📝 Complete Your Timesheet
              </a>
            </div>
            
            <h3>Important Reminders:</h3>
            <ul>
              <li>You can only edit entries within 3 days of the work date</li>
              <li>Maximum 24 hours can be logged per day</li>
              <li>All entries must be submitted before the deadline expires</li>
            </ul>
            
            <div class="footer">
              <p>This is an automated reminder from the TimeWise system.</p>
              <p>If you have any questions, please contact your administrator.</p>
              <p><small>© ${new Date().getFullYear()} TimeWise - Internal Timesheet Management System</small></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
TimeWise Reminder: Missing Timesheet Entries

Hello ${userName},

You have missing timesheet entries for the following dates:
${missingDatesText}

Please enter your missing timesheet data as soon as possible!

Please log into the TimeWise system and complete your timesheet entries as soon as possible.

Login at: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/dashboard/user

Important: You can only edit entries within 3 days of the work date.

This is an automated reminder from the TimeWise system.
    `;

    return { subject, html, text };
  }

  generateWelcomeEmail(userName: string, userEmail: string, password: string, role: 'Admin' | 'User' | 'Inspection'): { subject: string; html: string; text: string } {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://192.168.1.43:9002';
    const isAdmin = role === 'Admin';
    const isInspection = role === 'Inspection';
    
    const subject = `🎉 Welcome to TimeWise - Your Account Has Been Created!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to TimeWise</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .credentials { background: white; padding: 20px; border: 2px solid #10b981; border-radius: 8px; margin: 20px 0; }
          .credential-item { margin: 10px 0; padding: 10px; background: #f0fdf4; border-left: 4px solid #10b981; }
          .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px; }
          .role-badge { display: inline-block; background: ${isAdmin ? '#dc2626' : '#3b82f6'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .important { background: #fef3cd; border: 1px solid #facc15; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to TimeWise!</h1>
            <p>Your timesheet management account is ready</p>
            <span class="role-badge">${role} Account</span>
          </div>
          
          <div class="content">
            <h2>Hello ${userName}! 👋</h2>
            
            <p>Your TimeWise account has been successfully created by an administrator. You can now access the system to ${isAdmin ? 'manage users and oversee' : 'track and manage'} timesheet entries.</p>
            
            <div class="credentials">
              <h3>🔐 Your Login Credentials:</h3>
              
              <div class="credential-item">
                <strong>📧 Username/Email:</strong> <code>${userEmail}</code>
              </div>
              
              <div class="credential-item">
                <strong>🔑 Password:</strong> <code>${password}</code>
              </div>
              
              <div class="credential-item">
                <strong>🌐 Login URL:</strong> <a href="${appUrl}">${appUrl}</a>
              </div>
              
              <div class="credential-item">
                <strong>👤 Account Type:</strong> <span class="role-badge">${role}</span>
              </div>
            </div>
            
            <div class="important">
              <strong>🔒 Security Reminder:</strong> Please change your password after your first login for better security. You can do this in the Settings section of your dashboard.
            </div>
            
            <div style="text-align: center;">
              <a href="${appUrl}" class="button">
                🚀 Login to TimeWise
              </a>
            </div>
            
            <h3>📋 What's Next?</h3>
            <ol>
              <li><strong>Login:</strong> Use the credentials above to access your account</li>
              <li><strong>Explore:</strong> Familiarize yourself with the dashboard and features</li>
              ${isAdmin
                ? `<li><strong>Manage Users:</strong> Access admin panel to manage team members and timesheets</li>
                   <li><strong>Configure Settings:</strong> Set up system preferences and notification settings</li>`
                : isInspection
                ? `<li><strong>Monitor Compliance:</strong> Access inspection dashboard to view timesheet compliance</li>
                   <li><strong>Review Reports:</strong> Check team compliance rates and missing entries</li>`
                : `<li><strong>Start Logging:</strong> Begin tracking your daily work hours and tasks</li>
                   <li><strong>Review Guidelines:</strong> Check the 3-day editing window and submission requirements</li>`
              }
              <li><strong>Change Password:</strong> Update your password in Settings for enhanced security</li>
            </ol>
            
            <h3>🎯 ${isAdmin ? 'Admin Features Available:' : isInspection ? 'Inspection Features Available:' : 'User Features Available:'}</h3>
            <ul>
              ${isAdmin
                ? `<li>👥 User Management - Create and manage team accounts</li>
                   <li>📊 System Analytics - View comprehensive timesheet reports</li>
                   <li>📧 Notification Management - Configure email reminders</li>
                   <li>🔧 System Settings - Manage application preferences</li>
                   <li>📝 Full Timesheet Access - View and edit all user entries</li>`
                : isInspection
                ? `<li>🔍 Compliance Monitoring - View team timesheet completion rates</li>
                   <li>📅 Calendar View - Visual inspection of individual user timesheets</li>
                   <li>📊 Compliance Reports - Track missing entries and submission patterns</li>
                   <li>🚨 Compliance Alerts - Identify users with low completion rates</li>
                   <li>👀 User Search - Quickly find and inspect specific team members</li>`
                : `<li>⏰ Time Tracking - Log daily work hours and tasks</li>
                   <li>📅 Calendar View - Manage entries within 3-day editing window</li>
                   <li>📊 Personal Reports - View your timesheet history</li>
                   <li>🔔 Smart Notifications - Get reminders for missing entries</li>
                   <li>📱 Multi-device Access - Use from any device on the network</li>`
              }
            </ul>
            
            <div class="important">
              <p><strong>📞 Need Help?</strong> If you have any questions or encounter issues, please contact your system administrator or refer to the help section in the application.</p>
            </div>
            
            <div class="footer">
              <p>This email contains sensitive login information. Please keep it secure.</p>
              <p><strong>TimeWise System</strong> - Internal Timesheet Management</p>
              <p><small>© ${new Date().getFullYear()} TimeWise - This is a system-generated email</small></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Welcome to TimeWise!

Hello ${userName},

Your TimeWise account has been successfully created.

Login Credentials:
- Username/Email: ${userEmail}
- Password: ${password}
- Login URL: ${appUrl}
- Account Type: ${role}

IMPORTANT: Please change your password after your first login for better security.

What's Next:
1. Login using the credentials above
2. Explore your dashboard and available features
3. ${isAdmin ? 'Access admin panel to manage users and system settings' : 'Start logging your daily work hours and tasks'}
4. Change your password in Settings for enhanced security

${isAdmin 
  ? 'As an Admin, you have full access to user management, system analytics, and notification settings.'
  : 'As a User, you can track time, manage entries within the 3-day window, and view personal reports.'
}

Need help? Contact your system administrator or refer to the help section in the application.

Login now at: ${appUrl}

This email contains sensitive login information. Please keep it secure.

TimeWise System - Internal Timesheet Management
    `;

    return { subject, html, text };
  }

  generatePasswordResetEmail(userName: string, resetUrl: string, expiresAt: Date): { subject: string; html: string; text: string } {
    const expiryTime = expiresAt.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZoneName: 'short'
    });
    const expiryDate = expiresAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const subject = '🔒 TimeWise Password Reset Request';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .alert { background: #fef3cd; border: 1px solid #facc15; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .security-warning { background: #fef2f2; border: 1px solid #dc2626; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .button:hover { background: #b91c1c; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px; }
          .code-block { background: #f3f4f6; padding: 15px; border-radius: 6px; font-family: monospace; word-break: break-all; margin: 15px 0; }
          .urgency { color: #dc2626; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Password Reset Request</h1>
            <p>TimeWise Account Security</p>
          </div>
          
          <div class="content">
            <h2>Hello ${userName},</h2>
            
            <p>We received a request to reset the password for your TimeWise account. If you made this request, click the button below to reset your password.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">
                🔑 Reset My Password
              </a>
            </div>
            
            <div class="alert">
              <p><strong>⏰ This link expires on:</strong></p>
              <p class="urgency">${expiryDate} at ${expiryTime}</p>
              <p>You have <strong>1 hour</strong> from the time this email was sent to use this link.</p>
            </div>
            
            <h3>🛡️ Security Information:</h3>
            <ul>
              <li><strong>One-time use:</strong> This link can only be used once</li>
              <li><strong>Secure:</strong> The link contains a unique, encrypted token</li>
              <li><strong>Time-limited:</strong> Link automatically expires after 1 hour</li>
              <li><strong>Account protection:</strong> Previous reset requests are invalidated</li>
            </ul>
            
            <div class="security-warning">
              <h3>⚠️ Didn't request this reset?</h3>
              <p>If you did not request a password reset, please ignore this email. Your account remains secure and no changes will be made.</p>
              <p><strong>Consider:</strong></p>
              <ul>
                <li>Reviewing your account security settings</li>
                <li>Checking for any suspicious activity</li>
                <li>Contacting your administrator if you have concerns</li>
              </ul>
            </div>
            
            <h3>🔗 Can't click the button?</h3>
            <p>Copy and paste this link into your browser:</p>
            <div class="code-block">${resetUrl}</div>
            
            <h3>📞 Need Help?</h3>
            <p>If you're having trouble resetting your password or have security concerns, please contact your system administrator.</p>
            
            <div class="footer">
              <p><strong>Important:</strong> This email contains a secure password reset link. Keep it confidential.</p>
              <p><strong>TimeWise System</strong> - Internal Timesheet Management</p>
              <p><small>© ${new Date().getFullYear()} TimeWise - This is a system-generated security email</small></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
TimeWise Password Reset Request

Hello ${userName},

We received a request to reset the password for your TimeWise account.

To reset your password, visit this link:
${resetUrl}

IMPORTANT DETAILS:
- This link expires on ${expiryDate} at ${expiryTime}
- You have 1 hour from when this email was sent
- This link can only be used once
- Previous reset requests are now invalidated

SECURITY NOTICE:
If you did not request this password reset, please ignore this email. Your account remains secure and no changes will be made.

If you can't click the link, copy and paste this URL into your browser:
${resetUrl}

Need help? Contact your system administrator.

TimeWise System - Internal Timesheet Management
This is a system-generated security email.
    `;

    return { subject, html, text };
  }
}

export const emailService = new EmailService();
export default emailService;