import { NextRequest } from 'next/server';
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from '@/lib/auth/index';
import dbConnect from '@/lib/database/mongodb';
import NotificationLog from '@/lib/models/NotificationLog';

// POST /api/mail-system/clear-notifications - Clear all notification logs
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createErrorResponse('Authentication required', 401);
    }

    // Only Developer can clear notifications
    if (authUser.role !== 'Developer') {
      return createErrorResponse('Developer access required', 403);
    }

    await dbConnect();

    const { clearAll } = await request.json();

    if (clearAll) {
      // Clear all notification logs
      const result = await NotificationLog.deleteMany({});

      console.log(`🗑️ All notification logs cleared by ${authUser.name} (${authUser.userId})`);
      console.log(`📊 Deleted ${result.deletedCount} notification records`);

      return createSuccessResponse(
        'All notification logs cleared successfully',
        {
          deletedCount: result.deletedCount,
          clearedBy: authUser.name,
          clearedAt: new Date().toISOString(),
        }
      );
    } else {
      // Clear only unsent/failed notifications
      const result = await NotificationLog.deleteMany({
        emailSent: false,
      });

      console.log(`🗑️ Failed notification logs cleared by ${authUser.name} (${authUser.userId})`);
      console.log(`📊 Deleted ${result.deletedCount} failed notification records`);

      return createSuccessResponse(
        'Failed notification logs cleared successfully',
        {
          deletedCount: result.deletedCount,
          clearedBy: authUser.name,
          clearedAt: new Date().toISOString(),
        }
      );
    }

  } catch (error: any) {
    console.error('Clear notifications error:', error);
    return createErrorResponse(error.message || 'Internal server error', 500);
  }
}
