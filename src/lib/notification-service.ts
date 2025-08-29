import dbConnect from './mongodb';
import User from './models/User';
import WorkLog from './models/WorkLog';
import NotificationLog from './models/NotificationLog';
import Leave from './models/Leave';
import { emailService } from './email';

interface MissingEntryInfo {
  userId: string;
  userName: string;
  userEmail: string;
  missingDates: Date[];
  daysRemaining: number;
}

interface NotificationResult {
  userId: string;
  userName: string;
  userEmail: string;
  success: boolean;
  error?: string;
  missingDates: Date[];
  daysRemaining: number;
  skipped?: boolean;
  skipReason?: string;
}

class NotificationService {
  
  /**
   * Get all business days between two dates (excluding weekends and leave dates)
   */
  private async getBusinessDays(startDate: Date, endDate: Date): Promise<Date[]> {
    const businessDays: Date[] = [];
    const current = new Date(startDate);
    
    // Get all leave dates in the range
    const leaveDates = await Leave.getLeaveDatesInRange(startDate, endDate);
    const leaveDateStrings = new Set(
      leaveDates.map(date => date.toISOString().split('T')[0])
    );
    
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      const dateString = current.toISOString().split('T')[0];
      
      // 0 = Sunday, 6 = Saturday, so exclude weekends and leave dates
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !leaveDateStrings.has(dateString)) {
        businessDays.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }
    
    return businessDays;
  }

  /**
   * Calculate days remaining for a given date based on the 6-day rule
   */
  private calculateDaysRemaining(workDate: Date): number {
    const now = new Date();
    const daysDifference = Math.floor((now.getTime() - workDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, 6 - daysDifference);
  }

  /**
   * Check for users with missing timesheet entries
   * Prioritizes recent missing entries, especially yesterday's entry
   */
  async checkForMissingEntries(): Promise<MissingEntryInfo[]> {
    await dbConnect();

    try {
      // Get all active users (excluding admins as they don't need to fill timesheets)
      const users = await User.find({ 
        isActive: true,
        role: 'User' // Only check regular users, admins are optional
      }).lean();

      const missingEntriesInfo: MissingEntryInfo[] = [];

      // Define the date range for checking (last 6 business days)
      const today = new Date();
      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(today.getDate() - 6);
      
      // Special focus on yesterday for immediate notification
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      for (const user of users) {
        // Get business days in the last 6 days (excluding leave dates)
        const businessDays = await this.getBusinessDays(sixDaysAgo, today);
        
        // Get existing work logs for this user in the date range
        const existingLogs = await WorkLog.find({
          userId: user.userId,
          date: { 
            $gte: sixDaysAgo, 
            $lte: today 
          }
        }).lean();

        // Create a set of dates that have entries
        const loggedDates = new Set(
          existingLogs.map(log => log.date.toISOString().split('T')[0])
        );

        // Find missing business days, prioritizing yesterday
        const missingDates: Date[] = [];
        const yesterdayString = yesterday.toISOString().split('T')[0];
        const isYesterdayBusinessDay = yesterday.getDay() !== 0 && yesterday.getDay() !== 6;
        const isYesterdayLeave = await Leave.isLeaveDay(yesterday);
        
        // First check if yesterday is missing (priority check)
        if (isYesterdayBusinessDay && !isYesterdayLeave && !loggedDates.has(yesterdayString)) {
          const daysRemaining = this.calculateDaysRemaining(yesterday);
          if (daysRemaining > 0) {
            missingDates.push(yesterday);
          }
        }
        
        // Then check other business days in the window
        for (const businessDay of businessDays) {
          const dateString = businessDay.toISOString().split('T')[0];
          // Skip yesterday as we already checked it
          if (dateString === yesterdayString) continue;
          
          if (!loggedDates.has(dateString)) {
            // Only include dates that still have time remaining (not expired)
            const daysRemaining = this.calculateDaysRemaining(businessDay);
            if (daysRemaining > 0) {
              missingDates.push(businessDay);
            }
          }
        }

        // If user has missing entries, add to the list
        if (missingDates.length > 0) {
          // Calculate minimum days remaining (most urgent date)
          const daysRemainingList = missingDates.map(date => this.calculateDaysRemaining(date));
          const minDaysRemaining = Math.min(...daysRemainingList);

          missingEntriesInfo.push({
            userId: user.userId,
            userName: user.name,
            userEmail: user.email,
            missingDates: missingDates.sort((a, b) => a.getTime() - b.getTime()), // Sort by date
            daysRemaining: minDaysRemaining
          });
        }
      }

      return missingEntriesInfo;
    } catch (error) {
      console.error('Error checking for missing entries:', error);
      return [];
    }
  }

  /**
   * Send notifications to users with missing entries
   */
  async sendMissingEntryNotifications(
    missingEntriesInfo?: MissingEntryInfo[],
    forceResend: boolean = false
  ): Promise<NotificationResult[]> {
    await dbConnect();

    try {
      // If not provided, check for missing entries
      if (!missingEntriesInfo) {
        missingEntriesInfo = await this.checkForMissingEntries();
      }

      const results: NotificationResult[] = [];

      for (const userInfo of missingEntriesInfo) {
        try {
          // Check if notification was already sent today (unless force resend)
          if (!forceResend) {
            const alreadySent = await NotificationLog.wasNotificationSentToday(
              userInfo.userId,
              'missing_timesheet',
              userInfo.missingDates
            );

            if (alreadySent) {
              results.push({
                ...userInfo,
                success: true,
                skipped: true,
                skipReason: 'Notification already sent today for the same missing dates'
              });
              continue;
            }
          }

          // Generate email content
          const emailContent = emailService.generateMissingTimesheetEmail(
            userInfo.userName,
            userInfo.missingDates,
            userInfo.daysRemaining
          );

          // Send email
          const emailSent = await emailService.sendEmail({
            to: userInfo.userEmail,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text
          });

          // Log the notification attempt
          await NotificationLog.createNotification({
            userId: userInfo.userId,
            userEmail: userInfo.userEmail,
            userName: userInfo.userName,
            notificationType: 'missing_timesheet',
            missingDates: userInfo.missingDates,
            daysRemaining: userInfo.daysRemaining,
            emailSent,
            emailError: emailSent ? undefined : 'Email sending failed'
          });

          results.push({
            ...userInfo,
            success: emailSent,
            error: emailSent ? undefined : 'Failed to send email'
          });

        } catch (error: any) {
          console.error(`Error sending notification to ${userInfo.userEmail}:`, error);
          
          // Log failed notification
          try {
            await NotificationLog.createNotification({
              userId: userInfo.userId,
              userEmail: userInfo.userEmail,
              userName: userInfo.userName,
              notificationType: 'missing_timesheet',
              missingDates: userInfo.missingDates,
              daysRemaining: userInfo.daysRemaining,
              emailSent: false,
              emailError: error.message
            });
          } catch (logError) {
            console.error('Error logging failed notification:', logError);
          }

          results.push({
            ...userInfo,
            success: false,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error sending missing entry notifications:', error);
      return [];
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(days: number = 30): Promise<{
    totalNotifications: number;
    successfulNotifications: number;
    failedNotifications: number;
    notificationsByType: any[];
    recentNotifications: any[];
  }> {
    await dbConnect();

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const totalNotifications = await NotificationLog.countDocuments({
        createdAt: { $gte: startDate }
      });

      const successfulNotifications = await NotificationLog.countDocuments({
        createdAt: { $gte: startDate },
        emailSent: true
      });

      const failedNotifications = totalNotifications - successfulNotifications;

      const notificationsByType = await NotificationLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$notificationType',
            count: { $sum: 1 },
            successful: { $sum: { $cond: ['$emailSent', 1, 0] } }
          }
        }
      ]);

      const recentNotifications = await NotificationLog.find({
        createdAt: { $gte: startDate }
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      return {
        totalNotifications,
        successfulNotifications,
        failedNotifications,
        notificationsByType,
        recentNotifications
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        totalNotifications: 0,
        successfulNotifications: 0,
        failedNotifications: 0,
        notificationsByType: [],
        recentNotifications: []
      };
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;