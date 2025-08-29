import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import WorkLog from '@/lib/models/WorkLog';
import User from '@/lib/models/User';
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { convertHoursInput } from '@/lib/time-utils';

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
        hours: workLog.hoursSpent,
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

    // Permission check with rolling 6-day window enforcement
    const canEdit = workLog.canEdit(authUser.userId, authUser.role);
    if (!canEdit) {
      if (authUser.role !== 'Admin' && workLog.userId === authUser.userId) {
        return createErrorResponse('Edit window expired. You can only edit entries within the last 6 days (rolling window).', 403);
      } else {
        return createErrorResponse('Access denied', 403);
      }
    }

    const { date, verticle, country, task, hoursSpent } = await request.json();

    // Validate 6-day rule if date is being changed
    if (date) {
      const newDate = new Date(date);
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
      if (!['CMIS', 'TRI', 'LOF', 'TRG'].includes(verticle)) {
        return createErrorResponse('Invalid verticle specified', 400);
      }
      workLog.verticle = verticle;
    }
    if (country) workLog.country = country.trim();
    if (task) workLog.task = task.trim();
    if (hoursSpent !== undefined) {
      let convertedHours;
      try {
        convertedHours = convertHoursInput(parseFloat(hoursSpent.toString()));
      } catch (error: any) {
        return createErrorResponse(error.message, 400);
      }
      
      if (convertedHours < 0.5 || convertedHours > 24) {
        return createErrorResponse('Hours must be between 0.5 and 24', 400);
      }

      // Check daily 24-hour limit for updated entry
      const checkDate = date ? new Date(date) : workLog.date;
      const startOfDay = new Date(checkDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(checkDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existingLogs = await WorkLog.find({
        userId: authUser.userId,
        date: { $gte: startOfDay, $lte: endOfDay },
        logId: { $ne: params.id } // Exclude current entry being updated
      });

      const totalHoursForDay = existingLogs.reduce((sum, log) => sum + log.hoursSpent, 0);
      
      if (totalHoursForDay + convertedHours > 24) {
        return createErrorResponse(`Cannot exceed 24 hours per day. Current total (excluding this entry): ${totalHoursForDay} hours. Attempting to set: ${convertedHours} hours.`, 400);
      }

      workLog.hoursSpent = convertedHours;
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
        hours: workLog.hoursSpent,
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

    // Only admins can reject entries
    if (authUser.role !== 'Admin') {
      return createErrorResponse('Only administrators can reject entries', 403);
    }

    const workLog = await WorkLog.findOne({ logId: params.id });
    if (!workLog) {
      return createErrorResponse('Work log not found', 404);
    }

    // Delete the entry instead of marking as rejected
    const deletedLog = await WorkLog.findOneAndDelete({ logId: params.id });
    
    console.log('Work log deleted by admin:', {
      id: deletedLog.logId,
      userId: deletedLog.userId,
      date: deletedLog.date,
      hours: deletedLog.hoursSpent,
      deletedBy: authUser.userId,
      deletedAt: new Date()
    });

    return createSuccessResponse('Work log deleted successfully');
  } catch (error) {
    console.error('Reject work log error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}