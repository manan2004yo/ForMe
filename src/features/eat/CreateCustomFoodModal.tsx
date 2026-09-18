// ============================================================
// FORME — Add Custom Food Modal
// Elegant glassmorphism form for adding missing foods with full macro control
// ============================================================

import { useState } from 'react'
import { X, Sparkles, PlusCircle } from 'lucide-react'
import { saveCustomFood } from '@/lib/services/customFoodService'
import type { ScannedProduct } from '@/lib/services/barcodeProductService'

interface CreateCustomFoodModalProps {
  initialName?: string
  onClose: () => void
  onCreated: (food: ScannedProduct) => void
}

export function CreateCustomFoodModal({ initialName = '', onClose, onCreated }: CreateCustomFoodModalProps) {
  const [name, setName] = useState(initialName)
  const [brand, setBrand] = useState('')
  const [servingSizeG, setServingSizeG] = useState('100')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [fiber, setFiber] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !calories) return

    const created = saveCustomFood({
      name: name.trim(),
      brand: brand.trim() || null,
      per100g: {
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        fiber: Number(fiber) || 0,
      },
      servingSizeG: Number(servingSizeG) || 100,
      imageUrl: null,
    })

    onCreated(created)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold">
              <PlusCircle size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary text-base">Add Custom Food</h3>
              <p className="text-xs text-text-tertiary">Saved to your local database</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost p-2 rounded-xl">
            <X size={18} className="text-text-tertiary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Food / Dish Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Homemade Bajra Roti with Ghee"
              className="input-field text-sm w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Brand / Source (Optional)</label>
              <input
                type="text"
                value={brand}
                onChange={e => setBrand(e.target.value)}
                placeholder="e.g. Mom's Kitchen"
                className="input-field text-sm w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Standard Portion (g)</label>
              <input
                type="number"
                value={servingSizeG}
                onChange={e => setServingSizeG(e.target.value)}
                placeholder="100"
                className="input-field text-sm w-full"
              />
            </div>
          </div>

          <div className="p-3 bg-bg-surface2 rounded-2xl border border-border">
            <span className="text-xs font-semibold text-text-secondary block mb-2 flex items-center gap-1">
              <Sparkles size={12} className="text-accent" /> Nutritional Values (Per 100g)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-text-tertiary mb-1">Calories (kcal) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={calories}
                  onChange={e => setCalories(e.target.value)}
                  placeholder="e.g. 240"
                  className="input-field text-sm w-full"
                />
              </div>
              <div>
                <label className="block text-[11px] text-text-tertiary mb-1">Protein (g)</label>
                <input
                  type="number"
                  step="any"
                  value={protein}
                  onChange={e => setProtein(e.target.value)}
                  placeholder="0"
                  className="input-field text-sm w-full"
                />
              </div>
              <div>
                <label className="block text-[11px] text-text-tertiary mb-1">Carbohydrates (g)</label>
                <input
                  type="number"
                  step="any"
                  value={carbs}
                  onChange={e => setCarbs(e.target.value)}
                  placeholder="0"
                  className="input-field text-sm w-full"
                />
              </div>
              <div>
                <label className="block text-[11px] text-text-tertiary mb-1">Fats (g)</label>
                <input
                  type="number"
                  step="any"
                  value={fat}
                  onChange={e => setFat(e.target.value)}
                  placeholder="0"
                  className="input-field text-sm w-full"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-[11px] text-text-tertiary mb-1">Dietary Fiber (g)</label>
              <input
                type="number"
                step="any"
                value={fiber}
                onChange={e => setFiber(e.target.value)}
                placeholder="0"
                className="input-field text-sm w-full"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1 py-2.5">
              Cancel
            </button>
            <button type="submit" className="btn btn-accent flex-1 py-2.5 font-semibold">
              Save to Database
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
