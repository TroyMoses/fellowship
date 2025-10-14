import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    console.log("[v0] Middleware triggered", {
      path,
      hasToken: !!token,
      role: token?.role,
      email: token?.email,
      institutionId: token?.institutionId,
      approvalStatus: token?.approvalStatus,
    });

    if (token?.role === "admin" && token?.institutionId) {
      if (token.approvalStatus === "pending" && path !== "/auth/pending") {
        console.log(
          "[v0] Admin has pending institution, redirecting to pending page"
        );
        return NextResponse.redirect(new URL("/auth/pending", req.url));
      }

      if (token.approvalStatus === "rejected" && path !== "/onboarding") {
        console.log(
          "[v0] Admin institution was rejected, redirecting to onboarding"
        );
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }

      if (token.approvalStatus === "approved" && path === "/onboarding") {
        console.log(
          "[v0] Approved admin on onboarding page, redirecting to admin dashboard"
        );
        return NextResponse.redirect(new URL("/admin", req.url));
      }
    }

    if (
      token &&
      !token.role &&
      path !== "/onboarding" &&
      path !== "/auth/pending"
    ) {
      console.log("[v0] User has no role, redirecting to onboarding");
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    // Redirect to appropriate dashboard based on role
    if (path === "/dashboard") {
      if (!token?.role) {
        console.log("[v0] No role found, redirecting to onboarding");
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }

      if (token.role === "root_admin") {
        console.log("[v0] Redirecting root admin to /root-admin");
        return NextResponse.redirect(new URL("/root-admin", req.url));
      } else if (token.role === "admin") {
        if (token.approvalStatus === "pending") {
          console.log(
            "[v0] Admin pending approval, redirecting to pending page"
          );
          return NextResponse.redirect(new URL("/auth/pending", req.url));
        }
        console.log("[v0] Redirecting admin to /admin");
        return NextResponse.redirect(new URL("/admin", req.url));
      } else {
        console.log("[v0] Redirecting fellow to /fellow");
        return NextResponse.redirect(new URL("/fellow", req.url));
      }
    }

    if (path.startsWith("/root-admin") && token?.role !== "root_admin") {
      console.log("[v0] Non-root-admin trying to access root admin route");
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (path.startsWith("/admin")) {
      if (token?.role !== "admin") {
        console.log("[v0] Non-admin trying to access admin route");
        return NextResponse.redirect(
          new URL(token?.role === "fellow" ? "/fellow" : "/", req.url)
        );
      }

      if (token.approvalStatus === "pending") {
        console.log(
          "[v0] Admin institution still pending, redirecting to pending page"
        );
        return NextResponse.redirect(new URL("/auth/pending", req.url));
      }

      if (token.approvalStatus === "rejected") {
        console.log("[v0] Admin institution rejected, redirecting to home");
        return NextResponse.redirect(new URL("/", req.url));
      }
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
    "/root-admin/:path*",
    "/onboarding",
  ],
};
