'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Undo, Trash2, Edit, Package } from 'lucide-react'
import Link from 'next/link'

interface WishlistItem {
  id: string
  name: string
  variety: string | null
  brand: string | null
  purchased: boolean
}

interface WishlistActionsProps {
  item: WishlistItem
}

export default function WishlistActions({ item }: WishlistActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleTogglePurchased = async () => {
    setLoading(true)
    try {
      await fetch(`/api/wishlist/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchased: !item.purchased }),
      })
      router.refresh()
    } catch (error) {
      alert('Failed to update item')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${item.name}" from wishlist?`)) return
    
    setLoading(true)
    try {
      await fetch(`/api/wishlist/${item.id}`, { method: 'DELETE' })
      router.refresh()
    } catch (error) {
      alert('Failed to delete item')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToInventory = async () => {
    setLoading(true)
    try {
      // Create seed from wishlist item
      await fetch('/api/seeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          variety: item.variety,
          brand: item.brand,
          quantity: 1,
          quantityUnit: 'packets',
        }),
      })
      
      // Mark as purchased
      await fetch(`/api/wishlist/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchased: true }),
      })
      
      router.refresh()
      router.push('/seeds')
    } catch (error) {
      alert('Failed to add to inventory')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {!item.purchased && (
        <button
          onClick={handleAddToInventory}
          disabled={loading}
          className="btn btn-primary flex items-center gap-1 text-sm"
          title="Add to inventory"
        >
          <Package className="w-4 h-4" />
          <span className="hidden sm:inline">Add to Inventory</span>
        </button>
      )}
      
      <button
        onClick={handleTogglePurchased}
        disabled={loading}
        className={`btn flex items-center gap-1 text-sm ${
          item.purchased ? 'btn-secondary' : 'bg-green-100 text-green-700 hover:bg-green-200'
        }`}
        title={item.purchased ? 'Mark as not purchased' : 'Mark as purchased'}
      >
        {item.purchased ? (
          <>
            <Undo className="w-4 h-4" />
            <span className="hidden sm:inline">Undo</span>
          </>
        ) : (
          <>
            <Check className="w-4 h-4" />
            <span className="hidden sm:inline">Purchased</span>
          </>
        )}
      </button>

      <Link
        href={`/wishlist/${item.id}/edit`}
        className="btn btn-secondary flex items-center gap-1 text-sm"
      >
        <Edit className="w-4 h-4" />
      </Link>

      <button
        onClick={handleDelete}
        disabled={loading}
        className="btn btn-danger flex items-center gap-1 text-sm"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
