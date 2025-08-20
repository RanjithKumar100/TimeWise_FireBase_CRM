import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('Please define the JWT_SECRET environment variable inside .env.local');
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'Admin' | 'User';
  name: string;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET!, {
    expiresIn: '7d', // Token expires in 7 days
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

export async function getAuthenticatedUser(request: NextRequest): Promise<JWTPayload | null> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    return verifyToken(token);
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export function createAuthResponse(success: boolean, message: string, data?: any, token?: string) {
  return {
    success,
    message,
    data: data || null,
    token: token || null,
  };
}

export function createErrorResponse(message: string, statusCode: number = 400) {
  return Response.json(
    createAuthResponse(false, message),
    { status: statusCode }
  );
}

export function createSuccessResponse(message: string, data?: any, token?: string) {
  return Response.json(
    createAuthResponse(true, message, data, token),
    { status: 200 }
  );
}