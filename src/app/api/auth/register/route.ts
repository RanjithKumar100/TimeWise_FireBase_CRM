import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { generateToken, createErrorResponse, createSuccessResponse } from '@/lib/auth';

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
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { name: { $regex: new RegExp(`^${name}$`, 'i') } }],
    });

    if (existingUser) {
      return createErrorResponse('User with this email or name already exists', 409);
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