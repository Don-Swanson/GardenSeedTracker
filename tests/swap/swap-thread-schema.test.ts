import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'

const directory = mkdtempSync(join(tmpdir(), 'gst-swap-thread-test-'))
const url = `file:${directory}/garden.db`
let prisma: PrismaClient

before(() => {
  writeFileSync(join(directory, 'garden.db'), '')
  execFileSync(process.execPath, ['--import', 'tsx', 'scripts/database/initialize.ts'], {
    env: { ...process.env, DATABASE_URL: url }, stdio: 'pipe',
  })
  prisma = new PrismaClient({ datasources: { db: { url } } })
})
after(async () => { await prisma?.$disconnect(); rmSync(directory, { recursive: true, force: true }) })

async function makeUserAndListing(emailPrefix: string) {
  const owner = await prisma.user.create({ data: { email: `${emailPrefix}-owner@example.test`, username: `${emailPrefix}owner` } })
  const listing = await prisma.swapListing.create({ data: { userId: owner.id, type: 'offer', customPlantName: 'Tomato' } })
  return { owner, listing }
}

test('a listing/initiator pair can only have one thread', async () => {
  const { owner, listing } = await makeUserAndListing('unique')
  const initiator = await prisma.user.create({ data: { email: 'unique-initiator@example.test', username: 'uniqueinitiator' } })

  await prisma.swapThread.create({ data: { listingId: listing.id, initiatorId: initiator.id, ownerId: owner.id } })
  await assert.rejects(
    prisma.swapThread.create({ data: { listingId: listing.id, initiatorId: initiator.id, ownerId: owner.id } }),
    /Unique constraint/,
  )
})

test('deleting a listing cascades to its threads and messages', async () => {
  const { owner, listing } = await makeUserAndListing('cascade')
  const initiator = await prisma.user.create({ data: { email: 'cascade-initiator@example.test', username: 'cascadeinitiator' } })
  const thread = await prisma.swapThread.create({ data: { listingId: listing.id, initiatorId: initiator.id, ownerId: owner.id } })
  await prisma.swapMessage.create({ data: { threadId: thread.id, senderId: initiator.id, body: 'Hello!' } })

  await prisma.swapListing.delete({ where: { id: listing.id } })

  assert.equal(await prisma.swapThread.findUnique({ where: { id: thread.id } }), null)
  assert.equal(await prisma.swapMessage.count({ where: { threadId: thread.id } }), 0)
})

test('a fresh thread is unread for the owner and read for the initiator who just sent it', async () => {
  const { owner, listing } = await makeUserAndListing('readstate')
  const initiator = await prisma.user.create({ data: { email: 'readstate-initiator@example.test', username: 'readstateinitiator' } })
  // Set both explicitly (rather than mixing a DB-computed default with a
  // separately-computed JS Date) so the ordering is deterministic instead of
  // depending on clock/rounding precision between the two.
  const now = new Date()
  const thread = await prisma.swapThread.create({
    data: { listingId: listing.id, initiatorId: initiator.id, ownerId: owner.id, lastMessageAt: now, initiatorLastReadAt: now },
  })

  const { isThreadUnread } = await import('../../src/lib/swap')
  assert.equal(isThreadUnread(thread, initiator.id), false)
  assert.equal(isThreadUnread(thread, owner.id), true)
})
