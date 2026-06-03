import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname
    
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    const role = token.role

    // Route guarding by prefix
    if (path.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL(getDashboardRedirect(role), req.url))
    }
    if (path.startsWith("/seller") && role !== "SELLER") {
      return NextResponse.redirect(new URL(getDashboardRedirect(role), req.url))
    }
    if (path.startsWith("/buyer") && role !== "BUYER") {
      return NextResponse.redirect(new URL(getDashboardRedirect(role), req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

function getDashboardRedirect(role: string) {
  if (role === "ADMIN") return "/admin/dashboard"
  if (role === "SELLER") return "/seller/products"
  if (role === "BUYER") return "/buyer/dashboard"
  return "/login"
}

export const config = {
  matcher: ["/admin/:path*", "/seller/:path*", "/buyer/:path*"],
}
