import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createErrorResponse('Authentication required', 401);
    }

    // Get fresh user data from database
    const user = await User.findOne({ userId: authUser.userId, isActive: true });
    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    return createSuccessResponse('User data retrieved', {
      user: {
        id: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}