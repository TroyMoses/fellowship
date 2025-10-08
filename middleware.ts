import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    console.log("[v0] Middleware triggered", {
      path,
      hasToken: !!token,
      role: token?.role,
      email: token?.email,
    });

    if (token && !token.role && path !== "/onboarding") {
      console.log("[v0] User has no role, redirecting to onboarding");
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    // Redirect to appropriate dashboard based on role
    if (path === "/dashboard") {
      if (!token?.role) {
        console.log("[v0] No role found, redirecting to onboarding");
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }

      if (token.role === "admin") {
        console.log("[v0] Redirecting admin to /admin");
        return NextResponse.redirect(new URL("/admin", req.url));
      } else {
        console.log("[v0] Redirecting fellow to /fellow");
        return NextResponse.redirect(new URL("/fellow", req.url));
      }
    }

    // Protect admin routes
    if (path.startsWith("/admin") && token?.role !== "admin") {
      console.log(
        "[v0] Non-admin trying to access admin route, redirecting to /fellow"
      );
      return NextResponse.redirect(new URL("/fellow", req.url));
    }

    // Protect fellow routes
    if (path.startsWith("/fellow") && token?.role === "admin") {
      console.log(
        "[v0] Admin trying to access fellow route, redirecting to /admin"
      );
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        console.log("[v0] Authorization check", {
          hasToken: !!token,
          role: token?.role,
        });
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/fellow/:path*",
    "/onboarding",
  ],
};
