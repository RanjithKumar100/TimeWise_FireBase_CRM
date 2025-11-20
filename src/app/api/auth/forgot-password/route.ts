import { NextRequest } from 'next/server';
import dbConnect from '@/lib/database/mongodb';
import User from '@/lib/models/User';
import PasswordResetToken from '@/lib/models/PasswordResetToken';
import { createErrorResponse, createSuccessResponse } from '@/lib/auth/index';
import { emailService } from '@/lib/services/email/index';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { email } = await request.json();

    if (!email) {
      return createErrorResponse('Email is required', 400);
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse('Please enter a valid email address', 400);
    }

    // Find user by email
    const user = await User.findOne({
      email: email.toLowerCase(),
      isActive: true,
    });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return createSuccessResponse(
        'If an account with that email exists, a password reset link has been sent.',
        { sent: true }
      );
    }

    console.log(`Password reset requested for user: ${user.name} (${user.email})`);

    try {
      // Create reset token
      const resetToken = await PasswordResetToken.createResetToken(user.userId, user.email);
      
      // Generate reset URL
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/reset-password?token=${resetToken.token}`;
      
      // Generate email content
      const emailContent = emailService.generatePasswordResetEmail(
        user.name,
        resetUrl,
        resetToken.expiresAt
      );

      // Send email
      const emailSent = await emailService.sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      if (!emailSent) {
        console.error(`Failed to send password reset email to ${user.email}`);
        return createErrorResponse('Failed to send password reset email. Please try again later.', 500);
      }

      console.log(`Password reset email sent successfully to ${user.email}`);

      return createSuccessResponse(
        'If an account with that email exists, a password reset link has been sent.',
        { 
          sent: true,
          expiresIn: '1 hour'
        }
      );

    } catch (tokenError: any) {
      console.error('Error creating reset token or sending email:', tokenError);
      return createErrorResponse('Failed to process password reset request. Please try again later.', 500);
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}