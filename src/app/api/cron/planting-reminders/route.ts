import { generatePlantingReminderEmailHtml, type PlantReminder } from '@/lib/planting-reminder-email'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { format, startOfDay } from 'date-fns'
import { getEffectiveFirstFrostDate, getEffectiveLastFrostDate } from '@/lib/garden-utils'
import { computePlantingReminders, type ReminderPlantInput } from '@/lib/planting-reminders'

// Lazily initialize Resend to avoid build-time errors
let resend: Resend | null = null
function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

// Cron job endpoint to send planting reminder emails
// This should be called daily by your cron service (Vercel Cron in
// production; for self-hosted/Docker installs see the `scheduler` service in
// docker-compose.yml, which curls this endpoint on the same schedule).
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

    // A single cohort: anyone who could plausibly have a reminder to send -
    // any global toggle on, or a per-seed override on. This replaces two
    // separate queries/loops that duplicated the same date math and, because
    // they were mutually exclusive, silently ignored a per-seed override for
    // any reminder type once a user had *any* global reminder enabled.
    const usersWithSettings = await prisma.userSettings.findMany({
      where: {
        OR: [
          { enableIndoorStartReminders: true },
          { enableDirectSowReminders: true },
          { enableTransplantReminders: true },
          { enableFallReminders: true },
          {
            user: {
              seeds: {
                some: {
                  OR: [
                    { enableIndoorStartReminder: true },
                    { enableDirectSowReminder: true },
                    { enableTransplantReminder: true },
                  ],
                },
              },
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            // "In your stock": excludes archived seeds and ones you're out of.
            seeds: {
              where: { isArchived: false, quantity: { gt: 0 } },
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

    const results = {
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const settings of usersWithSettings) {
      const user = settings.user
      if (!user.email) {
        results.skipped++
        continue
      }

      const lastFrostDate = getEffectiveLastFrostDate(settings, currentYear)
      const firstFrostDate = getEffectiveFirstFrostDate(settings, currentYear)
      if (!lastFrostDate && !firstFrostDate) {
        results.skipped++
        continue
      }

      const plants: ReminderPlantInput[] = [
        ...user.seeds.map((seed): ReminderPlantInput => ({
          key: `seed:${seed.id}`,
          plantName: seed.plantType?.name || seed.customPlantName || seed.nickname || 'Unknown Plant',
          variety: seed.variety,
          category: seed.plantType?.category || seed.customCategory,
          source: 'seed',
          indoorStartWeeks: seed.plantType?.indoorStartWeeks ?? null,
          outdoorStartWeeks: seed.plantType?.outdoorStartWeeks ?? null,
          transplantWeeks: seed.plantType?.transplantWeeks ?? null,
          daysToMaturity: seed.plantType?.daysToMaturity ?? seed.daysToMaturity ?? null,
          overrideIndoorStart: seed.enableIndoorStartReminder,
          overrideDirectSow: seed.enableDirectSowReminder,
          overrideTransplant: seed.enableTransplantReminder,
        })),
        // Wishlist items aren't "in stock" yet, so they're opt-in separately.
        ...(settings.enableWishlistReminders ? user.wishlistItems.map((item): ReminderPlantInput => ({
          key: `wishlist:${item.id}`,
          plantName: item.plantType?.name || item.customPlantName || 'Unknown Plant',
          variety: item.variety,
          category: item.plantType?.category ?? null,
          source: 'wishlist',
          indoorStartWeeks: item.plantType?.indoorStartWeeks ?? item.indoorStartWeeks ?? null,
          outdoorStartWeeks: item.plantType?.outdoorStartWeeks ?? item.outdoorStartWeeks ?? null,
          transplantWeeks: item.plantType?.transplantWeeks ?? null,
          daysToMaturity: item.plantType?.daysToMaturity ?? null,
        })) : []),
      ]

      const candidates = computePlantingReminders({
        plants,
        today,
        reminderLeadDays: settings.reminderLeadDays || 7,
        lastFrostDate,
        firstFrostDate,
        globalReminders: {
          indoorStart: settings.enableIndoorStartReminders,
          directSow: settings.enableDirectSowReminders,
          transplant: settings.enableTransplantReminders,
          fallDirectSow: settings.enableFallReminders,
        },
      })

      if (candidates.length === 0) {
        results.skipped++
        continue
      }

      const result = await sendConsolidatedReminder(user.id, user.email, user.name, candidates, currentYear)
      if (result.sent) {
        results.sent++
      } else if (result.skipped) {
        results.skipped++
      } else {
        results.failed++
        if (result.error) results.errors.push(result.error)
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

async function sendConsolidatedReminder(
  userId: string,
  email: string,
  name: string | null,
  candidates: ReturnType<typeof computePlantingReminders>,
  year: number
): Promise<{ sent: boolean; skipped: boolean; error?: string }> {
  // Per-plant dedup key (see PlantingReminderLog.plantKey): a different
  // plant sharing the same reminderType+targetDate as one already sent no
  // longer gets silently skipped.
  const dedupKey = (reminderType: string, targetDate: Date, plantKey: string) =>
    `${reminderType}-${format(targetDate, 'yyyy-MM-dd')}-${plantKey}`

  const existingLogs = await prisma.plantingReminderLog.findMany({
    where: { userId, year, reminderType: { in: Array.from(new Set(candidates.map(c => c.type))) } },
    select: { reminderType: true, targetDate: true, plantKey: true },
  })
  const sentKeys = new Set(existingLogs.map(log => dedupKey(log.reminderType, log.targetDate, log.plantKey)))

  const newReminders = candidates.filter(c => !sentKeys.has(dedupKey(c.type, c.plantingDate, c.plantKey)))
  if (newReminders.length === 0) {
    return { sent: false, skipped: true }
  }

  const toPlantReminder = (c: (typeof newReminders)[number]): PlantReminder => ({
    plantName: c.plantName,
    variety: c.variety,
    category: c.category,
    plantingDate: c.plantingDate,
    type: c.type,
    source: c.source,
  })

  const indoorReminders = newReminders.filter(r => r.type === 'indoor_start').map(toPlantReminder)
  const directSowReminders = newReminders.filter(r => r.type === 'direct_sow').map(toPlantReminder)
  const transplantReminders = newReminders.filter(r => r.type === 'transplant').map(toPlantReminder)
  const fallDirectSowReminders = newReminders.filter(r => r.type === 'fall_direct_sow').map(toPlantReminder)

  try {
    const emailClient = getResendClient()
    if (!emailClient) {
      console.error('Resend API key not configured, skipping email')
      return { sent: false, skipped: true, error: 'Email service not configured' }
    }

    await emailClient.emails.send({
      from: process.env.EMAIL_FROM || 'Garden Seed Tracker <noreply@example.com>',
      to: email,
      subject: `🌱 Time to Start Planting! ${newReminders.length} plant${newReminders.length > 1 ? 's' : ''} ready`,
      html: generatePlantingReminderEmailHtml({
        name: name || 'Gardener',
        indoorReminders,
        directSowReminders,
        transplantReminders,
        fallDirectSowReminders,
        settingsUrl: `${process.env.NEXTAUTH_URL}/settings`,
        calendarUrl: `${process.env.NEXTAUTH_URL}/calendar`,
      }),
    })

    await prisma.plantingReminderLog.createMany({
      data: newReminders.map(r => ({
        userId,
        plantNames: JSON.stringify([r.plantName]),
        reminderType: r.type,
        targetDate: r.plantingDate,
        plantKey: r.plantKey,
        year,
      })),
    })

    console.log(`Planting reminder sent to ${email}`)
    return { sent: true, skipped: false }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error(`Failed to send planting reminder to ${email}:`, error)
    return { sent: false, skipped: false, error: `Failed to send to ${email}: ${errorMsg}` }
  }
}
