import { NextRequest } from 'next/server';
import { seedDatabase } from '@/lib/seed';
import { createErrorResponse, createSuccessResponse } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Only allow seeding in development
    if (process.env.NODE_ENV === 'production') {
      return createErrorResponse('Seeding not allowed in production', 403);
    }

    const result = await seedDatabase();
    
    return createSuccessResponse('Database seeded successfully', {
      usersCreated: result.users,
      workLogsCreated: result.workLogs,
      message: 'You can now login with the seeded user accounts',
    });
  } catch (error) {
    console.error('Seed API error:', error);
    return createErrorResponse('Failed to seed database', 500);
  }
}