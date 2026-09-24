import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'
import { isBlockedEitherWay } from '../../src/lib/swap'

const directory = mkdtempSync(join(tmpdir(), 'gst-swap-moderation-test-'))
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

test('isBlockedEitherWay is true regardless of who blocked whom', async () => {
  const alice = await prisma.user.create({ data: { email: 'alice@example.test', username: 'alice' } })
  const bob = await prisma.user.create({ data: { email: 'bob@example.test', username: 'bob' } })
  const carol = await prisma.user.create({ data: { email: 'carol@example.test', username: 'carol' } })

  assert.equal(await isBlockedEitherWay(prisma, alice.id, bob.id), false)

  await prisma.userBlock.create({ data: { blockerId: alice.id, blockedId: bob.id } })
  assert.equal(await isBlockedEitherWay(prisma, alice.id, bob.id), true)
  assert.equal(await isBlockedEitherWay(prisma, bob.id, alice.id), true) // symmetric check
  assert.equal(await isBlockedEitherWay(prisma, alice.id, carol.id), false)
})

test('a block can only be recorded once per pair (unique constraint)', async () => {
  const dave = await prisma.user.create({ data: { email: 'dave@example.test', username: 'dave' } })
  const erin = await prisma.user.create({ data: { email: 'erin@example.test', username: 'erin' } })
  await prisma.userBlock.create({ data: { blockerId: dave.id, blockedId: erin.id } })
  await assert.rejects(
    prisma.userBlock.create({ data: { blockerId: dave.id, blockedId: erin.id } }),
    /Unique constraint/,
  )
})

test('deleting a reported listing cascades to its report', async () => {
  const owner = await prisma.user.create({ data: { email: 'owner@example.test', username: 'reportowner' } })
  const reporter = await prisma.user.create({ data: { email: 'reporter@example.test', username: 'reporter' } })
  const listing = await prisma.swapListing.create({ data: { userId: owner.id, type: 'offer', customPlantName: 'Basil' } })
  const report = await prisma.swapReport.create({
    data: { reporterId: reporter.id, listingId: listing.id, reportedUserId: owner.id, reason: 'Spam' },
  })

  await prisma.swapListing.delete({ where: { id: listing.id } })
  assert.equal(await prisma.swapReport.findUnique({ where: { id: report.id } }), null)
})

test('a message report resolves to the sender as the reported user', async () => {
  const owner = await prisma.user.create({ data: { email: 'msgowner@example.test', username: 'msgowner' } })
  const sender = await prisma.user.create({ data: { email: 'msgsender@example.test', username: 'msgsender' } })
  const listing = await prisma.swapListing.create({ data: { userId: owner.id, type: 'offer', customPlantName: 'Mint' } })
  const thread = await prisma.swapThread.create({ data: { listingId: listing.id, initiatorId: sender.id, ownerId: owner.id } })
  const message = await prisma.swapMessage.create({ data: { threadId: thread.id, senderId: sender.id, body: 'hi' } })

  const report = await prisma.swapReport.create({
    data: { reporterId: owner.id, messageId: message.id, reportedUserId: sender.id, reason: 'Rude' },
  })
  const found = await prisma.swapReport.findUnique({ where: { id: report.id }, select: { reportedUserId: true } })
  assert.equal(found?.reportedUserId, sender.id)
})
