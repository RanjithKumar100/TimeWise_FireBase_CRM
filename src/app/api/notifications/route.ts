import { NextRequest } from 'next/server';
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from '@/lib/auth/index';
import { notificationService } from '@/lib/services/notification/index';
import { emailService } from '@/lib/services/email/index';

// GET /api/notifications - Get notification statistics and recent notifications
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createErrorResponse('Authentication required', 401);
    }

    if (authUser.role !== 'Admin') {
      return createErrorResponse('Admin access required', 403);
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const action = searchParams.get('action');

    if (action === 'check-missing') {
      // Check for users with missing entries without sending notifications
      const missingEntries = await notificationService.checkForMissingEntries();
      
      return createSuccessResponse('Missing entries check completed', {
        missingEntries,
        totalUsersWithMissingEntries: missingEntries.length,
        emailConfigured: await emailService.verifyConnection()
      });
    }

    // Get notification statistics
    const stats = await notificationService.getNotificationStats(days);

    return createSuccessResponse('Notification statistics retrieved successfully', {
      stats,
      emailConfigured: await emailService.verifyConnection()
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// POST /api/notifications - Send notifications or perform notification actions
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createErrorResponse('Authentication required', 401);
    }

    if (authUser.role !== 'Admin') {
      return createErrorResponse('Admin access required', 403);
    }

    const { action, forceResend, userIds } = await request.json();

    if (action === 'send-missing-entry-notifications') {
      // Verify email configuration first
      const emailConfigured = await emailService.verifyConnection();
      if (!emailConfigured) {
        return createErrorResponse('Email service not configured or not working. Please check email settings.', 400);
      }

      // Check for missing entries
      let missingEntries = await notificationService.checkForMissingEntries();

      // Filter by specific user IDs if provided
      if (userIds && Array.isArray(userIds) && userIds.length > 0) {
        missingEntries = missingEntries.filter(entry => userIds.includes(entry.userId));
      }

      if (missingEntries.length === 0) {
        return createSuccessResponse('No users with missing timesheet entries found', {
          results: [],
          totalProcessed: 0,
          successCount: 0,
          failedCount: 0,
          skippedCount: 0
        });
      }

      // Send notifications
      const results = await notificationService.sendMissingEntryNotifications(
        missingEntries,
        forceResend || false
      );

      const successCount = results.filter(r => r.success && !r.skipped).length;
      const failedCount = results.filter(r => !r.success).length;
      const skippedCount = results.filter(r => r.skipped).length;

      return createSuccessResponse('Notification sending completed', {
        results,
        totalProcessed: results.length,
        successCount,
        failedCount,
        skippedCount,
        summary: {
          successful: `${successCount} notifications sent successfully`,
          failed: failedCount > 0 ? `${failedCount} notifications failed` : null,
          skipped: skippedCount > 0 ? `${skippedCount} notifications skipped (already sent today)` : null
        }
      });
    }

    if (action === 'test-email-config') {
      const emailConfigured = await emailService.verifyConnection();
      
      if (!emailConfigured) {
        return createErrorResponse('Email configuration test failed. Please check your email settings.', 400);
      }

      // Send test email to admin
      const testEmailContent = {
        subject: '🧪 TimeWise Email Configuration Test',
        html: `
          <h2>Email Configuration Test</h2>
          <p>This is a test email to verify that your TimeWise email configuration is working correctly.</p>
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Sent at: ${new Date().toLocaleString()}</li>
            <li>Sent by: ${authUser.name} (${authUser.email})</li>
            <li>System: TimeWise Notification Service</li>
          </ul>
          <p>✅ If you receive this email, your email configuration is working properly!</p>
        `,
        text: `
TimeWise Email Configuration Test

This is a test email to verify that your email configuration is working.
Sent at: ${new Date().toLocaleString()}
Sent by: ${authUser.name} (${authUser.email})

If you receive this email, your configuration is working properly!
        `
      };

      const emailSent = await emailService.sendEmail({
        to: authUser.email,
        ...testEmailContent
      });

      if (emailSent) {
        return createSuccessResponse('Test email sent successfully', {
          message: `Test email sent to ${authUser.email}`,
          timestamp: new Date().toISOString()
        });
      } else {
        return createErrorResponse('Failed to send test email', 500);
      }
    }

    return createErrorResponse('Invalid action specified', 400);

  } catch (error: any) {
    console.error('Send notifications error:', error);
    return createErrorResponse(error.message || 'Internal server error', 500);
  }
}