import { addDays, addWeeks, isWithinInterval, startOfDay } from 'date-fns'

// Pure planting-reminder logic, shared by the daily cron job
// (src/app/api/cron/planting-reminders/route.ts) and the dashboard's
// "plant this week" card. No database or email calls here - everything
// needed is passed in, which is what makes this unit-testable and keeps the
// date math in exactly one place instead of duplicated across call sites.

export type ReminderType = 'indoor_start' | 'direct_sow' | 'transplant' | 'fall_direct_sow'

export interface ReminderPlantInput {
  /** Stable identity for this plant, e.g. `seed:<id>` or `wishlist:<id>`.
   *  Used both in the output and for per-plant duplicate-send tracking -
   *  previously reminders were deduped per user+type+date only, so a second
   *  seed sharing a planting date with an already-reminded one was silently
   *  dropped. */
  key: string
  plantName: string
  variety: string | null
  category: string | null
  source: 'seed' | 'wishlist'
  indoorStartWeeks: number | null
  outdoorStartWeeks: number | null
  transplantWeeks: number | null
  /** Used to estimate a fall direct-sow cutoff date, counting back from
   *  first frost. Only present via the plant encyclopedia link. */
  daysToMaturity: number | null
  /** Per-seed overrides (wishlist items don't have these). When true, this
   *  plant gets the reminder even if the matching global toggle is off. */
  overrideIndoorStart?: boolean
  overrideDirectSow?: boolean
  overrideTransplant?: boolean
}

export interface ReminderTypeToggles {
  indoorStart: boolean
  directSow: boolean
  transplant: boolean
  fallDirectSow: boolean
}

export interface ComputePlantingRemindersInput {
  plants: ReminderPlantInput[]
  today: Date
  /** How many days ahead of the planting date to start reminding. */
  reminderLeadDays: number
  lastFrostDate: Date | null
  firstFrostDate: Date | null
  globalReminders: ReminderTypeToggles
}

export interface ReminderCandidate {
  plantKey: string
  plantName: string
  variety: string | null
  category: string | null
  plantingDate: Date
  type: ReminderType
  source: 'seed' | 'wishlist'
}

// Fall crops mature more slowly as days shorten and cool, so gardening
// guidance commonly adds a couple of extra weeks on top of the catalog's
// (summer-conditions) days-to-maturity figure when counting back from the
// first fall frost date.
const FALL_MATURITY_BUFFER_DAYS = 14

/**
 * Whether `date` falls in [today, today + reminderLeadDays] (inclusive).
 */
function isDueSoon(date: Date, today: Date, reminderLeadDays: number): boolean {
  return isWithinInterval(date, { start: today, end: addDays(today, reminderLeadDays) })
}

export function computePlantingReminders(input: ComputePlantingRemindersInput): ReminderCandidate[] {
  const { plants, reminderLeadDays, lastFrostDate, firstFrostDate, globalReminders } = input
  const today = startOfDay(input.today)
  const reminders: ReminderCandidate[] = []

  for (const plant of plants) {
    const push = (type: ReminderType, plantingDate: Date) => {
      reminders.push({
        plantKey: plant.key,
        plantName: plant.plantName,
        variety: plant.variety,
        category: plant.category,
        plantingDate,
        type,
        source: plant.source,
      })
    }

    if (lastFrostDate) {
      const indoorStartEnabled = globalReminders.indoorStart || plant.overrideIndoorStart
      if (indoorStartEnabled && plant.indoorStartWeeks) {
        const date = addWeeks(lastFrostDate, -plant.indoorStartWeeks)
        if (isDueSoon(date, today, reminderLeadDays)) push('indoor_start', date)
      }

      const directSowEnabled = globalReminders.directSow || plant.overrideDirectSow
      if (directSowEnabled && plant.outdoorStartWeeks !== null) {
        const date = addWeeks(lastFrostDate, plant.outdoorStartWeeks)
        if (isDueSoon(date, today, reminderLeadDays)) push('direct_sow', date)
      }

      const transplantEnabled = globalReminders.transplant || plant.overrideTransplant
      if (transplantEnabled && plant.transplantWeeks !== null) {
        const date = addWeeks(lastFrostDate, plant.transplantWeeks)
        if (isDueSoon(date, today, reminderLeadDays)) push('transplant', date)
      }
    }

    if (firstFrostDate && globalReminders.fallDirectSow && plant.daysToMaturity) {
      const date = addDays(firstFrostDate, -(plant.daysToMaturity + FALL_MATURITY_BUFFER_DAYS))
      if (isDueSoon(date, today, reminderLeadDays)) push('fall_direct_sow', date)
    }
  }

  return reminders
}
