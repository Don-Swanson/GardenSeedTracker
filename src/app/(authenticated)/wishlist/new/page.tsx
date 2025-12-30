'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Star } from 'lucide-react'
import Link from 'next/link'

export default function NewWishlistItemPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [priority, setPriority] = useState(3)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      variety: formData.get('variety') || null,
      brand: formData.get('brand') || null,
      estimatedPrice: parseFloat(formData.get('estimatedPrice') as string) || null,
      priority,
      sourceUrl: formData.get('sourceUrl') || null,
      notes: formData.get('notes') || null,
    }

    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Failed to add item')

      router.push('/wishlist')
      router.refresh()
    } catch (err) {
      setError('Failed to add item. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/wishlist" className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm mb-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Wishlist
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Add to Wishlist</h1>
        <p className="text-gray-600 mt-1">Add seeds you want to buy</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="label">Name *</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              required 
              className="input"
              placeholder="e.g., Tomato"
            />
          </div>
          <div>
            <label htmlFor="variety" className="label">Variety</label>
            <input 
              type="text" 
              id="variety" 
              name="variety" 
              className="input"
              placeholder="e.g., Brandywine"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="brand" className="label">Brand</label>
            <input 
              type="text" 
              id="brand" 
              name="brand" 
              className="input"
              placeholder="e.g., Baker Creek"
            />
          </div>
          <div>
            <label htmlFor="estimatedPrice" className="label">Estimated Price ($)</label>
            <input 
              type="number" 
              id="estimatedPrice" 
              name="estimatedPrice"
              step="0.01"
              min="0" 
              className="input"
              placeholder="e.g., 3.50"
            />
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="label">Priority</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className="p-1"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    p <= (6 - priority)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300 hover:text-yellow-200'
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-500">
              {priority === 1 ? 'Highest' : priority === 5 ? 'Lowest' : 'Medium'} priority
            </span>
          </div>
        </div>

        {/* Source URL */}
        <div>
          <label htmlFor="sourceUrl" className="label">Source URL</label>
          <input 
            type="url" 
            id="sourceUrl" 
            name="sourceUrl" 
            className="input"
            placeholder="https://..."
          />
          <p className="text-xs text-gray-500 mt-1">Link to where you can buy this seed</p>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="label">Notes</label>
          <textarea 
            id="notes" 
            name="notes" 
            rows={3}
            className="input"
            placeholder="Why you want this seed, when to buy, etc."
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Adding...' : 'Add to Wishlist'}
          </button>
          <Link href="/wishlist" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
