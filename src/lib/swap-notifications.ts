import { prisma } from './prisma'
import { generateSwapMessageNotificationEmailHtml } from './swap-message-email'
import { shouldSendThreadNotification } from './swap'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

/**
 * Called after a swap message is created. Applies the per-thread throttle
 * and the recipient's opt-out, and records lastNotifiedAt before sending so
 * a slow email provider can't cause a duplicate send on retry. Failures are
 * swallowed - a notification email must never fail the message send itself.
 */
export async function notifyThreadParticipant(params: {
  threadId: string
  recipientId: string
  senderUsername: string
  plantName: string
}): Promise<void> {
  try {
    const thread = await prisma.swapThread.findUnique({ where: { id: params.threadId }, select: { lastNotifiedAt: true } })
    if (!thread || !shouldSendThreadNotification(thread.lastNotifiedAt)) return

    const recipient = await prisma.user.findUnique({
      where: { id: params.recipientId },
      select: { email: true, name: true, settings: { select: { swapMessageEmails: true } } },
    })
    if (!recipient?.email || recipient.settings?.swapMessageEmails === false) return

    await prisma.swapThread.update({ where: { id: params.threadId }, data: { lastNotifiedAt: new Date() } })
    await notifySwapMessageRecipient({
      recipientEmail: recipient.email,
      recipientName: recipient.name || 'Gardener',
      senderUsername: params.senderUsername,
      plantName: params.plantName,
    })
  } catch (error) {
    console.error('Failed to send swap message notification:', error)
  }
}

/**
 * "You have a new swap board message" email - sent via nodemailer, matching
 * the rest of the app's notification emails (support, admin notifications).
 * Never includes the message text or either party's email address; see
 * generateSwapMessageNotificationEmailHtml for why.
 */
export async function notifySwapMessageRecipient(params: {
  recipientEmail: string
  recipientName: string
  senderUsername: string
  plantName: string
}): Promise<void> {
  const html = generateSwapMessageNotificationEmailHtml({
    recipientName: params.recipientName,
    senderUsername: params.senderUsername,
    plantName: params.plantName,
    inboxUrl: `${process.env.NEXTAUTH_URL}/swap/inbox`,
    settingsUrl: `${process.env.NEXTAUTH_URL}/settings`,
  })
  const subject = `New swap board message from @${params.senderUsername}`

  if (!IS_PRODUCTION) {
    console.log('━'.repeat(60))
    console.log('📧 SWAP MESSAGE NOTIFICATION (DEV MODE - NOT SENT)')
    console.log('━'.repeat(60))
    console.log(`To: ${params.recipientEmail}`)
    console.log(`Subject: ${subject}`)
    console.log('━'.repeat(60))
    return
  }

  try {
    const nodemailer = require('nodemailer')
    const transport = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
      secure: process.env.EMAIL_SERVER_PORT === '465',
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    })

    await transport.sendMail({
      from: process.env.EMAIL_FROM || 'Garden Seed Tracker <noreply@example.com>',
      to: params.recipientEmail,
      subject,
      html,
    })

    console.log(`✅ Swap message notification sent to ${params.recipientEmail}`)
  } catch (error) {
    // Best-effort: a failed notification email should never fail the
    // message send itself.
    console.error(`❌ Failed to send swap message notification to ${params.recipientEmail}:`, error)
  }
}
