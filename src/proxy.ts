import { withAuth, type NextRequestWithAuth } from 'next-auth/middleware'
import { NextResponse, type NextRequest, type NextFetchEvent } from 'next/server'
import { isTrustedMutation } from './lib/request-origin'

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
  '/swap',
]

// API routes that require authentication
const protectedApiRoutes = [
  '/api/seeds',
  '/api/plantings',
  '/api/wishlist',
  '/api/settings',
  '/api/plants',
  '/api/swap',
]

// API routes that require admin role
const adminApiRoutes = [
  '/api/admin',
]

const authenticatedProxy = withAuth(
  function proxy(req) {
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

    // Guide brand-new accounts that skipped the signup form (Google OAuth,
    // or a magic link for an email that never visited /auth/signup) through
    // a one-time profile setup step (name/username). Page routes only -
    // never redirect an API call, and never loop on /auth/* itself.
    const isProtectedPage = !pathname.startsWith('/api/') &&
      protectedRoutes.some((route) => pathname.startsWith(route))
    if (isProtectedPage && token && !token.onboardedAt) {
      const redirectUrl = new URL('/auth/setup-profile', req.url)
      redirectUrl.searchParams.set('callbackUrl', pathname + req.nextUrl.search)
      return NextResponse.redirect(redirectUrl)
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

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  // Run before withAuth, which skips /api/auth/* (including custom endpoints).
  if (request.nextUrl.pathname.startsWith('/api/') && !isTrustedMutation(request)) {
    return NextResponse.json({ error: 'Cross-origin request denied' }, { status: 403 })
  }
  return authenticatedProxy(request as NextRequestWithAuth, event)
}

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
    '/swap/:path*',
    // Protected API routes
    '/api/:path*',
  ],
}
