import { redirect } from 'next/navigation'

// With magic link authentication, there's no separate signup process
// Users just enter their email on the signin page and an account is created automatically
export default function SignUpPage() {
  redirect('/auth/signin')
}
