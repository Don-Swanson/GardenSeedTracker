'use client'

import { useSyncExternalStore } from 'react'
import { Sun, Moon } from 'lucide-react'

const subscribeTheme = (listener: () => void) => {
  window.addEventListener('storage', listener)
  window.addEventListener('gst-theme', listener)
  return () => { window.removeEventListener('storage', listener); window.removeEventListener('gst-theme', listener) }
}
const readTheme = () => localStorage.getItem('theme') === 'light' ? 'light' : 'dark'

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => null)

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', newTheme)
    window.dispatchEvent(new Event('gst-theme'))
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Don't render anything until mounted to avoid hydration mismatch
  if (!theme) {
    return <div className="w-9 h-9" /> // Placeholder to prevent layout shift
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-gray-600" />
      )}
    </button>
  )
}
