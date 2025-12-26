import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// Routes that require authentication
const protectedRoutes = [
  '/seeds',
  '/plantings',
  '/calendar',
  '/wishlist',
  '/almanac',
  '/settings',
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

    // Check if the route requires paid subscription
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

        // Check if path requires authentication
        const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))

        // If protected route and no token, not authorized
        if (isProtected && !token) {
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
    '/seeds/:path*',
    '/plantings/:path*',
    '/calendar/:path*',
    '/wishlist/:path*',
    '/almanac/:path*',
    '/settings/:path*',
  ],
}
