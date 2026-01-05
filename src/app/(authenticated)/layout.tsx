import Navigation from '@/components/Navigation'
import ImpersonationBanner from '@/components/ImpersonationBanner'
import Link from 'next/link'
import { Github } from 'lucide-react'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-garden-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col transition-colors duration-200">
      <ImpersonationBanner />
      <Navigation />
      <main className="container mx-auto px-4 py-8 flex-grow">
        {children}
      </main>
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 py-6 mt-auto transition-colors duration-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Garden Seed Tracker. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <a 
                href="https://github.com/Don-Swanson/GardenSeedTracker"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 dark:text-gray-400 hover:text-garden-600 dark:hover:text-garden-400 transition-colors flex items-center gap-1"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
              <Link href="/terms" className="text-gray-500 dark:text-gray-400 hover:text-garden-600 dark:hover:text-garden-400 transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-gray-500 dark:text-gray-400 hover:text-garden-600 dark:hover:text-garden-400 transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
