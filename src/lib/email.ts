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
  private transporter: nodemailer.Transporter;
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
              <p class="urgency">⏳ Time Remaining: ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} left to enter your timesheet data!</p>
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
              <li>You can only edit entries within 6 days of the work date</li>
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

Time Remaining: ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} left to enter your data!

Please log into the TimeWise system and complete your timesheet entries as soon as possible.

Login at: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/dashboard/user

Important: You can only edit entries within 6 days of the work date.

This is an automated reminder from the TimeWise system.
    `;

    return { subject, html, text };
  }
}

export const emailService = new EmailService();
export default emailService;