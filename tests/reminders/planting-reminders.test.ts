import assert from 'node:assert/strict'
import { test } from 'node:test'
import { computePlantingReminders, type ReminderPlantInput } from '../../src/lib/planting-reminders'

// Local-calendar-date constructors throughout (not UTC ISO strings), matching
// how the app itself builds frost dates (new Date(year, month, day)) - using
// ISO 'Z' strings here would shift by an hour across the March DST boundary.
const today = new Date(2027, 2, 1)
const lastFrostDate = new Date(2027, 3, 10)
const firstFrostDate = new Date(2027, 9, 25)

const allOn = { indoorStart: true, directSow: true, transplant: true, fallDirectSow: true }
const allOff = { indoorStart: false, directSow: false, transplant: false, fallDirectSow: false }

function plant(overrides: Partial<ReminderPlantInput> = {}): ReminderPlantInput {
  return {
    key: 'seed:1',
    plantName: 'Tomato',
    variety: null,
    category: 'vegetable',
    source: 'seed',
    indoorStartWeeks: null,
    outdoorStartWeeks: null,
    transplantWeeks: null,
    daysToMaturity: null,
    ...overrides,
  }
}

test('indoor start reminder fires within the lead-day window, based on weeks before last frost', () => {
  // indoorStartWeeks=6 -> Feb 27, which is within [Mar 1, Mar 8] only if lead days cover it
  const result = computePlantingReminders({
    plants: [plant({ indoorStartWeeks: 4 })], // Mar 13, within a 14-day lead window from Mar 1
    today, reminderLeadDays: 14, lastFrostDate, firstFrostDate: null, globalReminders: allOn,
  })
  assert.equal(result.length, 1)
  assert.equal(result[0].type, 'indoor_start')
  assert.deepEqual(result[0].plantingDate, new Date(2027, 2, 13))
})

test('nothing fires outside the reminder window', () => {
  const result = computePlantingReminders({
    plants: [plant({ indoorStartWeeks: 1 })], // Apr 3 - far outside a 3-day window from Mar 1
    today, reminderLeadDays: 3, lastFrostDate, firstFrostDate: null, globalReminders: allOn,
  })
  assert.equal(result.length, 0)
})

test('all global toggles off and no per-seed override means no reminders at all', () => {
  const result = computePlantingReminders({
    plants: [plant({ indoorStartWeeks: 4, outdoorStartWeeks: 0, transplantWeeks: 2 })],
    today, reminderLeadDays: 30, lastFrostDate, firstFrostDate: null, globalReminders: allOff,
  })
  assert.equal(result.length, 0)
})

test('a per-seed override fires even when every global toggle is off', () => {
  const result = computePlantingReminders({
    plants: [plant({ indoorStartWeeks: 4, overrideIndoorStart: true })],
    today, reminderLeadDays: 30, lastFrostDate, firstFrostDate: null, globalReminders: allOff,
  })
  assert.equal(result.length, 1)
  assert.equal(result[0].type, 'indoor_start')
})

test('a per-seed override for one type does not fire other types that are globally off', () => {
  const result = computePlantingReminders({
    plants: [plant({ indoorStartWeeks: 4, outdoorStartWeeks: -1, overrideIndoorStart: true })],
    today, reminderLeadDays: 30, lastFrostDate, firstFrostDate: null, globalReminders: allOff,
  })
  assert.equal(result.length, 1)
  assert.equal(result[0].type, 'indoor_start')
})

test('direct sow and transplant both use last frost date independently', () => {
  const result = computePlantingReminders({
    plants: [plant({ outdoorStartWeeks: 0, transplantWeeks: 1 })], // Apr 10 and Apr 17
    today, reminderLeadDays: 60, lastFrostDate, firstFrostDate: null, globalReminders: allOn,
  })
  const types = result.map(r => r.type).sort()
  assert.deepEqual(types, ['direct_sow', 'transplant'])
})

test('fall direct sow counts back from first frost using days-to-maturity plus a buffer', () => {
  // firstFrost Oct 25, daysToMaturity 60 -> cutoff = Oct 25 - 60 - 14 = Aug 12
  const augToday = new Date(2027, 7, 1)
  const result = computePlantingReminders({
    plants: [plant({ daysToMaturity: 60 })],
    today: augToday, reminderLeadDays: 14, lastFrostDate: null, firstFrostDate, globalReminders: allOn,
  })
  assert.equal(result.length, 1)
  assert.equal(result[0].type, 'fall_direct_sow')
  assert.deepEqual(result[0].plantingDate, new Date(2027, 7, 12))
})

test('fall direct sow is skipped when its toggle is off, independent of the others', () => {
  const augToday = new Date(2027, 7, 1)
  const result = computePlantingReminders({
    plants: [plant({ daysToMaturity: 60 })],
    today: augToday, reminderLeadDays: 14, lastFrostDate: null, firstFrostDate,
    globalReminders: { ...allOn, fallDirectSow: false },
  })
  assert.equal(result.length, 0)
})

test('each plant keeps its own key so per-plant dedup can tell identical-date reminders apart', () => {
  const result = computePlantingReminders({
    plants: [
      plant({ key: 'seed:a', plantName: 'Tomato A', outdoorStartWeeks: 0 }),
      plant({ key: 'seed:b', plantName: 'Tomato B', outdoorStartWeeks: 0 }),
    ],
    today, reminderLeadDays: 60, lastFrostDate, firstFrostDate: null, globalReminders: allOn,
  })
  assert.equal(result.length, 2)
  assert.deepEqual(result.map(r => r.plantKey).sort(), ['seed:a', 'seed:b'])
})
