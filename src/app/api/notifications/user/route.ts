import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import NotificationLog from '@/lib/models/NotificationLog';
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from '@/lib/auth';

// GET /api/notifications/user - Get notifications for the current user
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createErrorResponse('Authentication required', 401);
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const skip = (page - 1) * limit;

    // Build query - only show unread notifications unless requested otherwise
    const query: any = { userId: authUser.userId };
    
    if (unreadOnly) {
      query.isRead = false;
    }
    
    // Get notifications for the user
    const notifications = await NotificationLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await NotificationLog.countDocuments(query);

    // Format notifications for frontend
    const formattedNotifications = notifications.map(notification => ({
      id: notification.notificationId,
      type: notification.notificationType,
      message: formatNotificationMessage(notification),
      date: notification.createdAt,
      isRead: notification.isRead || false,
      data: notification.notificationType === 'entry_rejected' ? notification.rejectedEntry : {
        missingDates: notification.missingDates,
        daysRemaining: notification.daysRemaining
      }
    }));

    return createSuccessResponse('User notifications retrieved successfully', {
      notifications: formattedNotifications,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount
      }
    });

  } catch (error) {
    console.error('Get user notifications error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// Helper function to format notification messages
function formatNotificationMessage(notification: any): string {
  switch (notification.notificationType) {
    case 'entry_rejected':
      const rejectedEntry = notification.rejectedEntry;
      return `Your timesheet entry for ${rejectedEntry.task} on ${new Date(rejectedEntry.date).toLocaleDateString()} (${rejectedEntry.hours}h) was rejected by ${rejectedEntry.rejectedByName}`;
    
    case 'missing_timesheet':
      const missingCount = notification.missingDates?.length || 0;
      return `You have ${missingCount} missing timesheet ${missingCount === 1 ? 'entry' : 'entries'}`;
    
    case 'deadline_reminder':
      return `Deadline reminder: Please complete your timesheet entries`;
    
    case 'urgent_reminder':
      return `Urgent: Complete your timesheet entries immediately`;
    
    default:
      return 'You have a new notification';
  }
}

// PATCH /api/notifications/user - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createErrorResponse('Authentication required', 401);
    }

    const body = await request.json();
    const { notificationIds, markAsRead = true } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return createErrorResponse('Invalid notification IDs provided', 400);
    }

    // Update notifications read status
    const updateData: any = { 
      isRead: markAsRead,
    };
    
    if (markAsRead) {
      updateData.readAt = new Date();
    }

    const result = await NotificationLog.updateMany(
      {
        notificationId: { $in: notificationIds },
        userId: authUser.userId
      },
      updateData
    );
    
    return createSuccessResponse('Notifications updated successfully', {
      updated: result.modifiedCount
    });

  } catch (error) {
    console.error('Update user notifications error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}