import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block suspicious paths that are commonly probed by bots
  const suspiciousPaths = [
    "/adfa",
    "/wp-admin",
    "/wp-login",
    "/admin.php",
    "/.env",
    "/.git",
    "/config",
    "/backup",
    "/phpmyadmin",
    "/xmlrpc.php",
    "/wp-config.php",
  ];

  // Check if the path starts with any suspicious pattern
  if (suspiciousPaths.some(path => pathname.startsWith(path))) {
    const clientIP =
      request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";
    console.log(`🚫 Blocked suspicious request: ${request.method} ${pathname} from ${clientIP}`);
    return new NextResponse("Not Found", { status: 404 });
  }

  // Log unusual requests for monitoring (optional)
  if (pathname.includes("..") || pathname.includes("%")) {
    const clientIP =
      request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";
    console.log(`⚠️  Unusual request: ${request.method} ${pathname} from ${clientIP}`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt (robots file)
     * - sitemap.xml (sitemap file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
