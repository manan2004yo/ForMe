import type { FoodLogEntry } from '@/types'
import { X } from 'lucide-react'
import { useState } from 'react'

interface EditFoodModalProps {
  entry: FoodLogEntry
  onClose: () => void
  onSave: (newQty: number) => void
}

import { Portal } from '@/components/layout/Portal'

export function EditFoodModal({ entry, onClose, onSave }: EditFoodModalProps) {
  const food = entry.foods[0]
  const [qty, setQty] = useState(String(food?.quantity || 1))

  if (!food) return null

  const handleSave = () => {
    const num = parseFloat(qty)
    if (!isNaN(num) && num > 0) {
      onSave(num)
    }
  }

  return (
    <Portal>
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content max-w-sm w-full mx-4" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-heading font-bold text-lg text-text-primary">Edit Quantity</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-text-tertiary hover:text-white rounded-xl">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="text-sm text-text-secondary mb-4">
            How much <strong className="text-text-primary">{food.foodName}</strong> did you have?
          </div>
          
          <div className="flex items-center gap-3">
            <input 
              type="number"
              value={qty}
              onChange={e => setQty(e.target.value)}
              className="input-field text-center text-lg py-3 w-24 flex-shrink-0"
              autoFocus
              step="any"
            />
            <span className="text-text-secondary font-medium">{food.unit}</span>
          </div>

          <button 
            onClick={handleSave}
            className="btn btn-accent w-full mt-6 py-3"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
    </Portal>
  )
}
