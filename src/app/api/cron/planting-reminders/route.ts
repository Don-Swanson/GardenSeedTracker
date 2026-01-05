import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { addWeeks, format, isWithinInterval, startOfDay, addDays } from 'date-fns'
import { hardinessZones, parseFrostDate } from '@/lib/garden-utils'

// Lazily initialize Resend to avoid build-time errors
let resend: Resend | null = null
function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

interface PlantReminder {
  plantName: string
  variety?: string | null
  category?: string | null
  plantingDate: Date
  type: 'indoor_start' | 'direct_sow' | 'transplant'
  source: 'seed' | 'wishlist'
}

// Cron job endpoint to send planting reminder emails
// This should be called daily by your cron service (e.g., Vercel Cron, GitHub Actions, etc.)
// 
// POST /api/cron/planting-reminders
export async function POST(request: Request) {
  try {
    // Verify cron secret for security - REQUIRED
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // SECURITY: Cron secret is required - reject if not configured
    if (!cronSecret) {
      console.error('SECURITY ERROR: CRON_SECRET environment variable is not set')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentYear = new Date().getFullYear()
    const today = startOfDay(new Date())

    // Find users who have planting reminders enabled (global or individual)
    const usersWithSettings = await prisma.userSettings.findMany({
      where: {
        OR: [
          { enableIndoorStartReminders: true },
          { enableDirectSowReminders: true },
          { enableTransplantReminders: true },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            seeds: {
              where: { isArchived: false },
              include: { plantType: true },
            },
            wishlistItems: {
              where: { purchased: false },
              include: { plantType: true },
            },
          },
        },
      },
    })

    // Also find users with individual seed reminders enabled (but no global reminders)
    const usersWithIndividualReminders = await prisma.user.findMany({
      where: {
        seeds: {
          some: {
            OR: [
              { enableIndoorStartReminder: true },
              { enableDirectSowReminder: true },
              { enableTransplantReminder: true },
            ],
            isArchived: false,
          },
        },
        settings: {
          enableIndoorStartReminders: false,
          enableDirectSowReminders: false,
          enableTransplantReminders: false,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        settings: true,
        seeds: {
          where: {
            isArchived: false,
            OR: [
              { enableIndoorStartReminder: true },
              { enableDirectSowReminder: true },
              { enableTransplantReminder: true },
            ],
          },
          include: { plantType: true },
        },
      },
    })

    const results = {
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    }

    // Process users with global reminders enabled
    for (const settings of usersWithSettings) {
      const user = settings.user
      if (!user.email) {
        results.skipped++
        continue
      }

      const lastFrostDate = getLastFrostDate(settings, currentYear)
      if (!lastFrostDate) {
        results.skipped++
        continue
      }

      const remindersToSend: PlantReminder[] = []
      const reminderLeadDays = settings.reminderLeadDays || 7
      const reminderWindowStart = today
      const reminderWindowEnd = addDays(today, reminderLeadDays)

      // Process seeds in inventory
      for (const seed of user.seeds) {
        const plantName = seed.plantType?.name || seed.customPlantName || seed.nickname || 'Unknown Plant'
        const guide = seed.plantType

        if (settings.enableIndoorStartReminders && guide?.indoorStartWeeks) {
          const indoorStartDate = addWeeks(lastFrostDate, -guide.indoorStartWeeks)
          if (isWithinInterval(indoorStartDate, { start: reminderWindowStart, end: reminderWindowEnd })) {
            remindersToSend.push({
              plantName,
              variety: seed.variety,
              category: guide?.category || seed.customCategory,
              plantingDate: indoorStartDate,
              type: 'indoor_start',
              source: 'seed',
            })
          }
        }

        if (settings.enableDirectSowReminders && guide?.outdoorStartWeeks !== undefined && guide?.outdoorStartWeeks !== null) {
          const directSowDate = addWeeks(lastFrostDate, guide.outdoorStartWeeks)
          if (isWithinInterval(directSowDate, { start: reminderWindowStart, end: reminderWindowEnd })) {
            remindersToSend.push({
              plantName,
              variety: seed.variety,
              category: guide?.category || seed.customCategory,
              plantingDate: directSowDate,
              type: 'direct_sow',
              source: 'seed',
            })
          }
        }

        if (settings.enableTransplantReminders && guide?.transplantWeeks !== undefined && guide?.transplantWeeks !== null) {
          const transplantDate = addWeeks(lastFrostDate, guide.transplantWeeks)
          if (isWithinInterval(transplantDate, { start: reminderWindowStart, end: reminderWindowEnd })) {
            remindersToSend.push({
              plantName,
              variety: seed.variety,
              category: guide?.category || seed.customCategory,
              plantingDate: transplantDate,
              type: 'transplant',
              source: 'seed',
            })
          }
        }
      }

      // Process wishlist items (only if they have planting info)
      for (const item of user.wishlistItems) {
        const plantName = item.plantType?.name || item.customPlantName || 'Unknown Plant'
        const guide = item.plantType

        // Use plant encyclopedia data or custom dates from wishlist item
        const indoorStartWeeks = guide?.indoorStartWeeks ?? item.indoorStartWeeks
        const outdoorStartWeeks = guide?.outdoorStartWeeks ?? item.outdoorStartWeeks
        const transplantWeeks = guide?.transplantWeeks

        if (settings.enableIndoorStartReminders && indoorStartWeeks) {
          const indoorStartDate = addWeeks(lastFrostDate, -indoorStartWeeks)
          if (isWithinInterval(indoorStartDate, { start: reminderWindowStart, end: reminderWindowEnd })) {
            remindersToSend.push({
              plantName,
              variety: item.variety,
              category: guide?.category,
              plantingDate: indoorStartDate,
              type: 'indoor_start',
              source: 'wishlist',
            })
          }
        }

        if (settings.enableDirectSowReminders && outdoorStartWeeks !== undefined && outdoorStartWeeks !== null) {
          const directSowDate = addWeeks(lastFrostDate, outdoorStartWeeks)
          if (isWithinInterval(directSowDate, { start: reminderWindowStart, end: reminderWindowEnd })) {
            remindersToSend.push({
              plantName,
              variety: item.variety,
              category: guide?.category,
              plantingDate: directSowDate,
              type: 'direct_sow',
              source: 'wishlist',
            })
          }
        }

        if (settings.enableTransplantReminders && transplantWeeks !== undefined && transplantWeeks !== null) {
          const transplantDate = addWeeks(lastFrostDate, transplantWeeks)
          if (isWithinInterval(transplantDate, { start: reminderWindowStart, end: reminderWindowEnd })) {
            remindersToSend.push({
              plantName,
              variety: item.variety,
              category: guide?.category,
              plantingDate: transplantDate,
              type: 'transplant',
              source: 'wishlist',
            })
          }
        }
      }

      // Check if we've already sent these reminders this year
      if (remindersToSend.length > 0) {
        const result = await sendConsolidatedReminder(user.id, user.email, user.name, remindersToSend, currentYear)
        if (result.sent) {
          results.sent++
        } else if (result.skipped) {
          results.skipped++
        } else {
          results.failed++
          if (result.error) results.errors.push(result.error)
        }
      }
    }

    // Process users with individual seed reminders only
    for (const user of usersWithIndividualReminders) {
      if (!user.email || !user.settings) {
        results.skipped++
        continue
      }

      const lastFrostDate = getLastFrostDate(user.settings, currentYear)
      if (!lastFrostDate) {
        results.skipped++
        continue
      }

      const remindersToSend: PlantReminder[] = []
      const reminderLeadDays = user.settings.reminderLeadDays || 7
      const reminderWindowStart = today
      const reminderWindowEnd = addDays(today, reminderLeadDays)

      for (const seed of user.seeds) {
        const plantName = seed.plantType?.name || seed.customPlantName || seed.nickname || 'Unknown Plant'
        const guide = seed.plantType

        if (seed.enableIndoorStartReminder && guide?.indoorStartWeeks) {
          const indoorStartDate = addWeeks(lastFrostDate, -guide.indoorStartWeeks)
          if (isWithinInterval(indoorStartDate, { start: reminderWindowStart, end: reminderWindowEnd })) {
            remindersToSend.push({
              plantName,
              variety: seed.variety,
              category: guide?.category || seed.customCategory,
              plantingDate: indoorStartDate,
              type: 'indoor_start',
              source: 'seed',
            })
          }
        }

        if (seed.enableDirectSowReminder && guide?.outdoorStartWeeks !== undefined && guide?.outdoorStartWeeks !== null) {
          const directSowDate = addWeeks(lastFrostDate, guide.outdoorStartWeeks)
          if (isWithinInterval(directSowDate, { start: reminderWindowStart, end: reminderWindowEnd })) {
            remindersToSend.push({
              plantName,
              variety: seed.variety,
              category: guide?.category || seed.customCategory,
              plantingDate: directSowDate,
              type: 'direct_sow',
              source: 'seed',
            })
          }
        }

        if (seed.enableTransplantReminder && guide?.transplantWeeks !== undefined && guide?.transplantWeeks !== null) {
          const transplantDate = addWeeks(lastFrostDate, guide.transplantWeeks)
          if (isWithinInterval(transplantDate, { start: reminderWindowStart, end: reminderWindowEnd })) {
            remindersToSend.push({
              plantName,
              variety: seed.variety,
              category: guide?.category || seed.customCategory,
              plantingDate: transplantDate,
              type: 'transplant',
              source: 'seed',
            })
          }
        }
      }

      if (remindersToSend.length > 0) {
        const result = await sendConsolidatedReminder(user.id, user.email, user.name, remindersToSend, currentYear)
        if (result.sent) {
          results.sent++
        } else if (result.skipped) {
          results.skipped++
        } else {
          results.failed++
          if (result.error) results.errors.push(result.error)
        }
      }
    }

    return NextResponse.json({
      message: `Processed planting reminders`,
      results,
    })
  } catch (error) {
    console.error('Planting reminder cron failed:', error)
    return NextResponse.json(
      { error: 'Failed to process planting reminders' },
      { status: 500 }
    )
  }
}

function getLastFrostDate(settings: { hardinessZone?: string | null; lastFrostDate?: Date | null }, currentYear: number): Date | null {
  if (settings.lastFrostDate) {
    // Use custom last frost date, but update to current year
    const customDate = new Date(settings.lastFrostDate)
    return new Date(currentYear, customDate.getMonth(), customDate.getDate())
  }

  if (settings.hardinessZone && hardinessZones[settings.hardinessZone]) {
    const zoneInfo = hardinessZones[settings.hardinessZone]
    return parseFrostDate(zoneInfo.lastFrostSpring, currentYear)
  }

  return null
}

async function sendConsolidatedReminder(
  userId: string,
  email: string,
  name: string | null,
  reminders: PlantReminder[],
  year: number
): Promise<{ sent: boolean; skipped: boolean; error?: string }> {
  // Group reminders by type
  const indoorReminders = reminders.filter(r => r.type === 'indoor_start')
  const directSowReminders = reminders.filter(r => r.type === 'direct_sow')
  const transplantReminders = reminders.filter(r => r.type === 'transplant')

  // Check if we've already sent similar reminders for these dates this year
  const existingLogs = await prisma.plantingReminderLog.findMany({
    where: {
      userId,
      year,
      OR: [
        ...(indoorReminders.length > 0 ? [{ reminderType: 'indoor_start' }] : []),
        ...(directSowReminders.length > 0 ? [{ reminderType: 'direct_sow' }] : []),
        ...(transplantReminders.length > 0 ? [{ reminderType: 'transplant' }] : []),
      ],
    },
  })

  // Create unique keys for comparison
  const sentKeys = new Set(existingLogs.map((log: { reminderType: string; targetDate: Date }) => 
    `${log.reminderType}-${format(log.targetDate, 'yyyy-MM-dd')}`
  ))

  // Filter out already sent reminders
  const newIndoorReminders = indoorReminders.filter(r => 
    !sentKeys.has(`indoor_start-${format(r.plantingDate, 'yyyy-MM-dd')}`)
  )
  const newDirectSowReminders = directSowReminders.filter(r => 
    !sentKeys.has(`direct_sow-${format(r.plantingDate, 'yyyy-MM-dd')}`)
  )
  const newTransplantReminders = transplantReminders.filter(r => 
    !sentKeys.has(`transplant-${format(r.plantingDate, 'yyyy-MM-dd')}`)
  )

  if (newIndoorReminders.length === 0 && newDirectSowReminders.length === 0 && newTransplantReminders.length === 0) {
    return { sent: false, skipped: true }
  }

  try {
    const emailClient = getResendClient()
    if (!emailClient) {
      console.error('Resend API key not configured, skipping email')
      return { sent: false, skipped: true, error: 'Email service not configured' }
    }

    const totalReminders = newIndoorReminders.length + newDirectSowReminders.length + newTransplantReminders.length

    // Send the email
    await emailClient.emails.send({
      from: process.env.EMAIL_FROM || 'Garden Seed Tracker <noreply@example.com>',
      to: email,
      subject: `🌱 Time to Start Planting! ${totalReminders} plant${totalReminders > 1 ? 's' : ''} ready`,
      html: generatePlantingReminderEmailHtml({
        name: name || 'Gardener',
        indoorReminders: newIndoorReminders,
        directSowReminders: newDirectSowReminders,
        transplantReminders: newTransplantReminders,
        settingsUrl: `${process.env.NEXTAUTH_URL}/settings`,
        calendarUrl: `${process.env.NEXTAUTH_URL}/calendar`,
      }),
    })

    // Log that we sent these reminders
    const logsToCreate = [
      ...newIndoorReminders.map(r => ({
        userId,
        plantNames: JSON.stringify(newIndoorReminders.map(r => r.plantName)),
        reminderType: 'indoor_start',
        targetDate: r.plantingDate,
        year,
      })),
      ...newDirectSowReminders.map(r => ({
        userId,
        plantNames: JSON.stringify(newDirectSowReminders.map(r => r.plantName)),
        reminderType: 'direct_sow',
        targetDate: r.plantingDate,
        year,
      })),
      ...newTransplantReminders.map(r => ({
        userId,
        plantNames: JSON.stringify(newTransplantReminders.map(r => r.plantName)),
        reminderType: 'transplant',
        targetDate: r.plantingDate,
        year,
      })),
    ]

    // Group by unique target date to avoid duplicates
    const uniqueLogs = logsToCreate.reduce((acc, log) => {
      const key = `${log.reminderType}-${format(log.targetDate, 'yyyy-MM-dd')}`
      if (!acc[key]) {
        acc[key] = log
      }
      return acc
    }, {} as Record<string, typeof logsToCreate[0]>)

    await prisma.plantingReminderLog.createMany({
      data: Object.values(uniqueLogs),
    })

    console.log(`Planting reminder sent to ${email}`)
    return { sent: true, skipped: false }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error(`Failed to send planting reminder to ${email}:`, error)
    return { sent: false, skipped: false, error: `Failed to send to ${email}: ${errorMsg}` }
  }
}

function generatePlantingReminderEmailHtml(params: {
  name: string
  indoorReminders: PlantReminder[]
  directSowReminders: PlantReminder[]
  transplantReminders: PlantReminder[]
  settingsUrl: string
  calendarUrl: string
}): string {
  const { name, indoorReminders, directSowReminders, transplantReminders, settingsUrl, calendarUrl } = params

  const formatReminder = (r: PlantReminder) => {
    const varietyStr = r.variety ? ` (${r.variety})` : ''
    const sourceStr = r.source === 'wishlist' ? ' 📝 <small style="color:#666">from wishlist</small>' : ''
    return `<li style="margin: 8px 0;">${r.plantName}${varietyStr} - <strong>${format(r.plantingDate, 'MMMM d')}</strong>${sourceStr}</li>`
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Planting Reminder</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2d5016 0%, #4a7c23 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🌱 Garden Seed Tracker</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Time to Start Planting!</p>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #2d5016; margin-top: 0;">Hi ${name}!</h2>
    
    <p>Based on your frost dates and planting calendar, it's time to start preparing these plants:</p>
    
    ${indoorReminders.length > 0 ? `
    <div style="background: #f3e5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9c27b0;">
      <h3 style="color: #7b1fa2; margin-top: 0;">🏠 Start Indoors</h3>
      <p style="color: #666; margin-bottom: 10px;">These seeds need to be started indoors:</p>
      <ul style="padding-left: 20px; color: #333;">
        ${indoorReminders.map(formatReminder).join('')}
      </ul>
    </div>
    ` : ''}
    
    ${directSowReminders.length > 0 ? `
    <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
      <h3 style="color: #388e3c; margin-top: 0;">🌿 Direct Sow Outside</h3>
      <p style="color: #666; margin-bottom: 10px;">These seeds can be planted directly in your garden:</p>
      <ul style="padding-left: 20px; color: #333;">
        ${directSowReminders.map(formatReminder).join('')}
      </ul>
    </div>
    ` : ''}
    
    ${transplantReminders.length > 0 ? `
    <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
      <h3 style="color: #f57c00; margin-top: 0;">🌱➡️🌻 Transplant Seedlings</h3>
      <p style="color: #666; margin-bottom: 10px;">These seedlings are ready to be transplanted outdoors:</p>
      <ul style="padding-left: 20px; color: #333;">
        ${transplantReminders.map(formatReminder).join('')}
      </ul>
    </div>
    ` : ''}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${calendarUrl}" style="background: #4a7c23; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        View Full Calendar
      </a>
    </div>
    
    <h3 style="color: #2d5016;">Quick Tips:</h3>
    <ul style="color: #666;">
      <li>Check soil temperature before planting outdoors</li>
      <li>Harden off indoor seedlings before transplanting</li>
      <li>Keep soil consistently moist for germinating seeds</li>
      <li>Label everything! Future you will thank you</li>
    </ul>
    
    <p style="color: #888; font-size: 14px; margin-top: 30px;">
      Happy gardening! 🌻
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>
      You're receiving this because you enabled planting reminders in Garden Seed Tracker.<br>
      <a href="${settingsUrl}" style="color: #4a7c23;">Manage your notification preferences</a>
    </p>
  </div>
</body>
</html>
`
}
