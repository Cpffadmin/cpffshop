import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { logger } from "@/utils/logger";

export async function middleware(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;
    const token = await getToken({ req: request });
    const isAdminRoute = path.startsWith("/admin");
    const isApiRoute = path.startsWith("/api");
    const isAuthRoute =
      path.startsWith("/login") || path.startsWith("/register");

    // Log the request details
    logger.info(`Processing request: ${path}`, {
      method: request.method,
      isAdminRoute,
      isApiRoute,
      isAuthRoute,
      hasToken: !!token,
    });

    // Handle API routes
    if (isApiRoute) {
      // Add CORS headers for API routes
      const response = NextResponse.next();
      response.headers.set("Access-Control-Allow-Origin", "*");
      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
      return response;
    }

    // Handle admin routes
    if (isAdminRoute) {
      if (!token) {
        logger.warn(`Unauthorized access attempt to admin route: ${path}`);
        return NextResponse.redirect(new URL("/login", request.url));
      }

      if (token.role !== "admin") {
        logger.warn(`Non-admin user attempted to access admin route: ${path}`);
        return NextResponse.redirect(new URL("/", request.url));
      }

      return NextResponse.next();
    }

    // Handle auth routes
    if (isAuthRoute && token) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    logger.error("Error in middleware", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/:path*",
    "/login",
    "/register",
    "/profile/:path*",
    "/checkout/:path*",
    "/orders/:path*",
  ],
};
