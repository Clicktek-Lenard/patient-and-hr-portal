import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = [
  "/login",
  "/register",
  "/verify-otp",
  "/forgot-password",
  "/reset-password",
];

const authRoutes = [
  "/login",
  "/register",
  "/verify-otp",
  "/forgot-password",
  "/reset-password",
];

const hrRoutes = ["/hr"];

export default auth((req: NextRequest & { auth: { user?: { id?: string; role?: string } } | null }) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user?.id;
  const userRole = req.auth?.user?.role ?? "PATIENT";

  const isPublicRoute = publicRoutes.some((route) => nextUrl.pathname.startsWith(route));
  const isAuthRoute   = authRoutes.some((route)   => nextUrl.pathname.startsWith(route));
  const isHrRoute     = hrRoutes.some((route)     => nextUrl.pathname.startsWith(route));
  const isApiRoute    = nextUrl.pathname.startsWith("/api");
  const isRootRoute   = nextUrl.pathname === "/";

  // Allow API routes to handle their own auth
  if (isApiRoute) return NextResponse.next();

  // Root route: show landing page for guests, redirect logged-in users to their portal
  if (isRootRoute) {
    if (isLoggedIn) {
      return userRole === "HR" || userRole === "ADMIN"
        ? NextResponse.redirect(new URL("/hr/dashboard", nextUrl))
        : NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  // Logged-in users on auth pages → redirect to their portal
  if (isAuthRoute && isLoggedIn) {
    return userRole === "HR" || userRole === "ADMIN"
      ? NextResponse.redirect(new URL("/hr/dashboard", nextUrl))
      : NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // HR routes: require login + HR/ADMIN role
  if (isHrRoute) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== "HR" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  // Portal routes: require login
  if (!isPublicRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    const callbackUrl = nextUrl.pathname + nextUrl.search;
    if (callbackUrl !== "/") loginUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico|.*\\.webp|images|icons|fonts).*)",
  ],
};
