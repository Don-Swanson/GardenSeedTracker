'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PackagePlus } from 'lucide-react'

interface SwapAddToInventoryButtonProps {
  plantTypeId: string | null
  customPlantName: string | null
  variety: string | null
}

// Shown on a completed "offer" listing to the person who received it - one
// click creates a starter seed entry (quantity defaults to 1; they can
// adjust it right away on the edit page this opens).
export default function SwapAddToInventoryButton({ plantTypeId, customPlantName, variety }: SwapAddToInventoryButtonProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/seeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plantTypeId, customPlantName, variety, quantity: 1, quantityUnit: 'seeds' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add to inventory')
      router.push(`/seeds/${data.id}/edit`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add to inventory')
    } finally {
      setSaving(false)
    }
  }

  return (
    <button onClick={handleAdd} disabled={saving} className="btn-primary flex items-center gap-2 text-sm">
      <PackagePlus className="w-4 h-4" /> {saving ? 'Adding...' : 'Add to My Inventory'}
    </button>
  )
}
