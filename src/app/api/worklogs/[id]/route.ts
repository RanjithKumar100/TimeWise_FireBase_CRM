import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import WorkLog from '@/lib/models/WorkLog';
import User from '@/lib/models/User';
import NotificationLog from '@/lib/models/NotificationLog';
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { parseAPIDate } from '@/lib/date-utils';
import fs from 'fs';
import path from 'path';

// Helper function to read system config
const readSystemConfig = () => {
  try {
    const configFilePath = path.join(process.cwd(), 'system-config.json');
    if (fs.existsSync(configFilePath)) {
      const data = fs.readFileSync(configFilePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading system config in worklog route:', error);
  }

  // Return default config if file doesn't exist or error occurs
  return {
    editTimeLimit: 3, // Default 3 days
  };
};

// GET /api/worklogs/[id] - Get specific work log
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createErrorResponse('Authentication required', 401);
    }

    const workLog = await WorkLog.findOne({ logId: params.id }).lean() as any;
    if (!workLog) {
      return createErrorResponse('Work log not found', 404);
    }

    // Permission check: Users can only access their own logs, Admins can access all
    if (authUser.role !== 'Admin' && workLog.userId !== authUser.userId) {
      return createErrorResponse('Access denied', 403);
    }

    // Get user info
    const user = await User.findOne({ userId: workLog.userId }).select('name email role').lean() as any;
    const canEdit = workLog.canEdit(authUser.userId, authUser.role);

    return createSuccessResponse('Work log retrieved successfully', {
      workLog: {
        id: workLog.logId,
        date: workLog.date,
        verticle: workLog.verticle,
        country: workLog.country,
        task: workLog.task,
        taskDescription: workLog.taskDescription,
        hours: workLog.hours + (workLog.minutes / 60), // Calculate decimal hours for compatibility
        timeHours: workLog.hours, // Separate hours field
        timeMinutes: workLog.minutes, // Separate minutes field
        employeeId: workLog.userId,
        employeeName: user?.name || 'Unknown',
        employeeEmail: user?.email || '',
        employeeRole: user?.role || 'User',
        createdAt: workLog.createdAt,
        updatedAt: workLog.updatedAt,
        canEdit,
        canDelete: canEdit,
      },
    });
  } catch (error) {
    console.error('Get work log error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// PUT /api/worklogs/[id] - Update work log with 2-day restriction
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createErrorResponse('Authentication required', 401);
    }

    const workLog = await WorkLog.findOne({ logId: params.id });
    if (!workLog) {
      return createErrorResponse('Work log not found', 404);
    }

    // Permission check with rolling edit window enforcement
    const canEdit = workLog.canEdit(authUser.userId, authUser.role);
    if (!canEdit) {
      if (authUser.role !== 'Admin' && workLog.userId === authUser.userId) {
        const systemConfig = readSystemConfig();
        const editTimeLimit = systemConfig.editTimeLimit || 3;
        return createErrorResponse(`Edit window expired. You can only edit entries within the last ${editTimeLimit} days (rolling window).`, 403);
      } else {
        return createErrorResponse('Access denied', 403);
      }
    }

    const { date, verticle, country, task, taskDescription, hours, minutes } = await request.json();

    // Validate edit window rule if date is being changed
    if (date) {
      const newDate = parseAPIDate(date);
      const validation = WorkLog.validateSixDayWindow(newDate, authUser.role);
      if (!validation.isValid) {
        return createErrorResponse(validation.message || 'Invalid date', 400);
      }

      // Validate that the new date is not a leave day
      const leaveValidation = await WorkLog.validateLeaveDay(newDate, authUser.role);
      if (!leaveValidation.isValid) {
        return createErrorResponse(leaveValidation.message || 'Cannot create entries on leave days', 400);
      }

      workLog.date = newDate;
    }

    // Validation
    if (verticle) {
      // Get system config for verticle validation
      const systemConfig = readSystemConfig();
      if (!systemConfig.availableVerticles || !systemConfig.availableVerticles.includes(verticle)) {
        return createErrorResponse('Invalid verticle specified', 400);
      }
      workLog.verticle = verticle;
    }
    if (country) workLog.country = country.trim();
    if (task) workLog.task = task.trim();
    if (taskDescription !== undefined) {
      if (taskDescription.trim().length === 0) {
        return createErrorResponse('Task description cannot be empty', 400);
      }
      // Validate 3-word minimum for taskDescription
      const wordCount = taskDescription.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
      if (wordCount < 3) {
        return createErrorResponse('Task description must contain at least 3 words', 400);
      }
      workLog.taskDescription = taskDescription.trim();
    }
    // Handle time updates
    if (hours !== undefined && minutes !== undefined) {
      const finalHours = Math.floor(Number(hours));
      const finalMinutes = Math.floor(Number(minutes));

      // Validate ranges
      if (finalHours < 0 || finalHours > 24 || finalMinutes < 0 || finalMinutes > 59) {
        return createErrorResponse('Invalid time format. Hours: 0-24, Minutes: 0-59', 400);
      }

      // Validate minimum time (30 minutes)
      const totalMinutes = (finalHours * 60) + finalMinutes;
      if (totalMinutes < 30) {
        return createErrorResponse('Minimum time is 30 minutes', 400);
      }

      // Calculate total time in decimal hours for validation
      const convertedHours = Math.round((finalHours + (finalMinutes / 60)) * 100) / 100;

      if (convertedHours > 24) {
        return createErrorResponse('Hours cannot exceed 24 per day', 400);
      }

      // Check daily 24-hour limit for updated entry
      const checkDate = date ? parseAPIDate(date) : workLog.date;
      const startOfDay = new Date(checkDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(checkDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existingLogs = await WorkLog.find({
        userId: authUser.userId,
        date: { $gte: startOfDay, $lte: endOfDay },
        logId: { $ne: params.id }, // Exclude current entry being updated
        status: 'approved' // Only count approved entries for daily limit
      });

      const totalHoursForDay = existingLogs.reduce((sum, log) => {
        // Calculate decimal hours from hours and minutes
        return sum + (log.hours + (log.minutes / 60));
      }, 0);

      if (totalHoursForDay + convertedHours > 24) {
        return createErrorResponse(`Cannot exceed 24 hours per day. Current total (excluding this entry): ${totalHoursForDay} hours. Attempting to set: ${convertedHours} hours.`, 400);
      }

      workLog.hours = finalHours;
      workLog.minutes = finalMinutes;
    }

    workLog.updatedAt = new Date();
    await workLog.save();

    // Get user info for response
    const user = await User.findOne({ userId: workLog.userId }).select('name email role').lean() as any;

    return createSuccessResponse('Work log updated successfully', {
      workLog: {
        id: workLog.logId,
        date: workLog.date,
        verticle: workLog.verticle,
        country: workLog.country,
        task: workLog.task,
        taskDescription: workLog.taskDescription,
        hours: workLog.hours + (workLog.minutes / 60), // Calculate decimal hours for compatibility
        timeHours: workLog.hours, // Separate hours field
        timeMinutes: workLog.minutes, // Separate minutes field
        employeeId: workLog.userId,
        employeeName: user?.name || 'Unknown',
        employeeEmail: user?.email || '',
        employeeRole: user?.role || 'User',
        createdAt: workLog.createdAt,
        updatedAt: workLog.updatedAt,
        canEdit: workLog.canEdit(authUser.userId, authUser.role),
        canDelete: workLog.canEdit(authUser.userId, authUser.role),
      },
    });
  } catch (error: any) {
    console.error('Update work log error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return createErrorResponse(messages.join('. '), 400);
    }

    return createErrorResponse('Internal server error', 500);
  }
}

// DELETE /api/worklogs/[id] - Reject work log (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createErrorResponse('Authentication required', 401);
    }

    // Only admins can reject entries (soft delete)
    if (authUser.role !== 'Admin') {
      return createErrorResponse('Only administrators can reject entries', 403);
    }

    const workLog = await WorkLog.findOne({ logId: params.id });
    if (!workLog) {
      return createErrorResponse('Work log not found', 404);
    }

    // Mark entry as rejected instead of deleting
    const rejectedLog = await WorkLog.findOneAndUpdate(
      { logId: params.id },
      { status: 'rejected' },
      { new: true }
    );
    
    if (!rejectedLog) {
      return createErrorResponse('Work log not found or already rejected', 404);
    }
    
    // Create notification for the user
    try {
      const notification = await NotificationLog.create({
        userId: rejectedLog.userId,
        userEmail: rejectedLog.userEmail,
        userName: rejectedLog.userName,
        notificationType: 'entry_rejected',
        rejectedEntry: {
          entryId: rejectedLog.logId,
          date: rejectedLog.date,
          task: rejectedLog.task,
          hours: rejectedLog.hours,
          minutes: rejectedLog.minutes,
          rejectedBy: authUser.userId,
          rejectedByName: authUser.name || 'Admin'
        },
        sentAt: new Date(),
        emailSent: false,
        isRead: false  // Explicitly set to ensure it appears in notifications
      });
      
      console.log('✅ Rejection notification created:', notification.notificationId, 'for user:', rejectedLog.userId);
    } catch (notificationError) {
      console.error('❌ Failed to create rejection notification:', notificationError);
      // Don't fail the rejection if notification creation fails
    }

    console.log('Work log rejected by admin:', {
      id: rejectedLog.logId,
      userId: rejectedLog.userId,
      date: rejectedLog.date,
      hours: rejectedLog.hours,
      minutes: rejectedLog.minutes,
      status: rejectedLog.status,
      rejectedBy: authUser.userId,
      rejectedAt: new Date()
    });

    return createSuccessResponse('Work log rejected successfully', {
      workLog: {
        id: rejectedLog.logId,
        status: rejectedLog.status,
        date: rejectedLog.date,
        userId: rejectedLog.userId,
        userName: rejectedLog.userName,
      }
    });
  } catch (error) {
    console.error('Reject work log error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// PATCH /api/worklogs/[id] - Permanent delete of rejected entries (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createErrorResponse('Authentication required', 401);
    }

    // Only admins can permanently delete entries
    if (authUser.role !== 'Admin') {
      return createErrorResponse('Only administrators can permanently delete entries', 403);
    }

    const body = await request.json();
    const { action } = body;

    if (action !== 'permanent_delete') {
      return createErrorResponse('Invalid action. Only permanent_delete is supported.', 400);
    }

    // Find the entry and ensure it's rejected
    const workLog = await WorkLog.findOne({ logId: params.id });
    if (!workLog) {
      return createErrorResponse('Work log not found', 404);
    }

    if (workLog.status !== 'rejected') {
      return createErrorResponse('Only rejected entries can be permanently deleted', 400);
    }

    // Permanently delete the entry
    const deletedLog = await WorkLog.findOneAndDelete({ logId: params.id });
    
    if (!deletedLog) {
      return createErrorResponse('Work log not found or already deleted', 404);
    }
    
    console.log('Work log permanently deleted by admin:', {
      id: deletedLog.logId,
      userId: deletedLog.userId,
      date: deletedLog.date,
      hours: deletedLog.hours,
      minutes: deletedLog.minutes,
      status: deletedLog.status,
      deletedBy: authUser.userId,
      deletedAt: new Date()
    });

    return createSuccessResponse('Work log permanently deleted successfully', {
      workLog: {
        id: deletedLog.logId,
        date: deletedLog.date,
        userId: deletedLog.userId,
        userName: deletedLog.userName,
      }
    });
  } catch (error) {
    console.error('Permanent delete work log error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}