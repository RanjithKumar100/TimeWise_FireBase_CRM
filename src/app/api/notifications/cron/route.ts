import { NextRequest } from 'next/server';
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { cronService } from '@/lib/cron-service';

// GET /api/notifications/cron - Get cron job status
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createErrorResponse('Authentication required', 401);
    }

    if (authUser.role !== 'Admin') {
      return createErrorResponse('Admin access required', 403);
    }

    const jobsStatus = cronService.getJobsStatus();
    const enableCron = process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true';

    return createSuccessResponse('Cron job status retrieved successfully', {
      enabled: enableCron,
      jobs: jobsStatus,
      timezone: process.env.TIMEZONE || 'America/New_York',
      environment: process.env.NODE_ENV,
      cronSchedule: '0 9 * * 1-5', // Monday to Friday at 9:00 AM
      cronDescription: 'Daily at 9:00 AM (Monday to Friday)'
    });

  } catch (error) {
    console.error('Get cron status error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// POST /api/notifications/cron - Manage cron jobs
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createErrorResponse('Authentication required', 401);
    }

    if (authUser.role !== 'Admin') {
      return createErrorResponse('Admin access required', 403);
    }

    const { action, jobName } = await request.json();

    switch (action) {
      case 'start':
        if (!jobName) {
          return createErrorResponse('Job name is required for start action', 400);
        }
        const started = cronService.startJob(jobName);
        if (started) {
          return createSuccessResponse(`Cron job '${jobName}' started successfully`);
        } else {
          return createErrorResponse(`Cron job '${jobName}' not found`, 404);
        }

      case 'stop':
        if (!jobName) {
          return createErrorResponse('Job name is required for stop action', 400);
        }
        const stopped = cronService.stopJob(jobName);
        if (stopped) {
          return createSuccessResponse(`Cron job '${jobName}' stopped successfully`);
        } else {
          return createErrorResponse(`Cron job '${jobName}' not found`, 404);
        }

      case 'trigger-daily-check':
        const result = await cronService.triggerDailyCheck();
        if (result.success) {
          return createSuccessResponse('Daily check triggered successfully', result);
        } else {
          return createErrorResponse(result.error || 'Daily check failed', 500);
        }

      case 'initialize':
        cronService.initialize();
        return createSuccessResponse('Cron service initialized successfully', {
          jobs: cronService.getJobsStatus()
        });

      default:
        return createErrorResponse('Invalid action. Valid actions: start, stop, trigger-daily-check, initialize', 400);
    }

  } catch (error: any) {
    console.error('Cron management error:', error);
    return createErrorResponse(error.message || 'Internal server error', 500);
  }
}