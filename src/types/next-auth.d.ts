import 'next-auth'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      isPaid: boolean
      role: string
    } & DefaultSession['user']
  }

  interface User {
    isPaid: boolean
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    isPaid: boolean
    role: string
  }
}
