import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import WorkLog from '@/lib/models/WorkLog';
import User from '@/lib/models/User';
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from '@/lib/auth';

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
    const canEdit = authUser.role === 'Admin' || 
      (workLog.userId === authUser.userId && 
       Math.floor((Date.now() - new Date(workLog.createdAt).getTime()) / (1000 * 60 * 60 * 24)) <= 2);

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

    // Permission check with 2-day restriction enforcement
    const canEdit = workLog.canEdit(authUser.userId, authUser.role);
    if (!canEdit) {
      if (authUser.role !== 'Admin' && workLog.userId === authUser.userId) {
        return createErrorResponse('Edit window expired. You can only edit entries within 2 days of creation.', 403);
      } else {
        return createErrorResponse('Access denied', 403);
      }
    }

    const { date, verticle, country, task, hoursSpent } = await request.json();

    // Validation
    if (date) workLog.date = new Date(date);
    if (verticle) {
      if (!['CMIS', 'TRI', 'LOF', 'TRG'].includes(verticle)) {
        return createErrorResponse('Invalid verticle specified', 400);
      }
      workLog.verticle = verticle;
    }
    if (country) workLog.country = country.trim();
    if (task) workLog.task = task.trim();
    if (hoursSpent !== undefined) {
      const hours = parseFloat(hoursSpent.toString());
      if (hours < 0.5 || hours > 24) {
        return createErrorResponse('Hours must be between 0.5 and 24', 400);
      }
      workLog.hoursSpent = hours;
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

// DELETE /api/worklogs/[id] - Delete work log with 2-day restriction
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

    const workLog = await WorkLog.findOne({ logId: params.id });
    if (!workLog) {
      return createErrorResponse('Work log not found', 404);
    }

    // Permission check with 2-day restriction enforcement
    const canDelete = workLog.canEdit(authUser.userId, authUser.role);
    if (!canDelete) {
      if (authUser.role !== 'Admin' && workLog.userId === authUser.userId) {
        return createErrorResponse('Delete window expired. You can only delete entries within 2 days of creation.', 403);
      } else {
        return createErrorResponse('Access denied', 403);
      }
    }

    await WorkLog.deleteOne({ logId: params.id });

    return createSuccessResponse('Work log deleted successfully');
  } catch (error) {
    console.error('Delete work log error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}