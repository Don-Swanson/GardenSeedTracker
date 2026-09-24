import assert from 'node:assert/strict'
import { test } from 'node:test'
import { coarseActivityLabel, isThreadUnread, shouldSendThreadNotification } from '../../src/lib/swap'

const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000)

test('coarseActivityLabel is null when there is no activity on record', () => {
  assert.equal(coarseActivityLabel(null), null)
})

test('coarseActivityLabel buckets into today/this week/this month/a while ago', () => {
  assert.equal(coarseActivityLabel(hoursAgo(2)), 'Active today')
  assert.equal(coarseActivityLabel(hoursAgo(3 * 24)), 'Active this week')
  assert.equal(coarseActivityLabel(hoursAgo(20 * 24)), 'Active this month')
  assert.equal(coarseActivityLabel(hoursAgo(90 * 24)), 'Active a while ago')
})

test('coarseActivityLabel never reveals anything more precise than the bucket', () => {
  // Two very different exact ages within the same bucket produce the same label.
  assert.equal(coarseActivityLabel(hoursAgo(0.1)), coarseActivityLabel(hoursAgo(23)))
})

test('shouldSendThreadNotification allows the first email and throttles further ones within an hour', () => {
  assert.equal(shouldSendThreadNotification(null), true)
  assert.equal(shouldSendThreadNotification(hoursAgo(0.5)), false)
  assert.equal(shouldSendThreadNotification(hoursAgo(1.5)), true)
})

test('isThreadUnread is true for a participant who has never read, or read before the last message', () => {
  const base = { initiatorId: 'alice', ownerId: 'bob', lastMessageAt: hoursAgo(1) }
  assert.equal(isThreadUnread({ ...base, initiatorLastReadAt: null, ownerLastReadAt: null }, 'alice'), true)
  assert.equal(isThreadUnread({ ...base, initiatorLastReadAt: null, ownerLastReadAt: null }, 'bob'), true)
  assert.equal(isThreadUnread({ ...base, initiatorLastReadAt: hoursAgo(2), ownerLastReadAt: null }, 'alice'), true)
})

test('isThreadUnread is false once a participant has read at/after the last message', () => {
  const base = { initiatorId: 'alice', ownerId: 'bob', lastMessageAt: hoursAgo(1) }
  assert.equal(isThreadUnread({ ...base, initiatorLastReadAt: hoursAgo(0.5), ownerLastReadAt: null }, 'alice'), false)
  assert.equal(isThreadUnread({ ...base, initiatorLastReadAt: null, ownerLastReadAt: hoursAgo(0.5) }, 'bob'), false)
})

test('isThreadUnread is false for someone who is not a participant', () => {
  const base = { initiatorId: 'alice', ownerId: 'bob', lastMessageAt: hoursAgo(1), initiatorLastReadAt: null, ownerLastReadAt: null }
  assert.equal(isThreadUnread(base, 'carol'), false)
})
