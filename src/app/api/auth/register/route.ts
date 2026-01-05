import { NextResponse } from 'next/server'

// With magic link authentication, registration is handled automatically
// when a user signs in with their email for the first time
export async function POST() {
  return NextResponse.json(
    { 
      error: 'Registration is handled automatically. Please sign in with your email.',
      redirect: '/auth/signin'
    },
    { status: 410 } // Gone - endpoint deprecated
  )
}
