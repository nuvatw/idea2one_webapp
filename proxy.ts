import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Next.js 16 proxy.ts — request-time route protection
 *
 * Rules:
 * - Only do optimistic cookie check + redirect
 * - No DB queries here
 * - No authorization logic beyond cookie existence check
 *
 * Week 2: implement actual cookie checks
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Participant protected routes
  const participantProtectedPaths = ["/home", "/qa"];
  if (participantProtectedPaths.some((p) => pathname.startsWith(p))) {
    const participantSession = request.cookies.get("ff_participant_session");
    if (!participantSession?.value) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Staff protected routes
  const staffProtectedPaths = ["/staff/select", "/staff"];
  if (
    staffProtectedPaths.some((p) => pathname === p || pathname.startsWith(p + "/")) &&
    pathname !== "/staff/login"
  ) {
    const staffSession = request.cookies.get("ff_staff_session");
    if (!staffSession?.value) {
      return NextResponse.redirect(new URL("/staff/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/qa/:path*", "/staff/:path*"],
};
