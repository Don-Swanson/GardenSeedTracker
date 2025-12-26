'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { seedCategories, sunRequirements, waterNeeds } from '@/lib/garden-utils'

export default function NewSeedPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      variety: formData.get('variety') || null,
      brand: formData.get('brand') || null,
      quantity: parseInt(formData.get('quantity') as string) || 1,
      quantityUnit: formData.get('quantityUnit') || 'seeds',
      purchaseDate: formData.get('purchaseDate') || null,
      expirationDate: formData.get('expirationDate') || null,
      daysToGerminate: parseInt(formData.get('daysToGerminate') as string) || null,
      daysToMaturity: parseInt(formData.get('daysToMaturity') as string) || null,
      sunRequirement: formData.get('sunRequirement') || null,
      waterNeeds: formData.get('waterNeeds') || null,
      spacing: formData.get('spacing') || null,
      plantingDepth: formData.get('plantingDepth') || null,
      category: formData.get('category') || null,
      notes: formData.get('notes') || null,
    }

    try {
      const res = await fetch('/api/seeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Failed to create seed')

      router.push('/seeds')
      router.refresh()
    } catch (err) {
      setError('Failed to create seed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/seeds" className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm mb-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Seeds
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Add New Seeds</h1>
        <p className="text-gray-600 mt-1">Add seeds to your inventory</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900 border-b pb-2">Basic Information</h2>
          
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
                placeholder="e.g., Cherokee Purple"
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
                placeholder="e.g., Burpee"
              />
            </div>
            <div>
              <label htmlFor="category" className="label">Category</label>
              <select id="category" name="category" className="input">
                <option value="">Select category</option>
                {seedCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.emoji} {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quantity */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900 border-b pb-2">Quantity & Dates</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="quantity" className="label">Quantity</label>
              <input 
                type="number" 
                id="quantity" 
                name="quantity" 
                defaultValue={1}
                min={0}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="quantityUnit" className="label">Unit</label>
              <select id="quantityUnit" name="quantityUnit" className="input">
                <option value="seeds">Seeds</option>
                <option value="packets">Packets</option>
                <option value="grams">Grams</option>
                <option value="ounces">Ounces</option>
              </select>
            </div>
            <div>
              <label htmlFor="purchaseDate" className="label">Purchase Date</label>
              <input 
                type="date" 
                id="purchaseDate" 
                name="purchaseDate" 
                className="input"
              />
            </div>
          </div>

          <div>
            <label htmlFor="expirationDate" className="label">Expiration Date</label>
            <input 
              type="date" 
              id="expirationDate" 
              name="expirationDate" 
              className="input"
            />
          </div>
        </div>

        {/* Growing Info */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900 border-b pb-2">Growing Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="daysToGerminate" className="label">Days to Germinate</label>
              <input 
                type="number" 
                id="daysToGerminate" 
                name="daysToGerminate" 
                min={0}
                className="input"
                placeholder="e.g., 7"
              />
            </div>
            <div>
              <label htmlFor="daysToMaturity" className="label">Days to Maturity</label>
              <input 
                type="number" 
                id="daysToMaturity" 
                name="daysToMaturity" 
                min={0}
                className="input"
                placeholder="e.g., 75"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sunRequirement" className="label">Sun Requirement</label>
              <select id="sunRequirement" name="sunRequirement" className="input">
                <option value="">Select sun requirement</option>
                {sunRequirements.map(sun => (
                  <option key={sun.value} value={sun.value}>
                    {sun.icon} {sun.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="waterNeeds" className="label">Water Needs</label>
              <select id="waterNeeds" name="waterNeeds" className="input">
                <option value="">Select water needs</option>
                {waterNeeds.map(water => (
                  <option key={water.value} value={water.value}>
                    {water.label} - {water.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="spacing" className="label">Spacing</label>
              <input 
                type="text" 
                id="spacing" 
                name="spacing" 
                className="input"
                placeholder="e.g., 24 inches apart"
              />
            </div>
            <div>
              <label htmlFor="plantingDepth" className="label">Planting Depth</label>
              <input 
                type="text" 
                id="plantingDepth" 
                name="plantingDepth" 
                className="input"
                placeholder="e.g., 1/4 inch"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="label">Notes</label>
          <textarea 
            id="notes" 
            name="notes" 
            rows={3}
            className="input"
            placeholder="Any additional notes..."
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
            {loading ? 'Saving...' : 'Save Seeds'}
          </button>
          <Link href="/seeds" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
