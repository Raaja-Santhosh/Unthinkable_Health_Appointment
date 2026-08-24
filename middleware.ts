import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuth = !!req.auth;
  // NextAuth Session User role casting, assuming the session callback adds `role` to `user`
  const role = (req.auth?.user as any)?.role;

  // Protect cron API
  if (pathname.startsWith('/api/cron')) {
    const cronSecret = req.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Define protected paths
  const isPatientPath = pathname.startsWith('/patient');
  const isDoctorPath = pathname.startsWith('/doctor');
  const isAdminPath = pathname.startsWith('/admin');

  if (isPatientPath || isDoctorPath || isAdminPath) {
    if (!isAuth) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    if (isPatientPath && role !== 'PATIENT') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (isDoctorPath && role !== 'DOCTOR') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (isAdminPath && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Handle protected API routes role check
  if (pathname.startsWith('/api/patient') && role !== 'PATIENT') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (pathname.startsWith('/api/doctor') && role !== 'DOCTOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (pathname.startsWith('/api/admin') && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     * - login, register (auth pages)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login|register|public|.*\\..*).*)",
  ],
};
