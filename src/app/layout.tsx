import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import AuthProvider from '@/components/AuthProvider'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Garden Seed Tracker',
  description: 'Track your seeds, plan your garden, and grow your own food',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gradient-to-br from-garden-50 to-white flex flex-col">
            <Navigation />
            <main className="container mx-auto px-4 py-8 flex-grow">
              {children}
            </main>
            <footer className="bg-white border-t border-gray-100 py-6 mt-auto">
              <div className="container mx-auto px-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-gray-500">
                    © {new Date().getFullYear()} Garden Seed Tracker. All rights reserved.
                  </p>
                  <div className="flex items-center gap-6 text-sm">
                    <Link href="/terms" className="text-gray-500 hover:text-garden-600 transition-colors">
                      Terms of Service
                    </Link>
                    <Link href="/privacy" className="text-gray-500 hover:text-garden-600 transition-colors">
                      Privacy Policy
                    </Link>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
