'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Send, HelpCircle, Bug, Lightbulb, MessageSquare, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

const categories = [
  { value: 'bug', label: 'Bug Report', icon: Bug, description: 'Something isn\'t working correctly' },
  { value: 'feature', label: 'Feature Request', icon: Lightbulb, description: 'Suggest a new feature or improvement' },
  { value: 'question', label: 'General Question', icon: HelpCircle, description: 'Ask about how to use the app' },
  { value: 'other', label: 'Other', icon: MessageSquare, description: 'Anything else' },
]

export default function SupportPage() {
  const { data: session } = useSession()
  const [category, setCategory] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!category || !subject.trim() || !message.trim()) {
      setError('Please fill in all fields')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          message: message.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit request')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Request Submitted!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Thank you for reaching out. We&apos;ll review your message and get back to you as soon as possible.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setSubmitted(false)
                setCategory('')
                setSubject('')
                setMessage('')
              }}
              className="btn btn-secondary"
            >
              Submit Another Request
            </button>
            <Link href="/dashboard" className="btn btn-primary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Request Support</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Have a question, found a bug, or want to suggest a feature? Let us know!
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Category Selection */}
        <div>
          <label className="label mb-3">What can we help you with?</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon
              const isSelected = category === cat.value
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? 'border-garden-500 bg-garden-50 dark:bg-garden-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-garden-300 dark:hover:border-garden-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      isSelected ? 'text-garden-600 dark:text-garden-400' : 'text-gray-400 dark:text-gray-500'
                    }`} />
                    <div>
                      <p className={`font-medium ${
                        isSelected ? 'text-garden-700 dark:text-garden-300' : 'text-gray-900 dark:text-white'
                      }`}>
                        {cat.label}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{cat.description}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="subject" className="label">Subject</label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="input"
            placeholder="Brief summary of your request"
            maxLength={100}
          />
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="label">Message</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="input min-h-[150px]"
            placeholder="Please provide as much detail as possible..."
            maxLength={2000}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
            {message.length}/2000 characters
          </p>
        </div>

        {/* User Info Display */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Submitting as:</strong> {session?.user?.email}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            We&apos;ll use this email to respond to your request.
          </p>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !category || !subject.trim() || !message.trim()}
            className="btn btn-primary flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Request
              </>
            )}
          </button>
          <Link href="/dashboard" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>

      {/* FAQ Link */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>💡 Tip:</strong> Check out our documentation
          for answers to common questions about features and usage.
        </p>
      </div>
    </div>
  )
}
