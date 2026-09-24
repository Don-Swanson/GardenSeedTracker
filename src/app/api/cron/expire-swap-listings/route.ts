import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Daily job: close swap listings past their expiresAt date. Browsing already
// filters these out (see /api/swap/listings), so this isn't required for
// correctness - it's for the owner's "My Listings" view, which shows every
// status of their own listings and should reflect that a stale listing
// isn't just quietly excluded from other people's search results anymore.
//
// POST /api/cron/expire-swap-listings
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('SECURITY ERROR: CRON_SECRET environment variable is not set')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await prisma.swapListing.updateMany({
      where: { status: 'active', expiresAt: { lt: new Date() } },
      data: { status: 'closed' },
    })

    return NextResponse.json({ message: 'Expired swap listings closed', closed: result.count })
  } catch (error) {
    console.error('Swap listing expiry cron failed:', error)
    return NextResponse.json({ error: 'Failed to expire swap listings' }, { status: 500 })
  }
}
