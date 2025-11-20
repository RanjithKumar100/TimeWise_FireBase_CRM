import * as cron from 'node-cron';
import { notificationService } from '../notification';
import Leave from '../../models/Leave';

class CronService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private isInitialized: boolean = false;

  initialize() {
    if (this.isInitialized) {
      console.log('Cron service already initialized');
      return;
    }

    try {
      // Only run cron jobs in production or when explicitly enabled
      const enableCron = process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true';
      
      if (!enableCron) {
        console.log('Cron jobs disabled. Set ENABLE_CRON=true to enable in development.');
        return;
      }

      this.setupDailyNotificationCheck();
      this.setupNextDayNotificationCheck();
      this.isInitialized = true;
      console.log('🕒 Cron service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize cron service:', error);
    }
  }

  private setupDailyNotificationCheck() {
    // Run every day at 9:00 AM to check for missing entries from previous day
    // This ensures users get notified the next day if they miss today's entry
    const cronExpression = '0 9 * * 1-6'; // Monday to Saturday at 9:00 AM (to cover Friday's missing entries on Saturday)
    
    const task = cron.schedule(cronExpression, async () => {
      console.log('🔔 Running daily missing timesheet check...');
      
      try {
        // Check for missing entries
        const missingEntries = await notificationService.checkForMissingEntries();
        
        if (missingEntries.length === 0) {
          console.log('✅ No missing timesheet entries found');
          return;
        }

        console.log(`📋 Found ${missingEntries.length} users with missing timesheet entries`);
        
        // Send notifications
        const results = await notificationService.sendMissingEntryNotifications(missingEntries);
        
        const successCount = results.filter(r => r.success && !r.skipped).length;
        const failedCount = results.filter(r => !r.success).length;
        const skippedCount = results.filter(r => r.skipped).length;
        
        console.log(`📧 Notification results:`, {
          total: results.length,
          sent: successCount,
          failed: failedCount,
          skipped: skippedCount
        });

        // Log detailed results for debugging
        if (failedCount > 0) {
          const failures = results.filter(r => !r.success);
          console.error('Failed notifications:', failures.map(f => ({
            user: f.userName,
            email: f.userEmail,
            error: f.error
          })));
        }

      } catch (error) {
        console.error('❌ Error in daily notification check:', error);
      }
    }, {
      timezone: process.env.TIMEZONE || 'America/New_York' // Adjust timezone as needed
    } as any);

    this.jobs.set('daily-notification-check', task);
    
    // Start the task
    task.start();
    console.log(`🕒 Daily notification check scheduled: ${cronExpression}`);
  }

  private setupNextDayNotificationCheck() {
    // Run every hour during business hours to catch missing entries from the previous day
    // This ensures immediate notification when users miss yesterday's entry
    const cronExpression = '0 8-18 * * 1-6'; // Every hour from 8 AM to 6 PM, Monday to Saturday
    
    const task = cron.schedule(cronExpression, async () => {
      console.log('⚡ Running hourly next-day missing timesheet check...');
      
      try {
        // Focus on yesterday's missing entries only
        const missingEntries = await notificationService.checkForMissingEntries();
        
        // Filter to only include yesterday's missing entries for immediate notification
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];
        
        // Check if yesterday was a leave day
        const isYesterdayLeave = await Leave.isLeaveDay(yesterday);
        
        if (isYesterdayLeave) {
          return; // Skip if yesterday was a leave day
        }
        
        const urgentMissingEntries = missingEntries.filter(entry => 
          entry.missingDates.some(date => 
            date.toISOString().split('T')[0] === yesterdayString
          )
        ).map(entry => ({
          ...entry,
          // Filter to only yesterday's date for this urgent notification
          missingDates: entry.missingDates.filter(date => 
            date.toISOString().split('T')[0] === yesterdayString
          )
        })).filter(entry => entry.missingDates.length > 0);
        
        if (urgentMissingEntries.length === 0) {
          return; // No urgent missing entries from yesterday
        }

        console.log(`⚠️ Found ${urgentMissingEntries.length} users with missing entries from yesterday`);
        
        // Send notifications for yesterday's missing entries
        const results = await notificationService.sendMissingEntryNotifications(urgentMissingEntries);
        
        const successCount = results.filter(r => r.success && !r.skipped).length;
        const failedCount = results.filter(r => !r.success).length;
        const skippedCount = results.filter(r => r.skipped).length;
        
        console.log(`⚡ Next-day notification results:`, {
          total: results.length,
          sent: successCount,
          failed: failedCount,
          skipped: skippedCount
        });

      } catch (error) {
        console.error('❌ Error in next-day notification check:', error);
      }
    }, {
      timezone: process.env.TIMEZONE || 'Asia/Kolkata'
    } as any);

    this.jobs.set('next-day-notification-check', task);
    
    // Start the task
    task.start();
    console.log(`⚡ Next-day notification check scheduled: ${cronExpression} (Hourly during business hours)`);
  }

  // Method to manually trigger the daily check (for testing)
  async triggerDailyCheck(): Promise<any> {
    console.log('🔔 Manually triggering daily missing timesheet check...');
    
    try {
      const missingEntries = await notificationService.checkForMissingEntries();
      
      if (missingEntries.length === 0) {
        return {
          success: true,
          message: 'No missing timesheet entries found',
          results: []
        };
      }

      const results = await notificationService.sendMissingEntryNotifications(missingEntries);
      
      const successCount = results.filter(r => r.success && !r.skipped).length;
      const failedCount = results.filter(r => !r.success).length;
      const skippedCount = results.filter(r => r.skipped).length;
      
      return {
        success: true,
        message: 'Daily check completed',
        summary: {
          total: results.length,
          sent: successCount,
          failed: failedCount,
          skipped: skippedCount
        },
        results
      };
    } catch (error) {
      console.error('Error in manual daily check:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        results: []
      };
    }
  }

  // Stop a specific cron job
  stopJob(jobName: string): boolean {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      console.log(`🛑 Stopped cron job: ${jobName}`);
      return true;
    }
    return false;
  }

  // Start a specific cron job
  startJob(jobName: string): boolean {
    const job = this.jobs.get(jobName);
    if (job) {
      job.start();
      console.log(`▶️ Started cron job: ${jobName}`);
      return true;
    }
    return false;
  }

  // Get status of all cron jobs
  getJobsStatus(): { [key: string]: boolean } {
    const status: { [key: string]: boolean } = {};
    for (const [name, job] of this.jobs) {
      status[name] = (job as any).running;
    }
    return status;
  }

  // Destroy all cron jobs
  destroy() {
    for (const [name, job] of this.jobs) {
      job.destroy();
      console.log(`🗑️ Destroyed cron job: ${name}`);
    }
    this.jobs.clear();
    this.isInitialized = false;
  }
}

export const cronService = new CronService();
export default cronService;