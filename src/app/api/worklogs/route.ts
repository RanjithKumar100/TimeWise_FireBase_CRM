import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import WorkLog from '@/lib/models/WorkLog';
import User from '@/lib/models/User';
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
    console.error('Error reading system config:', error);
  }
  
  // Return default config if file doesn't exist or error occurs
  return {
    maxHoursPerDay: 24,
    allowPastDateEntry: true,
    allowFutureDate: false,
    editTimeLimit: 2
  };
};

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

    // Check if personal-only mode is requested
    const personalOnly = searchParams.get('personalOnly') === 'true';

    // Users can only see their own work logs, Admins and Inspection can see all (unless personalOnly is requested)
    if ((authUser.role !== 'Admin' && authUser.role !== 'Inspection') || personalOnly) {
      query.userId = authUser.userId;
      // Users can see their own entries regardless of status (approved or rejected)
    } else {
      // Admins and Inspection viewing all users should only see approved entries
      query.$or = [
        { status: 'approved' },
        { status: { $exists: false } }
      ];
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

    console.log('Fetched work logs sample:', workLogs.length > 0 ? {
      id: workLogs[0].logId,
      date: workLogs[0].date,
      userId: workLogs[0].userId
    } : 'No logs found');

    // Enrich work logs with permission info (no need for user lookup since data is stored in log)
    const enrichedWorkLogs = workLogs.map(log => {
      // Use the rolling edit window logic from system config
      // Rejected entries cannot be edited by anyone (except admin can restore them)
      const canEdit = (log.status !== 'rejected') && (
        authUser.role === 'Admin' ||
        (log.userId === authUser.userId && (() => {
          const systemConfig = readSystemConfig();
          const editTimeLimit = systemConfig.editTimeLimit || 3; // Default to 3 days
          const now = new Date();
          const recordDate = new Date(log.date);
          const daysDifference = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysDifference >= 0 && daysDifference <= editTimeLimit;
        })())
      );
      
      return {
        id: log.logId,
        date: log.date,
        verticle: log.verticle,
        country: log.country,
        task: log.task,
        taskDescription: log.taskDescription,
        hours: log.hours + (log.minutes / 60), // Calculate decimal hours for compatibility
        timeHours: log.hours, // Separate hours field
        timeMinutes: log.minutes, // Separate minutes field
        status: log.status || 'approved', // Include status, default to approved for backward compatibility
        employeeId: log.userId,
        // Use stored user information (preserves historical data even if user is deleted)
        employeeName: log.userName || 'Unknown User',
        employeeEmail: log.userEmail || '',
        employeeRole: log.userRole || 'User',
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
    console.log('🔍 POST /api/worklogs - Starting request processing');
    
    try {
      await dbConnect();
      console.log('✅ Database connected successfully');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return createErrorResponse('Database connection failed', 500);
    }

    const authUser = await getAuthenticatedUser(request);
    console.log('🔍 Auth user:', authUser ? { userId: authUser.userId, role: authUser.role } : 'null');
    
    if (!authUser) {
      console.error('❌ Authentication failed - no user found');
      return createErrorResponse('Authentication required', 401);
    }

    let requestBody;
    try {
      requestBody = await request.json();
      console.log('🔍 API received worklog data:', JSON.stringify(requestBody, null, 2));
      console.log('🔍 Request body keys:', Object.keys(requestBody));
      console.log('🔍 Hours type:', typeof requestBody.hours, 'value:', requestBody.hours);
      console.log('🔍 Minutes type:', typeof requestBody.minutes, 'value:', requestBody.minutes);
    } catch (jsonError) {
      console.error('❌ Failed to parse JSON request body:', jsonError);
      return createErrorResponse('Invalid JSON in request body', 400);
    }
    
    const { date, verticle, country, task, taskDescription, hours, minutes } = requestBody;

    // Validation - require hours and minutes
    if (!date || !verticle || !country || !task || hours === undefined || minutes === undefined) {
      console.error('❌ Missing required fields:', {
        date: !!date,
        verticle: !!verticle,
        country: !!country,
        task: !!task,
        hours: hours !== undefined,
        minutes: minutes !== undefined
      });
      return createErrorResponse('Date, verticle, country, task, hours, and minutes are required', 400);
    }

    // Validate taskDescription separately with more specific error message
    if (!taskDescription || taskDescription.trim().length === 0) {
      console.error('❌ Task description validation failed:', { taskDescription, trimmedLength: taskDescription?.trim().length });
      return createErrorResponse('Task description is required', 400);
    }

    // Validate 3-word minimum for taskDescription
    const wordCount = taskDescription.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
    if (wordCount < 3) {
      console.error('❌ Task description word count validation failed:', { taskDescription, wordCount });
      return createErrorResponse('Task description must contain at least 3 words', 400);
    }

    if (!['CMIS', 'TRI', 'LOF', 'TRG'].includes(verticle)) {
      return createErrorResponse('Invalid verticle specified', 400);
    }

    // Validate and process hours and minutes
    const finalHours = Math.floor(Number(hours));
    const finalMinutes = Math.floor(Number(minutes));

    // Validate ranges
    if (finalHours < 0 || finalHours > 24 || finalMinutes < 0 || finalMinutes > 59) {
      return createErrorResponse('Invalid time format. Hours: 0-24, Minutes: 0-59', 400);
    }

    // Calculate total time in decimal hours for validation
    const convertedHours = Math.round((finalHours + (finalMinutes / 60)) * 100) / 100;

    // Get system config for validation
    const systemConfig = readSystemConfig();

    // Validate minimum time (30 minutes)
    const totalMinutes = (finalHours * 60) + finalMinutes;
    if (totalMinutes < 30) {
      return createErrorResponse('Minimum time is 30 minutes', 400);
    }

    if (convertedHours > systemConfig.maxHoursPerDay) {
      return createErrorResponse(`Hours cannot exceed ${systemConfig.maxHoursPerDay} per day`, 400);
    }

    // Validate edit window rule for data entry
    const recordDate = parseAPIDate(date);
    const validation = WorkLog.validateSixDayWindow(recordDate, authUser.role);
    if (!validation.isValid) {
      return createErrorResponse(validation.message || 'Invalid date', 400);
    }

    // Validate that the date is not a leave day
    const leaveValidation = await WorkLog.validateLeaveDay(recordDate, authUser.role);
    if (!leaveValidation.isValid) {
      return createErrorResponse(leaveValidation.message || 'Cannot create entries on leave days', 400);
    }

    // Check daily 24-hour limit
    const startOfDay = new Date(recordDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(recordDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingLogs = await WorkLog.find({
      userId: authUser.userId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: 'approved' // Only count approved entries for daily limit
    });

    const totalHoursForDay = existingLogs.reduce((sum, log) => {
      // Calculate decimal hours from hours and minutes
      return sum + (log.hours + (log.minutes / 60));
    }, 0);
    
    if (totalHoursForDay + convertedHours > systemConfig.maxHoursPerDay) {
      return createErrorResponse(`Cannot exceed ${systemConfig.maxHoursPerDay} hours per day. Current total: ${totalHoursForDay} hours. Attempting to add: ${convertedHours} hours.`, 400);
    }

    // Get user info for storing in WorkLog
    const user = await User.findOne({ userId: authUser.userId }).select('name email role').lean() as any;
    
    // Create new work log with user information stored for historical preservation
    const workLogData = {
      userId: authUser.userId,
      userName: user?.name || authUser.name,
      userEmail: user?.email || authUser.email,
      userRole: user?.role || authUser.role,
      date: recordDate,
      verticle,
      country: country.trim(),
      task: task.trim(),
      taskDescription: taskDescription.trim(),
      hours: finalHours,
      minutes: finalMinutes,
    };
    
    console.log('🔍 Creating WorkLog with data:', workLogData);
    
    const workLog = new WorkLog(workLogData);

    try {
      await workLog.save();
      console.log('✅ WorkLog saved successfully:', workLog.logId);
    } catch (saveError) {
      console.error('❌ Failed to save WorkLog:', saveError);
      throw saveError;
    }

    return createSuccessResponse('Work log created successfully', {
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
        employeeName: workLog.userName,
        employeeEmail: workLog.userEmail,
        employeeRole: workLog.userRole,
        createdAt: workLog.createdAt,
        updatedAt: workLog.updatedAt,
        canEdit: true,
        canDelete: true,
      },
    });
  } catch (error: any) {
    console.error('❌ Create work log error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error
    });
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      console.error('❌ Validation Error Details:', messages);
      return createErrorResponse(messages.join('. '), 400);
    }

    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      console.error('❌ Database Error:', error);
      return createErrorResponse('Database error occurred', 500);
    }

    // Generic error handler
    console.error('❌ Unhandled Error:', error);
    return createErrorResponse(`Internal server error: ${error.message || 'Unknown error'}`, 500);
  }
}