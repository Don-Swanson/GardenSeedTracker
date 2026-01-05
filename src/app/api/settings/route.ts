import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'

export async function GET() {
  try {
    // Require authentication
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch settings for the authenticated user only
    let settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    })
    
    // Create default settings if none exist for this user
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: session.user.id,
          hardinessZone: '7a',
        },
      })
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Require authentication
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    // Check if settings already exist for this user
    const existing = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    })
    
    if (existing) {
      return NextResponse.json({ error: 'Settings already exist, use PUT to update' }, { status: 409 })
    }
    
    // Create settings with authenticated user's ID
    const settings = await prisma.userSettings.create({
      data: {
        userId: session.user.id, // Secure: use authenticated user ID
        zipCode: data.zipCode,
        hardinessZone: data.hardinessZone,
        lastFrostDate: data.lastFrostDate ? new Date(data.lastFrostDate) : null,
        firstFrostDate: data.firstFrostDate ? new Date(data.firstFrostDate) : null,
        latitude: data.latitude,
        longitude: data.longitude,
        // Planting reminder settings
        enableIndoorStartReminders: data.enableIndoorStartReminders ?? false,
        enableDirectSowReminders: data.enableDirectSowReminders ?? false,
        enableTransplantReminders: data.enableTransplantReminders ?? false,
        reminderLeadDays: data.reminderLeadDays ?? 7,
      },
    })

    return NextResponse.json(settings, { status: 201 })
  } catch (error) {
    console.error('Error creating settings:', error)
    return NextResponse.json({ error: 'Failed to create settings' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    // Require authentication
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    // Get existing settings for this user only
    const existing = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    })
    
    if (!existing) {
      // Create new settings for this user
      const settings = await prisma.userSettings.create({
        data: {
          userId: session.user.id, // Secure: use authenticated user ID
          zipCode: data.zipCode,
          hardinessZone: data.hardinessZone,
          lastFrostDate: data.lastFrostDate ? new Date(data.lastFrostDate) : null,
          firstFrostDate: data.firstFrostDate ? new Date(data.firstFrostDate) : null,
          latitude: data.latitude,
          longitude: data.longitude,
          // Planting reminder settings
          enableIndoorStartReminders: data.enableIndoorStartReminders ?? false,
          enableDirectSowReminders: data.enableDirectSowReminders ?? false,
          enableTransplantReminders: data.enableTransplantReminders ?? false,
          reminderLeadDays: data.reminderLeadDays ?? 7,
        },
      })
      return NextResponse.json(settings)
    }

    // Update settings for authenticated user only
    const settings = await prisma.userSettings.update({
      where: { userId: session.user.id },
      data: {
        zipCode: data.zipCode,
        hardinessZone: data.hardinessZone,
        lastFrostDate: data.lastFrostDate ? new Date(data.lastFrostDate) : null,
        firstFrostDate: data.firstFrostDate ? new Date(data.firstFrostDate) : null,
        latitude: data.latitude,
        longitude: data.longitude,
        // Planting reminder settings
        enableIndoorStartReminders: data.enableIndoorStartReminders ?? existing.enableIndoorStartReminders,
        enableDirectSowReminders: data.enableDirectSowReminders ?? existing.enableDirectSowReminders,
        enableTransplantReminders: data.enableTransplantReminders ?? existing.enableTransplantReminders,
        reminderLeadDays: data.reminderLeadDays ?? existing.reminderLeadDays,
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
