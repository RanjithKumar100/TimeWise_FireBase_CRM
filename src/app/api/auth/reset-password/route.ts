import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import PasswordResetToken from '@/lib/models/PasswordResetToken';
import AuditLog from '@/lib/models/AuditLog';
import { createErrorResponse, createSuccessResponse } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return createErrorResponse('Token and new password are required', 400);
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return createErrorResponse('Password must be at least 6 characters long', 400);
    }

    // Find and validate reset token
    const resetToken = await PasswordResetToken.findValidToken(token);
    
    if (!resetToken) {
      return createErrorResponse('Invalid or expired reset token', 400);
    }

    // Find user
    const user = await User.findOne({ userId: resetToken.userId, isActive: true });
    
    if (!user) {
      await resetToken.markAsUsed();
      return createErrorResponse('User account not found or deactivated', 404);
    }

    console.log(`Password reset attempt for user: ${user.name} (${user.email})`);

    try {
      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      // Store old password hash for audit log
      const oldPasswordHash = user.password;

      // Update user password directly in database to bypass pre-save hook
      // (The pre-save hook would double-hash the already hashed password)
      await User.updateOne(
        { userId: user.userId },
        { 
          password: hashedPassword,
          updatedAt: new Date()
        }
      );

      // Mark reset token as used
      await resetToken.markAsUsed();

      // Create audit log entry
      await AuditLog.createLog({
        action: 'PASSWORD_CHANGE',
        entityType: 'User',
        entityId: user.userId,
        performedBy: user.userId,
        performedByName: user.name,
        performedByRole: user.role,
        oldValues: { passwordChanged: true },
        newValues: { passwordChanged: true },
        additionalInfo: 'Password reset via email verification',
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });

      console.log(`Password successfully reset for user: ${user.name} (${user.email})`);

      return createSuccessResponse('Password has been reset successfully. You can now login with your new password.');

    } catch (updateError: any) {
      console.error('Error updating password:', updateError);
      return createErrorResponse('Failed to update password. Please try again.', 500);
    }

  } catch (error) {
    console.error('Reset password error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// GET endpoint to validate reset token
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return createErrorResponse('Token is required', 400);
    }

    // Find and validate reset token
    const resetToken = await PasswordResetToken.findValidToken(token);
    
    if (!resetToken) {
      return createErrorResponse('Invalid or expired reset token', 400);
    }

    // Find user to get basic info
    const user = await User.findOne({ userId: resetToken.userId, isActive: true });
    
    if (!user) {
      return createErrorResponse('User account not found or deactivated', 404);
    }

    return createSuccessResponse('Token is valid', {
      valid: true,
      userEmail: user.email.replace(/(.{2})[^@]*(@.*)/, '$1***$2'), // Partially hide email
      expiresAt: resetToken.expiresAt,
    });

  } catch (error) {
    console.error('Validate reset token error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}