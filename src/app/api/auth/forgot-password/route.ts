import { NextResponse } from 'next/server'

// With magic link authentication, there's no password to reset
// Users just request a new magic link from the signin page
export async function POST() {
  return NextResponse.json(
    { 
      message: 'Password reset is not needed. Please sign in with your email to receive a magic link.',
      redirect: '/auth/signin'
    },
    { status: 410 } // Gone - endpoint deprecated
  )
}
