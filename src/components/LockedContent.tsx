'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'

interface LockedContentProps {
  /** Whether the user has access to this content */
  hasAccess: boolean
  /** Whether there is actual data to show (helps determine if we show placeholder or blur) */
  hasData?: boolean
  /** The content to show when user has access */
  children: React.ReactNode
  /** Placeholder text to show when locked and no data */
  placeholder?: string
  /** Optional class name for the container */
  className?: string
  /** Show as inline element (for within text) */
  inline?: boolean
  /** Custom message for the upgrade prompt */
  upgradeMessage?: string
}

/**
 * Component that shows blurred/locked content for free users.
 * Free users can enter data but cannot view it once saved.
 * Shows a teaser of what they're missing to encourage upgrades.
 */
export default function LockedContent({
  hasAccess,
  hasData = true,
  children,
  placeholder = '••••••••',
  className = '',
  inline = false,
  upgradeMessage,
}: LockedContentProps) {
  // If user has access, just show the content
  if (hasAccess) {
    return <>{children}</>
  }

  // If no data exists, show a subtle locked placeholder
  if (!hasData) {
    if (inline) {
      return (
        <span className={`text-gray-400 italic ${className}`}>
          {placeholder}
        </span>
      )
    }
    return (
      <div className={`text-gray-400 italic ${className}`}>
        {placeholder}
      </div>
    )
  }

  // Data exists but user can't see it - show blurred content with lock
  if (inline) {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <span className="blur-sm select-none text-gray-500">Hidden</span>
        <Lock className="w-3 h-3 text-amber-500 flex-shrink-0" />
      </span>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Blurred content preview */}
      <div className="blur-sm select-none pointer-events-none opacity-60">
        {children}
      </div>
      
      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 rounded">
        <div className="text-center px-3 py-2">
          <Lock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {upgradeMessage || 'Pro feature'}
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * A card-level locked content wrapper with upgrade CTA
 */
export function LockedCard({
  hasAccess,
  hasData = true,
  children,
  title,
  featureName,
  className = '',
}: {
  hasAccess: boolean
  hasData?: boolean
  children: React.ReactNode
  title: string
  featureName: string
  className?: string
}) {
  if (hasAccess) {
    return <>{children}</>
  }

  return (
    <div className={`card relative overflow-hidden ${className}`}>
      {/* Header still visible */}
      <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        {title}
        <span className="inline-flex items-center gap-1 text-xs font-normal bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
          <Lock className="w-3 h-3" />
          Pro
        </span>
      </h2>

      {hasData ? (
        <>
          {/* Blurred content */}
          <div className="blur-sm select-none pointer-events-none opacity-50">
            {children}
          </div>
          
          {/* Upgrade overlay */}
          <div className="absolute inset-0 top-12 flex items-center justify-center bg-gradient-to-t from-white via-white/90 to-transparent dark:from-gray-800 dark:via-gray-800/90">
            <div className="text-center px-4">
              <Lock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Upgrade to Pro to view your {featureName.toLowerCase()}
              </p>
              <Link
                href="/upgrade"
                className="inline-flex items-center gap-2 bg-garden-600 hover:bg-garden-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Unlock {featureName}
              </Link>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-6">
          <Lock className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {featureName} is a Pro feature
          </p>
          <Link
            href="/upgrade"
            className="text-sm text-garden-600 hover:text-garden-700 dark:text-garden-400"
          >
            Upgrade to unlock →
          </Link>
        </div>
      )}
    </div>
  )
}

/**
 * Simple inline badge showing content is locked
 */
export function ProBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full ${className}`}>
      <Lock className="w-3 h-3" />
      Pro
    </span>
  )
}
