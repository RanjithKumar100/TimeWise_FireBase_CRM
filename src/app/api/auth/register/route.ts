import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { generateToken, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import emailService from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { name, email, password, role = 'User' } = await request.json();

    // Validation
    if (!name || !email || !password) {
      return createErrorResponse('Name, email, and password are required', 400);
    }

    if (password.length < 6) {
      return createErrorResponse('Password must be at least 6 characters long', 400);
    }

    if (!['Admin', 'User'].includes(role)) {
      return createErrorResponse('Invalid role specified', 400);
    }

    // Check if user already exists
    const existingUserByEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingUserByEmail) {
      return createErrorResponse('User with this email already exists', 409);
    }

    const existingUserByName = await User.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existingUserByName) {
      return createErrorResponse('User with this name already exists', 409);
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      isActive: true,
    });

    await user.save();
    
    // Send welcome email with credentials (async, don't wait for it)
    if (emailService.isEmailConfigured()) {
      try {
        console.log(`📧 Sending welcome email to ${user.email} (${user.role})`);
        const welcomeEmail = emailService.generateWelcomeEmail(
          user.name, 
          user.email, 
          password, // Send the original plain password
          user.role as 'Admin' | 'User'
        );
        
        const emailSent = await emailService.sendEmail({
          to: user.email,
          subject: welcomeEmail.subject,
          html: welcomeEmail.html,
          text: welcomeEmail.text
        });
        
        if (emailSent) {
          console.log(`✅ Welcome email sent successfully to ${user.email}`);
        } else {
          console.log(`⚠️ Failed to send welcome email to ${user.email}`);
        }
      } catch (emailError) {
        console.error(`❌ Error sending welcome email to ${user.email}:`, emailError);
        // Don't fail the registration if email fails
      }
    } else {
      console.log('📧 Email service not configured, skipping welcome email');
    }

    // Generate JWT token
    const tokenPayload = {
      userId: user.userId,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const token = generateToken(tokenPayload);

    return createSuccessResponse(
      'User created successfully',
      {
        user: {
          id: user.userId,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
      },
      token
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return createErrorResponse(messages.join('. '), 400);
    }

    return createErrorResponse('Internal server error', 500);
  }
}