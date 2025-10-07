import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Redirect to appropriate dashboard based on role
    if (path === "/dashboard") {
      if (token?.role === "admin") {
        return NextResponse.redirect(new URL("/admin", req.url))
      } else {
        return NextResponse.redirect(new URL("/fellow", req.url))
      }
    }

    // Protect admin routes
    if (path.startsWith("/admin") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/fellow", req.url))
    }

    // Protect fellow routes
    if (path.startsWith("/fellow") && token?.role === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
)

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/fellow/:path*"],
}
