import { NextRequest } from 'next/server';
import dbConnect from '@/lib/database/mongodb';
import AuditLog from '@/lib/models/AuditLog';
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from '@/lib/auth/index';

// GET /api/audit-logs - Get audit logs (Admin only)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createErrorResponse('Authentication required', 401);
    }

    if (authUser.role !== 'Admin') {
      return createErrorResponse('Admin access required', 403);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const performedByRole = searchParams.get('performedByRole');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build filter query
    const filter: any = {};
    
    if (action && action !== 'all') {
      filter.action = action;
    }
    
    if (entityType && entityType !== 'all') {
      filter.entityType = entityType;
    }
    
    if (performedByRole && performedByRole !== 'all') {
      filter.performedByRole = performedByRole;
    }
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await AuditLog.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // Get audit logs with pagination
    const auditLogs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Format the response
    const formattedLogs = auditLogs.map(log => ({
      logId: log.logId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      performedBy: log.performedBy,
      performedByName: log.performedByName,
      performedByRole: log.performedByRole,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt.toISOString(),
    }));

    return createSuccessResponse('Audit logs retrieved successfully', {
      auditLogs: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}