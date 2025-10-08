import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware to add request timeout and connection handling
export function middleware(request: NextRequest) {
  // Add timeout headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next();

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Add timeout header (60 seconds for API routes)
    response.headers.set('X-Request-Timeout', '60000');

    return response;
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/api/:path*',
  ],
};
