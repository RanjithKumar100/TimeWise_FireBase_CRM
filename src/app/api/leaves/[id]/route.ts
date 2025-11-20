import { NextRequest } from 'next/server';
import dbConnect from '@/lib/database/mongodb';
import Leave from '@/lib/models/Leave';
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from '@/lib/auth/index';

// DELETE /api/leaves/[id] - Delete a leave date
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

    // Only admins can delete leave dates
    if (authUser.role !== 'Admin') {
      return createErrorResponse('Admin access required', 403);
    }

    const { id } = params;

    if (!id) {
      return createErrorResponse('Leave ID is required', 400);
    }

    // Find and delete the leave date
    const deletedLeave = await Leave.findByIdAndDelete(id);

    if (!deletedLeave) {
      return createErrorResponse('Leave date not found', 404);
    }

    return createSuccessResponse('Leave date deleted successfully', {
      leave: deletedLeave,
    });
  } catch (error: any) {
    console.error('Delete leave error:', error);
    
    if (error.name === 'CastError') {
      return createErrorResponse('Invalid leave ID format', 400);
    }

    return createErrorResponse('Internal server error', 500);
  }
}

// GET /api/leaves/[id] - Get a specific leave date
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

    // Only admins can access leave management
    if (authUser.role !== 'Admin') {
      return createErrorResponse('Admin access required', 403);
    }

    const { id } = params;

    if (!id) {
      return createErrorResponse('Leave ID is required', 400);
    }

    const leave = await Leave.findById(id).lean();

    if (!leave) {
      return createErrorResponse('Leave date not found', 404);
    }

    return createSuccessResponse('Leave date retrieved successfully', {
      leave,
    });
  } catch (error: any) {
    console.error('Get leave error:', error);
    
    if (error.name === 'CastError') {
      return createErrorResponse('Invalid leave ID format', 400);
    }

    return createErrorResponse('Internal server error', 500);
  }
}