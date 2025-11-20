import { NextRequest } from 'next/server';
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from '@/lib/auth/index';
import dbConnect from '@/lib/database/mongodb';
import User from '@/lib/models/User';
import WorkLog from '@/lib/models/WorkLog';
import NotificationLog from '@/lib/models/NotificationLog';
import AuditLog from '@/lib/models/AuditLog';
import mongoose from 'mongoose';

// GET /api/monitoring - Get live system monitoring data
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createErrorResponse('Authentication required', 401);
    }

    // Only Developer can access monitoring
    if (authUser.role !== 'Developer') {
      return createErrorResponse('Developer access required', 403);
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '24h'; // 1h, 6h, 24h, 7d

    // Calculate time range
    const now = new Date();
    let startTime = new Date();
    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Get statistics
    const [
      totalUsers,
      activeUsers,
      totalWorklogs,
      recentWorklogs,
      totalNotifications,
      successfulNotifications,
      failedNotifications,
      recentNotifications,
      recentAuditLogs,
      emailActivityData,
      notificationTypeData,
    ] = await Promise.all([
      // User stats
      User.countDocuments(),
      User.countDocuments({ isActive: true }),

      // Worklog stats
      WorkLog.countDocuments(),
      WorkLog.countDocuments({ createdAt: { $gte: startTime } }),

      // Notification stats
      NotificationLog.countDocuments({ sentAt: { $gte: startTime } }),
      NotificationLog.countDocuments({ sentAt: { $gte: startTime }, emailSent: true }),
      NotificationLog.countDocuments({ sentAt: { $gte: startTime }, emailSent: false }),

      // Recent notifications (last 15)
      NotificationLog.find({ sentAt: { $gte: startTime } })
        .sort({ sentAt: -1 })
        .limit(15)
        .lean(),

      // Recent audit logs (last 10)
      AuditLog.find({ createdAt: { $gte: startTime } })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      // Email activity over time (hourly buckets)
      NotificationLog.aggregate([
        {
          $match: {
            sentAt: { $gte: startTime }
          }
        },
        {
          $group: {
            _id: {
              hour: { $hour: '$sentAt' },
              day: { $dayOfMonth: '$sentAt' },
              month: { $month: '$sentAt' },
              emailSent: '$emailSent'
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.month': 1, '_id.day': 1, '_id.hour': 1 }
        }
      ]),

      // Notification types distribution
      NotificationLog.aggregate([
        {
          $match: {
            sentAt: { $gte: startTime }
          }
        },
        {
          $group: {
            _id: '$notificationType',
            total: { $sum: 1 },
            successful: {
              $sum: { $cond: ['$emailSent', 1, 0] }
            },
            failed: {
              $sum: { $cond: ['$emailSent', 0, 1] }
            }
          }
        }
      ]),
    ]);

    // Calculate success rate
    const successRate = totalNotifications > 0
      ? ((successfulNotifications / totalNotifications) * 100).toFixed(1)
      : '100.0';

    // Format email activity data for chart
    const emailActivityChart = processEmailActivityData(emailActivityData, startTime, timeRange);

    // Format notification types for chart
    const notificationTypesChart = notificationTypeData.map(item => ({
      type: formatNotificationType(item._id),
      total: item.total,
      successful: item.successful,
      failed: item.failed,
    }));

    // Recent events (combine notifications and audit logs)
    const recentEvents = [
      ...recentNotifications.map(n => ({
        timestamp: n.sentAt,
        type: 'notification',
        description: `${n.emailSent ? '✅ SENT' : '🚫 BLOCKED'} to ${n.userName} - ${formatNotificationType(n.notificationType)}`,
        status: n.emailSent ? 'success' : 'failed',
        emailSent: n.emailSent,
      })),
      ...recentAuditLogs.map(a => ({
        timestamp: a.createdAt,
        type: 'audit',
        description: `${a.action} ${a.entityType} by ${a.performedByName}`,
        status: 'info',
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 15);

    // Database stats
    const dbStats = await mongoose.connection.db?.stats();

    // System metrics
    const systemMetrics = {
      timestamp: new Date().toISOString(),
      timeRange,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
        },
        worklogs: {
          total: totalWorklogs,
          recent: recentWorklogs,
        },
        notifications: {
          total: totalNotifications,
          successful: successfulNotifications,
          failed: failedNotifications,
          successRate: parseFloat(successRate),
        },
        database: {
          collections: dbStats?.collections || 0,
          dataSize: dbStats?.dataSize || 0,
          storageSize: dbStats?.storageSize || 0,
          indexes: dbStats?.indexes || 0,
        },
      },
      charts: {
        emailActivity: emailActivityChart,
        notificationTypes: notificationTypesChart,
      },
      recentEvents,
    };

    return createSuccessResponse('Monitoring data retrieved successfully', systemMetrics);

  } catch (error) {
    console.error('Get monitoring data error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// Helper function to format notification type
function formatNotificationType(type: string): string {
  const typeMap: Record<string, string> = {
    'missing_timesheet': 'Missing Timesheet',
    'deadline_reminder': 'Deadline Reminder',
    'urgent_reminder': 'Urgent Reminder',
    'entry_rejected': 'Entry Rejected',
  };
  return typeMap[type] || type;
}

// Helper function to process email activity data
function processEmailActivityData(data: any[], startTime: Date, timeRange: string) {
  const buckets: Record<string, { time: string; sent: number; failed: number }> = {};

  // Determine bucket size and format
  const bucketSize = timeRange === '1h' ? 5 : timeRange === '6h' ? 30 : 60; // minutes
  const now = new Date();
  const bucketCount = timeRange === '1h' ? 12 : timeRange === '6h' ? 12 : 24;

  // Initialize buckets
  for (let i = 0; i < bucketCount; i++) {
    const time = new Date(now.getTime() - (bucketCount - i) * bucketSize * 60 * 1000);
    const key = time.toISOString().substring(0, 16); // YYYY-MM-DDTHH:MM
    buckets[key] = {
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      sent: 0,
      failed: 0,
    };
  }

  // Fill buckets with data
  data.forEach(item => {
    const date = new Date(
      item._id.year || now.getFullYear(),
      (item._id.month || now.getMonth() + 1) - 1,
      item._id.day || now.getDate(),
      item._id.hour || 0,
      0
    );
    const key = date.toISOString().substring(0, 16);

    if (buckets[key]) {
      if (item._id.emailSent) {
        buckets[key].sent += item.count;
      } else {
        buckets[key].failed += item.count;
      }
    }
  });

  return Object.values(buckets);
}
