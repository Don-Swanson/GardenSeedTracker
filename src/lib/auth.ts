import { PrismaAdapter } from '@auth/prisma-adapter'
import { NextAuthOptions, getServerSession } from 'next-auth'
import { Adapter } from 'next-auth/adapters'
import EmailProvider from 'next-auth/providers/email'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from './prisma'
import { cookies } from 'next/headers'
import { notifyAdmins } from './admin-notifications'

// Email sending function - configure with your email service
async function sendVerificationRequest({
  identifier: email,
  url,
  provider,
}: {
  identifier: string
  url: string
  provider: { from: string; server: any }
}) {
  const IS_PRODUCTION = process.env.NODE_ENV === 'production'
  
  // Always log in non-production for debugging
  if (!IS_PRODUCTION) {
    console.log('━'.repeat(60))
    console.log('🔐 MAGIC LINK LOGIN (DEV ONLY)')
    console.log('━'.repeat(60))
    console.log(`Email: ${email}`)
    console.log(`Click to sign in: ${url}`)
    console.log('━'.repeat(60))
  }
  
  try {
    // Use nodemailer to send the email via SMTP
    const nodemailer = require('nodemailer')
    
    const transport = nodemailer.createTransport(provider.server)
    
    const result = await transport.sendMail({
      to: email,
      from: provider.from,
      subject: 'Sign in to Garden Seed Tracker',
      text: `Sign in to Garden Seed Tracker\n\nClick here to sign in: ${url}\n\nThis link expires in 24 hours. If you didn't request this, you can safely ignore this email.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #16a34a;">🌱 Garden Seed Tracker</h1>
          <p>Click the button below to sign in to your account:</p>
          <a href="${url}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Sign In
          </a>
          <p style="margin-top: 24px; color: #666; font-size: 14px;">
            This link expires in 24 hours. If you didn't request this, you can safely ignore this email.
          </p>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
          <p style="color: #888; font-size: 12px;">
            Garden Seed Tracker is open source! If you find it useful, consider 
            <a href="https://ko-fi.com/donswanson" style="color: #16a34a;">supporting the project</a>.
          </p>
        </div>
      `,
    })
    
    console.log(`✅ Magic link email sent to ${email}`)
    console.log(`📧 Message ID: ${result.messageId}`)
  } catch (error) {
    console.error('❌ Failed to send magic link email:', error)
    throw error
  }
}

// Session duration constants
const ONE_DAY = 24 * 60 * 60 // 1 day in seconds
const ONE_YEAR = 365 * 24 * 60 * 60 // 1 year in seconds

// Check if we're in production - either by NODE_ENV or by detecting HTTPS in NEXTAUTH_URL
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || 
  process.env.NEXTAUTH_URL?.startsWith('https://')

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: 'jwt', // Use JWT for middleware compatibility
    maxAge: ONE_DAY, // Default: 1 day (can be extended with "remember me")
  },
  // Use secure cookies in production (HTTPS)
  useSecureCookies: IS_PRODUCTION,
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
        secure: false, // Use TLS but not SSL
        // Only include auth if credentials are provided
        ...(process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD
          ? {
              auth: {
                user: process.env.EMAIL_SERVER_USER,
                pass: process.env.EMAIL_SERVER_PASSWORD,
              },
            }
          : {}),
      },
      from: process.env.EMAIL_FROM || 'Garden Seed Tracker <noreply@example.com>',
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
    async jwt({ token, user }) {
      // On initial sign in, add user data to token
      if (user) {
        token.id = user.id
        // Fetch user role
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        })
        if (dbUser) {
          token.role = dbUser.role
        }
      }
      return token
    },
    async session({ session, token }) {
      // Add token data to session
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
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
      // Check if this is the first user in the database - make them admin
      const userCount = await prisma.user.count()
      if (userCount === 1) {
        // This is the first user, make them admin
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'admin' }
        })
        console.log(`🔐 First user ${user.email} has been granted admin privileges`)
      }
      
      // Check if there's pending signup data for this email
      if (user.email) {
        const signupData = await prisma.signupData.findUnique({
          where: { email: user.email.toLowerCase() }
        })
        
        if (signupData && signupData.expiresAt > new Date()) {
          // Apply the signup data to the new user
          await prisma.user.update({
            where: { id: user.id },
            data: {
              name: signupData.name,
              username: signupData.username,
            }
          })
          
          // Delete the signup data
          await prisma.signupData.delete({
            where: { email: user.email.toLowerCase() }
          })
        }
      }
      
      // Create default user settings when a new user signs up
      await prisma.userSettings.create({
        data: {
          userId: user.id,
          hardinessZone: '7a', // Default zone
        },
      })

      // Notify admins of new user signup
      notifyAdmins('newUserSignup', {
        userEmail: user.email || undefined,
        userName: user.name || undefined,
      }).catch(err => console.error('Failed to notify admins of new user:', err))
    },
  },
}

export async function getAuthSession() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return session
  }
  
  // Check if admin is impersonating another user
  if (session?.user?.role === 'admin') {
    try {
      const cookieStore = await cookies()
      const impersonationCookie = cookieStore.get('impersonation')
      
      if (impersonationCookie) {
        const impersonationData = JSON.parse(impersonationCookie.value)
        
        // Verify the impersonation is valid and the admin matches
        if (impersonationData.adminId === session.user.id && impersonationData.user) {
          // Fetch fresh user data for the impersonated user
          const impersonatedUser = await prisma.user.findUnique({
            where: { id: impersonationData.user.id },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            }
          })
          
          if (impersonatedUser) {
            // Return session with impersonated user's data
            return {
              ...session,
              user: {
                ...session.user,
                id: impersonatedUser.id,
                email: impersonatedUser.email,
                name: impersonatedUser.name,
                role: impersonatedUser.role,
                // Keep track that this is an impersonation session
                isImpersonating: true,
                originalAdminId: session.user.id,
              }
            }
          }
        }
      }
    } catch (error) {
      // If there's an error parsing impersonation, just return normal session
      console.error('Error checking impersonation:', error)
    }
  }
  
  return session
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

export async function requireAdmin() {
  const user = await requireAuth()
  
  if (user.role !== 'admin') {
    throw new Error('Admin access required')
  }
  
  return user
}

export async function isAdmin() {
  const session = await getAuthSession()
  return session?.user?.role === 'admin'
}
