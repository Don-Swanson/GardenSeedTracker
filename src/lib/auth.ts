import { PrismaAdapter } from '@auth/prisma-adapter'
import { NextAuthOptions, getServerSession } from 'next-auth'
import { Adapter } from 'next-auth/adapters'
import EmailProvider from 'next-auth/providers/email'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from './prisma'

// Email sending function - configure with your email service
async function sendVerificationRequest({
  identifier: email,
  url,
  provider,
}: {
  identifier: string
  url: string
  provider: { from: string }
}) {
  const IS_PRODUCTION = process.env.NODE_ENV === 'production'
  
  // In production, use a real email service (SendGrid, Resend, AWS SES, etc.)
  // SECURITY: Only log magic links in development, never in production
  if (!IS_PRODUCTION) {
    console.log('━'.repeat(60))
    console.log('🔐 MAGIC LINK LOGIN (DEV ONLY)')
    console.log('━'.repeat(60))
    console.log(`Email: ${email}`)
    console.log(`Click to sign in: ${url}`)
    console.log('━'.repeat(60))
  }
  
  // Example SendGrid implementation:
  // const sgMail = require('@sendgrid/mail')
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY)
  // await sgMail.send({
  //   to: email,
  //   from: provider.from,
  //   subject: 'Sign in to GardenSeed Tracker',
  //   html: `
  //     <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  //       <h1 style="color: #16a34a;">🌱 GardenSeed Tracker</h1>
  //       <p>Click the button below to sign in to your account:</p>
  //       <a href="${url}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
  //         Sign In
  //       </a>
  //       <p style="margin-top: 24px; color: #666; font-size: 14px;">
  //         This link expires in 24 hours. If you didn't request this, you can safely ignore this email.
  //       </p>
  //     </div>
  //   `,
  // })
}

// Session duration constants
const ONE_DAY = 24 * 60 * 60 // 1 day in seconds
const ONE_YEAR = 365 * 24 * 60 * 60 // 1 year in seconds

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: 'database', // Use database sessions for flexible duration
    maxAge: ONE_DAY, // Default: 1 day (can be extended with "remember me")
    updateAge: 60 * 60, // Update session every hour
  },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
    error: '/auth/error',
  },
  providers: [
    // Passwordless email magic link authentication
    EmailProvider({
      server: process.env.EMAIL_SERVER || {
        host: process.env.EMAIL_SERVER_HOST || 'smtp.example.com',
        port: Number(process.env.EMAIL_SERVER_PORT) || 587,
        auth: {
          user: process.env.EMAIL_SERVER_USER || '',
          pass: process.env.EMAIL_SERVER_PASSWORD || '',
        },
      },
      from: process.env.EMAIL_FROM || 'noreply@gardenseedtracker.com',
      maxAge: 24 * 60 * 60, // Magic link valid for 24 hours
      sendVerificationRequest,
    }),
    // Google OAuth (optional - requires env vars)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async session({ session, user }) {
      // With database sessions, we get the user object directly
      if (session.user && user) {
        session.user.id = user.id
        // Fetch additional user details
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { 
            isPaid: true, 
            role: true,
            subscriptionStatus: true,
            trialEndDate: true,
            isLifetimeMember: true,
          },
        })
        if (dbUser) {
          // Check if user has active access (paid, trial, or lifetime)
          let hasAccess = dbUser.isPaid
          
          // Lifetime members always have access
          if (dbUser.isLifetimeMember) {
            hasAccess = true
          }
          
          // Active trial grants access
          if (dbUser.subscriptionStatus === 'trial' && dbUser.trialEndDate) {
            const trialEnd = new Date(dbUser.trialEndDate)
            if (trialEnd > new Date()) {
              hasAccess = true
            }
          }
          
          session.user.isPaid = hasAccess
          session.user.role = dbUser.role
        }
      }
      return session
    },
    async signIn({ user }) {
      // Check if the user wants to be remembered (passed via URL params)
      // This is handled separately in the extend-session endpoint
      return true
    },
  },
  events: {
    async createUser({ user }) {
      // Create default user settings when a new user signs up
      await prisma.userSettings.create({
        data: {
          userId: user.id,
          hardinessZone: '7a', // Default zone
        },
      })
    },
  },
}

export async function getAuthSession() {
  return await getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getAuthSession()
  
  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { settings: true },
  })

  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}

export async function requirePaidUser() {
  const user = await requireAuth()
  
  if (!user.isPaid) {
    throw new Error('This feature requires a paid subscription')
  }
  
  return user
}
