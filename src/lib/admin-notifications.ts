/**
 * Admin Email Notifications
 * 
 * Sends email notifications to admins for important events
 */

import { prisma } from './prisma'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

export type AdminNotificationType = 
  | 'newUserSignup'
  | 'userDeleted'
  | 'newPlantSubmission'
  | 'newPlantSuggestion'
  | 'newPlantRequest'
  | 'errorAlerts'

interface NotificationData {
  userEmail?: string
  userName?: string
  plantName?: string
  errorMessage?: string
  additionalInfo?: Record<string, any>
}

/**
 * Get all admin emails that have subscribed to a specific notification type
 */
async function getSubscribedAdmins(notificationType: AdminNotificationType): Promise<string[]> {
  const settings = await prisma.adminNotificationSettings.findMany({
    where: {
      [notificationType]: true
    },
    select: {
      adminEmail: true
    }
  })
  
  return settings.map((s: { adminEmail: string }) => s.adminEmail)
}

/**
 * Send an email using nodemailer
 */
async function sendEmail(to: string, subject: string, html: string, text: string) {
  if (!IS_PRODUCTION) {
    console.log('━'.repeat(60))
    console.log('📧 ADMIN NOTIFICATION (DEV MODE - NOT SENT)')
    console.log('━'.repeat(60))
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`Body: ${text}`)
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
      to,
      subject,
      text,
      html,
    })

    console.log(`✅ Admin notification sent to ${to}: ${subject}`)
  } catch (error) {
    console.error(`❌ Failed to send admin notification to ${to}:`, error)
  }
}

/**
 * Generate email template wrapper
 */
function wrapInTemplate(title: string, content: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 20px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🌱 Garden Seed Tracker</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Admin Notification</p>
      </div>
      <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">${title}</h2>
        ${content}
      </div>
      <div style="background: #f9fafb; padding: 16px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          You're receiving this because you've subscribed to admin notifications. 
          <a href="${process.env.NEXTAUTH_URL}/admin/settings" style="color: #16a34a;">Manage preferences</a>
        </p>
      </div>
    </div>
  `
}

/**
 * Send notification to all subscribed admins
 */
export async function notifyAdmins(
  type: AdminNotificationType,
  data: NotificationData
) {
  const adminEmails = await getSubscribedAdmins(type)
  
  if (adminEmails.length === 0) {
    console.log(`No admins subscribed to ${type} notifications`)
    return
  }

  const { subject, html, text } = generateEmailContent(type, data)

  // Send to all subscribed admins
  await Promise.all(
    adminEmails.map(email => sendEmail(email, subject, html, text))
  )
}

/**
 * Generate email content based on notification type
 */
function generateEmailContent(type: AdminNotificationType, data: NotificationData): {
  subject: string
  html: string
  text: string
} {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  switch (type) {
    case 'newUserSignup':
      return {
        subject: `🆕 New User Signup: ${data.userEmail}`,
        html: wrapInTemplate('New User Registered', `
          <p style="color: #374151; line-height: 1.6;">A new user has signed up for Garden Seed Tracker:</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; color: #166534;"><strong>Email:</strong> ${data.userEmail}</p>
            ${data.userName ? `<p style="margin: 8px 0 0 0; color: #166534;"><strong>Name:</strong> ${data.userName}</p>` : ''}
          </div>
          <a href="${baseUrl}/admin/users" style="display: inline-block; background: #16a34a; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500;">View Users</a>
        `),
        text: `New User Signup\n\nEmail: ${data.userEmail}${data.userName ? `\nName: ${data.userName}` : ''}\n\nView users: ${baseUrl}/admin/users`
      }

    case 'userDeleted':
      return {
        subject: `🗑️ User Deleted: ${data.userEmail}`,
        html: wrapInTemplate('User Account Deleted', `
          <p style="color: #374151; line-height: 1.6;">A user account has been deleted:</p>
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; color: #991b1b;"><strong>Email:</strong> ${data.userEmail}</p>
          </div>
        `),
        text: `User Deleted\n\nEmail: ${data.userEmail}`
      }

    case 'newPlantSubmission':
      return {
        subject: `🌿 New Plant Submission: ${data.plantName}`,
        html: wrapInTemplate('New Plant Submission', `
          <p style="color: #374151; line-height: 1.6;">A user has submitted a new plant for review:</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; color: #166534;"><strong>Plant:</strong> ${data.plantName}</p>
            <p style="margin: 8px 0 0 0; color: #166534;"><strong>Submitted by:</strong> ${data.userEmail || data.userName || 'Anonymous'}</p>
          </div>
          <a href="${baseUrl}/admin/submissions" style="display: inline-block; background: #16a34a; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500;">Review Submission</a>
        `),
        text: `New Plant Submission\n\nPlant: ${data.plantName}\nSubmitted by: ${data.userEmail || data.userName || 'Anonymous'}\n\nReview: ${baseUrl}/admin/submissions`
      }

    case 'newPlantSuggestion':
      return {
        subject: `💡 New Plant Suggestion: ${data.plantName}`,
        html: wrapInTemplate('New Plant Suggestion', `
          <p style="color: #374151; line-height: 1.6;">A user has suggested an update to a plant:</p>
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; color: #1e40af;"><strong>Plant:</strong> ${data.plantName}</p>
            <p style="margin: 8px 0 0 0; color: #1e40af;"><strong>Suggested by:</strong> ${data.userEmail || data.userName || 'Anonymous'}</p>
            ${data.additionalInfo?.section ? `<p style="margin: 8px 0 0 0; color: #1e40af;"><strong>Section:</strong> ${data.additionalInfo.section}</p>` : ''}
          </div>
          <a href="${baseUrl}/admin/suggestions" style="display: inline-block; background: #16a34a; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500;">Review Suggestion</a>
        `),
        text: `New Plant Suggestion\n\nPlant: ${data.plantName}\nSuggested by: ${data.userEmail || data.userName || 'Anonymous'}\n\nReview: ${baseUrl}/admin/suggestions`
      }

    case 'newPlantRequest':
      return {
        subject: `📝 New Plant Request: ${data.plantName}`,
        html: wrapInTemplate('New Plant Request', `
          <p style="color: #374151; line-height: 1.6;">A user has requested a new plant to be added:</p>
          <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; color: #6b21a8;"><strong>Plant:</strong> ${data.plantName}</p>
            <p style="margin: 8px 0 0 0; color: #6b21a8;"><strong>Requested by:</strong> ${data.userEmail || 'User'}</p>
          </div>
          <a href="${baseUrl}/admin/plants" style="display: inline-block; background: #16a34a; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500;">View Requests</a>
        `),
        text: `New Plant Request\n\nPlant: ${data.plantName}\nRequested by: ${data.userEmail || 'User'}\n\nView requests: ${baseUrl}/admin/plants`
      }

    case 'errorAlerts':
      return {
        subject: `🚨 System Error Alert`,
        html: wrapInTemplate('System Error', `
          <p style="color: #374151; line-height: 1.6;">A system error has occurred:</p>
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; color: #991b1b; font-family: monospace; white-space: pre-wrap;">${data.errorMessage}</p>
          </div>
        `),
        text: `System Error\n\n${data.errorMessage}`
      }

    default:
      return {
        subject: 'Garden Seed Tracker Notification',
        html: wrapInTemplate('Notification', '<p>You have a new notification.</p>'),
        text: 'You have a new notification.'
      }
  }
}

/**
 * Initialize admin notification settings for a new admin
 */
export async function initializeAdminNotifications(adminEmail: string) {
  const existing = await prisma.adminNotificationSettings.findUnique({
    where: { adminEmail }
  })
  
  if (!existing) {
    await prisma.adminNotificationSettings.create({
      data: { adminEmail }
    })
    console.log(`✅ Created notification settings for admin: ${adminEmail}`)
  }
}

/**
 * Update admin notification preferences
 */
export async function updateAdminNotifications(
  adminEmail: string,
  preferences: {
    newUserSignup?: boolean
    userDeleted?: boolean
    newPlantSubmission?: boolean
    newPlantSuggestion?: boolean
    newPlantRequest?: boolean
    dailyDigest?: boolean
    weeklyDigest?: boolean
    errorAlerts?: boolean
  }
) {
  // Filter out undefined values to only update what was provided
  const updateData: any = {}
  const createData: any = { adminEmail }
  
  const keys = [
    'newUserSignup', 'userDeleted', 'newPlantSubmission',
    'newPlantSuggestion', 'newPlantRequest', 'dailyDigest', 'weeklyDigest', 'errorAlerts'
  ] as const
  
  for (const key of keys) {
    if (preferences[key] !== undefined) {
      updateData[key] = preferences[key]
      createData[key] = preferences[key]
    }
  }
  
  return prisma.adminNotificationSettings.upsert({
    where: { adminEmail },
    update: updateData,
    create: createData
  })
}

/**
 * Get admin notification preferences
 */
export async function getAdminNotifications(adminEmail: string) {
  return prisma.adminNotificationSettings.findUnique({
    where: { adminEmail }
  })
}
