import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAdminNotifications, updateAdminNotifications } from '@/lib/admin-notifications'

// GET /api/admin/notification-settings - Get admin's notification preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const settings = await getAdminNotifications(session.user.email!)

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PUT /api/admin/notification-settings - Update admin's notification preferences
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    
    // Validate that all keys are valid boolean values
    const validKeys = [
      'newUserSignup',
      'userDeleted',
      'newPlantSubmission',
      'newPlantSuggestion',
      'newPlantRequest',
      'dailyDigest',
      'weeklyDigest',
      'errorAlerts'
    ]

    const preferences: Record<string, boolean> = {}
    for (const key of validKeys) {
      if (typeof body[key] === 'boolean') {
        preferences[key] = body[key]
      }
    }

    const settings = await updateAdminNotifications(session.user.email!, preferences)

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return NextResponse.json({ error: 'Failed to update settings', details: String(error) }, { status: 500 })
  }
}
