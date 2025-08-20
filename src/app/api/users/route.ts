import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import AuditLog from '@/lib/models/AuditLog';
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from '@/lib/auth';

// GET /api/users - Get all users (Admin only)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createErrorResponse('Authentication required', 401);
    }

    if (authUser.role !== 'Admin') {
      return createErrorResponse('Admin access required', 403);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const query: any = {};
    
    // Optional filters
    const roleFilter = searchParams.get('role');
    if (roleFilter && ['Admin', 'User'].includes(roleFilter)) {
      query.role = roleFilter;
    }

    const isActiveFilter = searchParams.get('isActive');
    if (isActiveFilter !== null) {
      query.isActive = isActiveFilter === 'true';
    }

    const users = await User.find(query)
      .select('-password') // Exclude password from results
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await User.countDocuments(query);

    const formattedUsers = users.map(user => ({
      id: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return createSuccessResponse('Users retrieved successfully', {
      users: formattedUsers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// POST /api/users - Create new user (Admin only)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createErrorResponse('Authentication required', 401);
    }

    if (authUser.role !== 'Admin') {
      return createErrorResponse('Admin access required', 403);
    }

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

    // Create audit log
    await AuditLog.createLog({
      action: 'CREATE',
      entityType: 'User',
      entityId: user.userId,
      performedBy: authUser.userId,
      performedByName: authUser.name,
      performedByRole: authUser.role,
      newValues: {
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      additionalInfo: 'User created via admin panel',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return createSuccessResponse('User created successfully', {
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
    console.error('Create user error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return createErrorResponse(messages.join('. '), 400);
    }

    return createErrorResponse('Internal server error', 500);
  }
}