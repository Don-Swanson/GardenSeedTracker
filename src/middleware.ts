import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// Routes that require authentication (pages)
const protectedRoutes = [
  '/seeds',
  '/plantings',
  '/calendar',
  '/wishlist',
  '/almanac',
  '/settings',
]

// API routes that require authentication
const protectedApiRoutes = [
  '/api/seeds',
  '/api/plantings',
  '/api/wishlist',
  '/api/settings',
  '/api/subscription',
  '/api/square/checkout',
]

// API routes that require admin role
const adminApiRoutes = [
  '/api/admin',
]

// Routes that require a paid subscription
const paidRoutes = [
  '/plantings',
  '/calendar',
  '/almanac',
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

    // Check if the route requires paid subscription (pages only)
    const requiresPaid = paidRoutes.some((route) => pathname.startsWith(route))

    if (requiresPaid && !token?.isPaid) {
      // Redirect to upgrade page if trying to access paid features
      const upgradeUrl = new URL('/upgrade', req.url)
      upgradeUrl.searchParams.set('feature', pathname)
      return NextResponse.redirect(upgradeUrl)
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
    // Protected pages
    '/seeds/:path*',
    '/plantings/:path*',
    '/calendar/:path*',
    '/wishlist/:path*',
    '/almanac/:path*',
    '/settings/:path*',
    // Protected API routes
    '/api/seeds/:path*',
    '/api/plantings/:path*',
    '/api/wishlist/:path*',
    '/api/settings/:path*',
    '/api/subscription/:path*',
    '/api/square/checkout',
    '/api/admin/:path*',
  ],
}
