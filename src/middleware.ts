import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicRoutes = ["/login", "/register", "/verify-otp", "/forgot-password", "/reset-password"];
const hrRoutes     = ["/hr"];

export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const path = nextUrl.pathname;

  const isPublicRoute = publicRoutes.some((r) => path.startsWith(r));
  const isHrRoute     = hrRoutes.some((r) => path.startsWith(r));
  const isApiRoute    = path.startsWith("/api");
  const isRootRoute   = path === "/";

  // Always allow API routes and static assets
  if (isApiRoute) return NextResponse.next();

  // NextAuth v5 uses "authjs.session-token" on HTTP and
  // "__Secure-authjs.session-token" on HTTPS. Pass secureCookie so
  // getToken() picks the right cookie name on Vercel automatically.
  const secureCookie = req.headers.get("x-forwarded-proto") === "https"
    || nextUrl.protocol === "https:";

  const token      = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie });
  const isLoggedIn = !!token?.sub;
  const userRole   = (token?.role as string) ?? "PATIENT";

  // Root: guests see landing, logged-in users go to their portal
  if (isRootRoute) {
    if (isLoggedIn) {
      return userRole === "HR" || userRole === "ADMIN"
        ? NextResponse.redirect(new URL("/hr/dashboard", nextUrl))
        : NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  // Logged-in users on login/register → redirect to portal
  if (isPublicRoute && isLoggedIn) {
    return userRole === "HR" || userRole === "ADMIN"
      ? NextResponse.redirect(new URL("/hr/dashboard", nextUrl))
      : NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // HR routes: must be logged in + HR/ADMIN role
  if (isHrRoute) {
    if (!isLoggedIn) {
      const url = new URL("/login", nextUrl);
      url.searchParams.set("callbackUrl", path + nextUrl.search);
      return NextResponse.redirect(url);
    }
    if (userRole !== "HR" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  // HR/ADMIN users must not access patient routes — redirect back to HR portal
  if (isLoggedIn && (userRole === "HR" || userRole === "ADMIN") && !isHrRoute) {
    return NextResponse.redirect(new URL("/hr/dashboard", nextUrl));
  }

  // All other protected routes: require login
  if (!isPublicRoute && !isLoggedIn) {
    const url = new URL("/login", nextUrl);
    if (path !== "/") url.searchParams.set("callbackUrl", path + nextUrl.search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico|.*\\.webp|images|icons|fonts).*)",
  ],
};
