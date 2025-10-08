import { NextRequest, NextResponse } from 'next/server';
import dbConnect from './mongodb';

// Request timeout in milliseconds (60 seconds)
const REQUEST_TIMEOUT = 60000;

// Database operation timeout (30 seconds)
const DB_OPERATION_TIMEOUT = 30000;

interface ApiHandlerOptions {
  requireAuth?: boolean;
  timeout?: number;
}

/**
 * Wrapper for API routes with automatic timeout, error handling, and connection management
 */
export function withTimeout<T>(
  handler: (request: NextRequest, ...args: any[]) => Promise<T>,
  timeoutMs: number = REQUEST_TIMEOUT
) {
  return async (request: NextRequest, ...args: any[]): Promise<T | Response> => {
    return Promise.race([
      handler(request, ...args),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      ),
    ]).catch((error) => {
      if (error.message === 'Request timeout') {
        console.error('⏱️ Request timeout after', timeoutMs, 'ms');
        return Response.json(
          {
            success: false,
            message: 'Request timeout - operation took too long',
            error: 'TIMEOUT',
          },
          { status: 408 }
        );
      }
      throw error;
    });
  };
}

/**
 * Wrapper for database operations with timeout
 */
export async function withDbTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = DB_OPERATION_TIMEOUT
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Database operation timeout')), timeoutMs)
    ),
  ]);
}

/**
 * Enhanced database connection with retry logic and timeout
 */
export async function connectWithRetry(maxRetries: number = 3): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await Promise.race([
        dbConnect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 10000)
        ),
      ]);
      return; // Success
    } catch (error: any) {
      lastError = error;
      console.error(`🔄 Database connection attempt ${attempt}/${maxRetries} failed:`, error.message);

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * attempt, 3000); // Exponential backoff, max 3 seconds
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed to connect to database after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Safe API handler wrapper with comprehensive error handling
 */
export function safeApiHandler(
  handler: (request: NextRequest, ...args: any[]) => Promise<Response>,
  options: ApiHandlerOptions = {}
) {
  return async (request: NextRequest, ...args: any[]): Promise<Response> => {
    const timeout = options.timeout || REQUEST_TIMEOUT;

    try {
      // Race between handler and timeout
      const result = await Promise.race([
        handler(request, ...args),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        ),
      ]);

      return result;
    } catch (error: any) {
      console.error('❌ API handler error:', {
        path: request.nextUrl.pathname,
        method: request.method,
        error: error.message,
        stack: error.stack,
      });

      // Handle specific error types
      if (error.message === 'Request timeout') {
        return Response.json(
          {
            success: false,
            message: 'Request timeout - the operation took too long. Please try again.',
            error: 'TIMEOUT',
          },
          { status: 408 }
        );
      }

      if (error.message?.includes('database') || error.message?.includes('MongoDB')) {
        return Response.json(
          {
            success: false,
            message: 'Database error - please try again later',
            error: 'DATABASE_ERROR',
          },
          { status: 503 }
        );
      }

      if (error.name === 'ValidationError') {
        return Response.json(
          {
            success: false,
            message: error.message,
            error: 'VALIDATION_ERROR',
          },
          { status: 400 }
        );
      }

      // Generic error response
      return Response.json(
        {
          success: false,
          message: 'An unexpected error occurred. Please try again.',
          error: 'INTERNAL_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Check if database is available before processing request
 */
export async function ensureDbConnection(): Promise<boolean> {
  try {
    await connectWithRetry(2); // Quick retry (2 attempts)
    return true;
  } catch (error) {
    console.error('❌ Failed to ensure database connection:', error);
    return false;
  }
}

/**
 * Health check for database connection
 */
export async function checkDbHealth(): Promise<{
  healthy: boolean;
  message: string;
  latency?: number;
}> {
  const startTime = Date.now();

  try {
    await connectWithRetry(1); // Single attempt
    const latency = Date.now() - startTime;

    return {
      healthy: true,
      message: 'Database connection healthy',
      latency,
    };
  } catch (error: any) {
    return {
      healthy: false,
      message: `Database connection failed: ${error.message}`,
    };
  }
}
