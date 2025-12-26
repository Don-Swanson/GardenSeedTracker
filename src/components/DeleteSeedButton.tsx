'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

interface DeleteSeedButtonProps {
  seedId: string
  seedName: string
}

export default function DeleteSeedButton({ seedId, seedName }: DeleteSeedButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${seedName}"? This will also delete all associated planting records.`)) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/seeds/${seedId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete')

      router.push('/seeds')
      router.refresh()
    } catch (error) {
      alert('Failed to delete seed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="btn btn-danger flex items-center gap-2"
    >
      <Trash2 className="w-4 h-4" />
      {loading ? 'Deleting...' : 'Delete'}
    </button>
  )
}
