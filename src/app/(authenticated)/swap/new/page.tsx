'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Repeat, AlertCircle, ArrowLeft } from 'lucide-react'

interface SeedOption {
  id: string
  nickname: string | null
  variety: string | null
  quantity: number
  quantityUnit: string
  customPlantName: string | null
  plantType: { id: string; name: string } | null
}

function NewSwapListingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectSeedId = searchParams.get('seedId')
  const initialType = searchParams.get('type') === 'want' ? 'want' : 'offer'

  const [type, setType] = useState<'offer' | 'want'>(initialType)
  const [seeds, setSeeds] = useState<SeedOption[]>([])
  const [seedId, setSeedId] = useState(preselectSeedId || '')
  const [customPlantName, setCustomPlantName] = useState('')
  const [variety, setVariety] = useState('')
  const [quantity, setQuantity] = useState('')
  const [description, setDescription] = useState('')
  const [shippingOk, setShippingOk] = useState(false)
  const [localPickupOk, setLocalPickupOk] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Offers can be linked to an in-stock seed - load the list once.
  useEffect(() => {
    if (type !== 'offer') return
    fetch('/api/seeds')
      .then(res => res.json())
      .then((data: SeedOption[]) => setSeeds(Array.isArray(data) ? data : []))
      .catch(() => setSeeds([]))
  }, [type])

  // Pre-fill from the selected seed once it's loaded.
  useEffect(() => {
    if (!seedId) return
    const seed = seeds.find(s => s.id === seedId)
    if (!seed) return
    setCustomPlantName(seed.plantType ? '' : (seed.customPlantName || seed.nickname || ''))
    setVariety(seed.variety || '')
    setQuantity(`${seed.quantity} ${seed.quantityUnit}`)
  }, [seedId, seeds])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const selectedSeed = seeds.find(s => s.id === seedId)
    if (!customPlantName.trim() && !selectedSeed?.plantType) {
      setError('Enter a plant name (or pick a seed already linked to the encyclopedia)')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/swap/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          seedId: type === 'offer' && seedId ? seedId : null,
          plantTypeId: selectedSeed?.plantType?.id || null,
          customPlantName: customPlantName.trim() || null,
          variety: variety.trim() || null,
          quantity: quantity.trim() || null,
          description: description.trim() || null,
          shippingOk,
          localPickupOk,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create listing')
      router.push(`/swap/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create listing')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link href="/swap" className="text-sm text-garden-600 dark:text-garden-400 hover:underline flex items-center gap-1 w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to Swap Board
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Repeat className="w-6 h-6 text-garden-600 dark:text-garden-400" />
          Post a Listing
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Your username and rough distance (never your exact location or contact info) are shown. Interested gardeners message you through your in-app inbox.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="flex gap-2">
          {(['offer', 'want'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => { setType(t); setSeedId('') }}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                type === t
                  ? 'bg-garden-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {t === 'offer' ? "I'm Offering" : "I'm Looking For"}
            </button>
          ))}
        </div>

        {type === 'offer' && seeds.length > 0 && (
          <div>
            <label className="label">Link to a seed in your inventory (optional)</label>
            <select value={seedId} onChange={(e) => setSeedId(e.target.value)} className="input">
              <option value="">Don&apos;t link - describe it below</option>
              {seeds.map(seed => (
                <option key={seed.id} value={seed.id}>
                  {seed.plantType?.name || seed.customPlantName || seed.nickname || 'Unnamed seed'}
                  {seed.variety ? ` (${seed.variety})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="label">Plant Name {seedId && seeds.find(s => s.id === seedId)?.plantType ? '' : '*'}</label>
          <input
            type="text"
            value={customPlantName}
            onChange={(e) => setCustomPlantName(e.target.value)}
            className="input"
            placeholder="e.g., Cherokee Purple Tomato"
            disabled={!!seeds.find(s => s.id === seedId)?.plantType}
          />
        </div>

        <div>
          <label className="label">Variety</label>
          <input type="text" value={variety} onChange={(e) => setVariety(e.target.value)} className="input" placeholder="e.g., heirloom" />
        </div>

        <div>
          <label className="label">Quantity</label>
          <input type="text" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="input" placeholder="e.g., a dozen seeds" maxLength={60} />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
            rows={4}
            placeholder="Growing conditions, harvest year, why you're swapping, etc."
          />
        </div>

        <div className="flex gap-6">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={localPickupOk} onChange={(e) => setLocalPickupOk(e.target.checked)} className="rounded border-gray-300" />
            Local pickup
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={shippingOk} onChange={(e) => setShippingOk(e.target.checked)} className="rounded border-gray-300" />
            Willing to ship
          </label>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Posting...' : 'Post Listing'}
        </button>
      </form>
    </div>
  )
}

export default function NewSwapListingPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>}>
      <NewSwapListingContent />
    </Suspense>
  )
}
