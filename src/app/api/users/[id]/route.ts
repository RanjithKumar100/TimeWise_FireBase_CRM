import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import WorkLog from '@/lib/models/WorkLog';
import AuditLog from '@/lib/models/AuditLog';
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from '@/lib/auth';

// GET /api/users/[id] - Get specific user (Admin only)
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

    if (authUser.role !== 'Admin') {
      return createErrorResponse('Admin access required', 403);
    }

    const user = await User.findOne({ userId: params.id }).select('-password').lean() as any;
    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    // Get user statistics
    const workLogCount = await WorkLog.countDocuments({ userId: params.id });
    const totalHours = await WorkLog.aggregate([
      { $match: { userId: params.id } },
      { $group: { _id: null, total: { $sum: '$hoursSpent' } } }
    ]);

    const userStats = {
      totalWorkLogs: workLogCount,
      totalHours: totalHours.length > 0 ? totalHours[0].total : 0,
      lastActivity: await WorkLog.findOne({ userId: params.id }).sort({ createdAt: -1 }).select('createdAt').lean()
    };

    return createSuccessResponse('User retrieved successfully', {
      user: {
        id: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      stats: userStats
    });
  } catch (error) {
    console.error('Get user error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// PUT /api/users/[id] - Update user (Admin only)
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

    if (authUser.role !== 'Admin') {
      return createErrorResponse('Admin access required', 403);
    }

    const user = await User.findOne({ userId: params.id });
    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    const { name, email, role, isActive, password } = await request.json();

    // Prevent admin from deactivating themselves
    if (user.userId === authUser.userId && isActive === false) {
      return createErrorResponse('You cannot deactivate your own account', 400);
    }

    // Store old values for audit log
    const oldValues = {
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };

    // Update fields if provided
    if (name) user.name = name.trim();
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(), 
        userId: { $ne: params.id } 
      });
      if (existingUser) {
        return createErrorResponse('Email already exists', 409);
      }
      user.email = email.toLowerCase().trim();
    }
    if (role && ['Admin', 'User'].includes(role)) {
      user.role = role;
    }
    if (typeof isActive === 'boolean') {
      user.isActive = isActive;
    }
    if (password && password.length >= 6) {
      user.password = password; // Will be hashed by pre-save middleware
    }

    await user.save();

    // Create new values for audit log
    const newValues = {
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };

    // Create audit log if values changed
    const hasChanges = JSON.stringify(oldValues) !== JSON.stringify(newValues) || password;
    if (hasChanges) {
      const additionalInfo = [];
      if (password) additionalInfo.push('Password changed');
      if (oldValues.role !== newValues.role) additionalInfo.push(`Role changed from ${oldValues.role} to ${newValues.role}`);
      if (oldValues.isActive !== newValues.isActive) additionalInfo.push(`Status changed to ${newValues.isActive ? 'Active' : 'Inactive'}`);

      await AuditLog.createLog({
        action: password ? 'PASSWORD_CHANGE' : 'UPDATE',
        entityType: 'User',
        entityId: user.userId,
        performedBy: authUser.userId,
        performedByName: authUser.name,
        performedByRole: authUser.role,
        oldValues,
        newValues,
        additionalInfo: additionalInfo.join(', ') || 'User updated via admin panel',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });
    }

    return createSuccessResponse('User updated successfully', {
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
  } catch (error: any) {
    console.error('Update user error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return createErrorResponse(messages.join('. '), 400);
    }

    return createErrorResponse('Internal server error', 500);
  }
}

// DELETE /api/users/[id] - Delete user (Admin only)
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

    if (authUser.role !== 'Admin') {
      return createErrorResponse('Admin access required', 403);
    }

    const user = await User.findOne({ userId: params.id });
    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    // Prevent admin from deleting themselves
    if (user.userId === authUser.userId) {
      return createErrorResponse('You cannot delete your own account', 400);
    }

    // Check if user has work logs
    const workLogCount = await WorkLog.countDocuments({ userId: params.id });
    if (workLogCount > 0) {
      return createErrorResponse(
        `Cannot delete user with existing work logs. User has ${workLogCount} work log entries.`,
        400
      );
    }

    // Store user data for audit log before deletion
    const deletedUserData = {
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };

    await User.deleteOne({ userId: params.id });

    // Create audit log
    await AuditLog.createLog({
      action: 'DELETE',
      entityType: 'User',
      entityId: user.userId,
      performedBy: authUser.userId,
      performedByName: authUser.name,
      performedByRole: authUser.role,
      oldValues: deletedUserData,
      additionalInfo: 'User deleted via admin panel',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return createSuccessResponse('User deleted successfully');
  } catch (error) {
    console.error('Delete user error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}