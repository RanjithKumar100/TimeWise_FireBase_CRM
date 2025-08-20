import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { generateToken, createErrorResponse, createSuccessResponse } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { username, password } = await request.json();

    if (!username || !password) {
      return createErrorResponse('Username and password are required', 400);
    }

    // Find user by email or name (case insensitive)
    const user = await User.findOne({
      $and: [
        { isActive: true },
        {
          $or: [
            { email: username.toLowerCase() },
            { name: { $regex: new RegExp(`^${username}$`, 'i') } },
          ],
        },
      ],
    });

    if (!user) {
      return createErrorResponse('Invalid credentials', 401);
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return createErrorResponse('Invalid credentials', 401);
    }

    // Generate JWT token
    const tokenPayload = {
      userId: user.userId,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const token = generateToken(tokenPayload);

    // Return user data (password excluded by toJSON method)
    return createSuccessResponse(
      'Login successful',
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
  } catch (error) {
    console.error('Login error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}