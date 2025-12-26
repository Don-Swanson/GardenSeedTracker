'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { plantingStatuses } from '@/lib/garden-utils'

interface Seed {
  id: string
  name: string
  variety: string | null
}

export default function NewPlantingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedSeedId = searchParams.get('seedId')
  
  const [seeds, setSeeds] = useState<Seed[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/seeds')
      .then(res => res.json())
      .then(data => setSeeds(data))
      .catch(() => setError('Failed to load seeds'))
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      seedId: formData.get('seedId'),
      plantingDate: formData.get('plantingDate'),
      location: formData.get('location'),
      quantityPlanted: parseInt(formData.get('quantityPlanted') as string) || 1,
      method: formData.get('method') || null,
      status: formData.get('status') || 'planted',
      notes: formData.get('notes') || null,
      initialNotes: formData.get('initialNotes') || null,
    }

    try {
      const res = await fetch('/api/plantings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Failed to create planting')

      router.push('/plantings')
      router.refresh()
    } catch (err) {
      setError('Failed to log planting. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/plantings" className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm mb-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Plantings
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Log Planting</h1>
        <p className="text-gray-600 mt-1">Record where and when you planted seeds</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Seed Selection */}
        <div>
          <label htmlFor="seedId" className="label">Seed *</label>
          <select 
            id="seedId" 
            name="seedId" 
            required 
            className="input"
            defaultValue={preselectedSeedId || ''}
          >
            <option value="">Select a seed from your inventory</option>
            {seeds.map(seed => (
              <option key={seed.id} value={seed.id}>
                {seed.name}{seed.variety ? ` (${seed.variety})` : ''}
              </option>
            ))}
          </select>
          {seeds.length === 0 && !error && (
            <p className="text-sm text-gray-500 mt-1">
              Loading seeds...
            </p>
          )}
        </div>

        {/* Date and Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="plantingDate" className="label">Planting Date *</label>
            <input 
              type="date" 
              id="plantingDate" 
              name="plantingDate" 
              required
              defaultValue={new Date().toISOString().split('T')[0]}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="location" className="label">Location *</label>
            <input 
              type="text" 
              id="location" 
              name="location" 
              required
              className="input"
              placeholder="e.g., Raised Bed A, Row 2, Container #3"
            />
          </div>
        </div>

        {/* Quantity, Method, and Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="quantityPlanted" className="label">Quantity Planted</label>
            <input 
              type="number" 
              id="quantityPlanted" 
              name="quantityPlanted" 
              defaultValue={1}
              min={1}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="method" className="label">Planting Method</label>
            <select id="method" name="method" className="input" defaultValue="">
              <option value="">Select method...</option>
              <option value="direct sow">Direct Sow</option>
              <option value="transplant">Transplant</option>
              <option value="indoor start">Indoor Start</option>
              <option value="succession">Succession Planting</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" className="label">Status</label>
            <select id="status" name="status" className="input" defaultValue="planted">
              {plantingStatuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="label">General Notes</label>
          <textarea 
            id="notes" 
            name="notes" 
            rows={2}
            className="input"
            placeholder="General notes about this planting location/project..."
          />
        </div>

        <div>
          <label htmlFor="initialNotes" className="label">Notes for this planting date</label>
          <textarea 
            id="initialNotes" 
            name="initialNotes" 
            rows={2}
            className="input"
            placeholder="Specific notes for this planting date (weather, soil conditions, etc.)..."
          />
        </div>

        <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
          💡 <strong>Tip:</strong> You can add more planting dates later from the planting detail page. 
          This is useful for succession planting or when you plant the same seed multiple times.
        </p>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Log Planting'}
          </button>
          <Link href="/plantings" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
