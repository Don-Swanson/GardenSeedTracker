import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// Routes that require authentication (pages)
const protectedRoutes = [
  '/dashboard',
  '/seeds',
  '/plantings',
  '/calendar',
  '/wishlist',
  '/almanac',
  '/settings',
  '/plants',
]

// API routes that require authentication
const protectedApiRoutes = [
  '/api/seeds',
  '/api/plantings',
  '/api/wishlist',
  '/api/settings',
  '/api/plants',
]

// API routes that require admin role
const adminApiRoutes = [
  '/api/admin',
]

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Check if it's an admin API route
    const isAdminRoute = adminApiRoutes.some((route) => pathname.startsWith(route))
    if (isAdminRoute) {
      if (!token || token.role !== 'admin') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Check if path requires authentication (pages)
        const isProtectedPage = protectedRoutes.some((route) => pathname.startsWith(route))
        
        // Check if path requires authentication (API)
        const isProtectedApi = protectedApiRoutes.some((route) => pathname.startsWith(route))
        
        // Check if it's an admin route
        const isAdminRoute = adminApiRoutes.some((route) => pathname.startsWith(route))

        // If protected route and no token, not authorized
        if ((isProtectedPage || isProtectedApi || isAdminRoute) && !token) {
          return false
        }

        return true
      },
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
)

export const config = {
  matcher: [
    // Dashboard (protected)
    '/dashboard/:path*',
    // Protected pages
    '/seeds/:path*',
    '/plantings/:path*',
    '/calendar/:path*',
    '/wishlist/:path*',
    '/almanac/:path*',
    '/settings/:path*',
    '/plants/:path*',
    // Protected API routes
    '/api/seeds/:path*',
    '/api/plantings/:path*',
    '/api/wishlist/:path*',
    '/api/settings/:path*',
    '/api/plants/:path*',
    '/api/admin/:path*',
  ],
}
