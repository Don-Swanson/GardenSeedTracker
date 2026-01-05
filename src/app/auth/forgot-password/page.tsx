import { redirect } from 'next/navigation'

// With magic link authentication, there's no password to forget
// Users just request a new magic link from the signin page
export default function ForgotPasswordPage() {
  redirect('/auth/signin')
}
