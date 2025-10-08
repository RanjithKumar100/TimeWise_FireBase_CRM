import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Leave from '@/lib/models/Leave';
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { parseAPIDate } from '@/lib/date-utils';

// GET /api/leaves - Get all leave dates
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createErrorResponse('Authentication required', 401);
    }

    // All authenticated users can view leave dates (needed for calendar views)
    // Only creating/deleting leaves requires admin access

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query: any = {};
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const leaves = await Leave.find(query)
      .sort({ date: 1 })
      .lean();

    return createSuccessResponse('Leave dates retrieved successfully', {
      leaves,
    });
  } catch (error) {
    console.error('Get leaves error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// POST /api/leaves - Create new leave date
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createErrorResponse('Authentication required', 401);
    }

    // Only admins can create leave dates
    if (authUser.role !== 'Admin') {
      return createErrorResponse('Admin access required', 403);
    }

    const { date, description } = await request.json();

    // Validation
    if (!date) {
      return createErrorResponse('Date is required', 400);
    }

    const leaveDate = parseAPIDate(date);
    
    // Validate date format
    if (isNaN(leaveDate.getTime())) {
      return createErrorResponse('Invalid date format', 400);
    }

    // Check if leave date already exists
    const existingLeave = await Leave.findOne({
      date: {
        $gte: new Date(leaveDate.toISOString().split('T')[0] + 'T00:00:00.000Z'),
        $lt: new Date(leaveDate.toISOString().split('T')[0] + 'T23:59:59.999Z'),
      },
    });

    if (existingLeave) {
      return createErrorResponse('Leave date already exists', 400);
    }

    // Create new leave date
    const leave = new Leave({
      date: leaveDate,
      description: description?.trim(),
      createdBy: authUser.userId,
    });

    await leave.save();

    return createSuccessResponse('Leave date created successfully', {
      leave,
    });
  } catch (error: any) {
    console.error('Create leave error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return createErrorResponse(messages.join('. '), 400);
    }

    if (error.code === 11000) {
      return createErrorResponse('Leave date already exists', 400);
    }

    return createErrorResponse('Internal server error', 500);
  }
}