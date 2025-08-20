import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import WorkLog from '@/lib/models/WorkLog';
import User from '@/lib/models/User';
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from '@/lib/auth';

// GET /api/worklogs - Get work logs (filtered by user role)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createErrorResponse('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    let query: any = {};
    
    // Users can only see their own work logs, Admins can see all
    if (authUser.role !== 'Admin') {
      query.userId = authUser.userId;
    }

    // Optional filters
    const verticleFilter = searchParams.get('verticle');
    if (verticleFilter && ['CMIS', 'TRI', 'LOF', 'TRG'].includes(verticleFilter)) {
      query.verticle = verticleFilter;
    }

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Get work logs with user information
    const workLogs = await WorkLog.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get user information for each work log
    const userIds = [...new Set(workLogs.map(log => log.userId))];
    const users = await User.find({ userId: { $in: userIds } }).select('userId name email role').lean();
    const userMap = new Map(users.map(user => [user.userId, user]));

    // Enrich work logs with user data and permission info
    const enrichedWorkLogs = workLogs.map(log => {
      const user = userMap.get(log.userId);
      const canEdit = authUser.role === 'Admin' || 
        (log.userId === authUser.userId && 
         Math.floor((Date.now() - new Date(log.createdAt).getTime()) / (1000 * 60 * 60 * 24)) <= 2);
      
      return {
        id: log.logId,
        date: log.date,
        verticle: log.verticle,
        country: log.country,
        task: log.task,
        hours: log.hoursSpent,
        employeeId: log.userId,
        employeeName: user?.name || 'Unknown',
        employeeEmail: user?.email || '',
        employeeRole: user?.role || 'User',
        createdAt: log.createdAt,
        updatedAt: log.updatedAt,
        canEdit,
        canDelete: canEdit, // Same permissions for delete
      };
    });

    const totalCount = await WorkLog.countDocuments(query);

    return createSuccessResponse('Work logs retrieved successfully', {
      workLogs: enrichedWorkLogs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Get work logs error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// POST /api/worklogs - Create new work log
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createErrorResponse('Authentication required', 401);
    }

    const { date, verticle, country, task, hoursSpent } = await request.json();

    // Validation
    if (!date || !verticle || !country || !task || hoursSpent === undefined) {
      return createErrorResponse('All fields are required', 400);
    }

    if (!['CMIS', 'TRI', 'LOF', 'TRG'].includes(verticle)) {
      return createErrorResponse('Invalid verticle specified', 400);
    }

    if (hoursSpent < 0.5 || hoursSpent > 24) {
      return createErrorResponse('Hours must be between 0.5 and 24', 400);
    }

    // Create new work log
    const workLog = new WorkLog({
      userId: authUser.userId,
      date: new Date(date),
      verticle,
      country: country.trim(),
      task: task.trim(),
      hoursSpent: parseFloat(hoursSpent.toString()),
    });

    await workLog.save();

    // Get user info for response
    const user = await User.findOne({ userId: authUser.userId }).select('name email role').lean() as any;

    return createSuccessResponse('Work log created successfully', {
      workLog: {
        id: workLog.logId,
        date: workLog.date,
        verticle: workLog.verticle,
        country: workLog.country,
        task: workLog.task,
        hours: workLog.hoursSpent,
        employeeId: workLog.userId,
        employeeName: user?.name || authUser.name,
        employeeEmail: user?.email || authUser.email,
        employeeRole: user?.role || authUser.role,
        createdAt: workLog.createdAt,
        updatedAt: workLog.updatedAt,
        canEdit: true,
        canDelete: true,
      },
    });
  } catch (error: any) {
    console.error('Create work log error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return createErrorResponse(messages.join('. '), 400);
    }

    return createErrorResponse('Internal server error', 500);
  }
}