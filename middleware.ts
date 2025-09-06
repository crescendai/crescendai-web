// Auth middleware disabled for development
// import { withAuth } from 'next-auth/middleware';

// export default withAuth({
//   pages: {
//     signIn: '/auth/signin',
//   },
// });

// For development: allow access to all pages without auth
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow all requests to pass through without auth checks
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/organizations/:path*',
    '/recordings/:path*',
  ],
};
