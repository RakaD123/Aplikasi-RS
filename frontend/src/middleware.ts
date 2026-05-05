import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * RBAC Middleware — Currently bypassed for development.
 * When the Laravel backend is connected, this will check auth cookies
 * to enforce role-based access control on /patient/*, /doctor/*, /admin/* routes.
 */
export function middleware(request: NextRequest) {
  // TODO: Re-enable when Laravel backend is integrated
  // const token = request.cookies.get('rs-token')?.value;
  // const userRole = request.cookies.get('rs-role')?.value;
  // if (!token) redirect to /login
  // if (userRole !== requiredRole) redirect to appropriate dashboard

  return NextResponse.next();
}

export const config = {
  matcher: ['/patient/:path*', '/doctor/:path*', '/admin/:path*'],
};
