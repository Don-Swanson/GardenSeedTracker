'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Sprout, Menu, X } from 'lucide-react'
import { useState } from 'react'
import ThemeToggle from '@/components/ThemeToggle'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Public Navigation */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-garden-500 rounded-xl flex items-center justify-center">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
                Garden Seed Tracker
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/plants"
                className="text-gray-600 dark:text-gray-300 hover:text-garden-600 dark:hover:text-garden-400 transition-colors"
              >
                Plant Encyclopedia
              </Link>
              <Link
                href="/pricing"
                className="text-gray-600 dark:text-gray-300 hover:text-garden-600 dark:hover:text-garden-400 transition-colors"
              >
                Pricing
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              
              {status === 'loading' ? (
                <div className="w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              ) : session ? (
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-garden-600 text-white font-medium rounded-lg hover:bg-garden-700 transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <div className="hidden md:flex items-center gap-3">
                  <Link
                    href="/auth/signin"
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:text-garden-600 dark:hover:text-garden-400 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="px-4 py-2 bg-garden-600 text-white font-medium rounded-lg hover:bg-garden-700 transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="px-4 py-4 space-y-3">
              <Link
                href="/plants"
                className="block px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Plant Encyclopedia
              </Link>
              <Link
                href="/pricing"
                className="block px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              {!session && (
                <>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  <Link
                    href="/auth/signin"
                    className="block px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block px-3 py-2 bg-garden-600 text-white text-center rounded-lg hover:bg-garden-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-garden-500 rounded-xl flex items-center justify-center">
                  <Sprout className="w-6 h-6 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  Garden Seed Tracker
                </span>
              </Link>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your digital companion for tracking seeds, planning plantings, and growing success.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/plants" className="text-gray-500 dark:text-gray-400 hover:text-garden-600 dark:hover:text-garden-400">
                    Plant Encyclopedia
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-gray-500 dark:text-gray-400 hover:text-garden-600 dark:hover:text-garden-400">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Account</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/auth/signin" className="text-gray-500 dark:text-gray-400 hover:text-garden-600 dark:hover:text-garden-400">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="text-gray-500 dark:text-gray-400 hover:text-garden-600 dark:hover:text-garden-400">
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/privacy" className="text-gray-500 dark:text-gray-400 hover:text-garden-600 dark:hover:text-garden-400">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-500 dark:text-gray-400 hover:text-garden-600 dark:hover:text-garden-400">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Garden Seed Tracker. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
