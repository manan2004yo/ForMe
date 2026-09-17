// ============================================================
// FORME — Food Search Component
// Browse and search Indian foods by category
// ============================================================

import { INDIAN_FOODS, getNutritionForGrams } from '@/lib/data/indianFoods'
import { useAuthStore } from '@/store/authStore'
import { useFoodLogStore } from '@/store/foodLogStore'
import type { LoggedFoodItem, MealSlot } from '@/types'
import { Plus, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

const CATEGORIES = ['All', 'Breads', 'Rice', 'Dal & Legumes', 'Vegetables', 'Dairy', 'Proteins', 'Snacks', 'Fruits', 'Beverages']

interface FoodSearchProps {
  slot: MealSlot
  onClose: () => void
}

interface QuickAddState {
  foodId: string
  quantity: number
  unit: string
}

export function FoodSearch({ slot, onClose }: FoodSearchProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [quickAdd, setQuickAdd] = useState<QuickAddState | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [addedId, setAddedId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuthStore()
  const { addFoodEntry } = useFoodLogStore()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const filtered = useMemo(() => {
    return INDIAN_FOODS.filter(f => {
      const matchesQuery = !query ||
        f.name.toLowerCase().includes(query.toLowerCase()) ||
        f.aliases.some(a => a.toLowerCase().includes(query.toLowerCase())) ||
        f.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
      const matchesCat = category === 'All' || f.category === category
      return matchesQuery && matchesCat
    }).slice(0, 50)
  }, [query, category])

  const handleAdd = async (foodId: string, qty: number, unit: string) => {
    const food = INDIAN_FOODS.find(f => f.id === foodId)
    if (!food || !user) return

    setIsAdding(true)
    try {
      let grams = qty
      if (unit !== 'gram') {
        grams = (food.gramsPerUnit[unit] || food.gramsPerUnit['serving'] || 100) * qty
      }
      const nutrition = getNutritionForGrams(food, grams)
      const item: LoggedFoodItem = {
        id: uuidv4(),
        foodItemId: food.id,
        foodName: food.name,
        quantity: qty,
        unit: unit as any,
        gramsConsumed: Math.round(grams),
        nutrition,
        confidence: 'high',
      }
      await addFoodEntry(user.uid, slot, [item])
      setAddedId(foodId)
      setTimeout(() => setAddedId(null), 1500)
      setQuickAdd(null)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border sticky top-0 bg-bg-surface z-10 rounded-t-3xl">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search roti, dal, paneer…"
              className="input-field pl-9 pr-4 py-2.5 text-sm"
              id="food-search-input"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button onClick={onClose} className="btn btn-ghost p-2 rounded-xl">
            <X size={18} className="text-text-tertiary" />
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-border">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                category === cat
                  ? 'bg-accent text-white'
                  : 'bg-bg-surface2 text-text-secondary hover:bg-bg-surface3'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Food List */}
        <div className="overflow-y-auto" style={{ maxHeight: '55vh' }}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <div className="font-medium text-text-primary mb-1">No foods found</div>
              <div className="text-sm text-text-tertiary">Try a different search term</div>
            </div>
          ) : (
            <div className="flex flex-col">
              {filtered.map(food => {
                const defaultGrams = (food.gramsPerUnit[food.defaultUnit] || 100) * food.defaultPortion
                const nutrition = getNutritionForGrams(food, defaultGrams)
                const isJustAdded = addedId === food.id

                return (
                  <div key={food.id}>
                    <div
                      className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                        isJustAdded ? 'bg-success-light' : 'hover:bg-bg-surface2'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-medium text-text-primary truncate">{food.name}</span>
                          {food.nameHindi && (
                            <span className="text-xs text-text-tertiary">{food.nameHindi}</span>
                          )}
                        </div>
                        <div className="text-xs text-text-secondary mt-0.5">
                          {Math.round(nutrition.calories)} kcal · P:{Math.round(nutrition.protein)}g ·
                          C:{Math.round(nutrition.carbs)}g · F:{Math.round(nutrition.fat)}g
                          <span className="ml-1 text-text-tertiary">
                            per {food.defaultPortion} {food.defaultUnit}
                          </span>
                        </div>
                        {food.estimatedCostPer100g && (
                          <div className="text-[10px] text-text-tertiary">
                            ≈ ₹{Math.round(food.estimatedCostPer100g * defaultGrams / 100)}/serving
                          </div>
                        )}
                      </div>

                      {isJustAdded ? (
                        <div className="w-8 h-8 rounded-xl bg-success flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      ) : quickAdd?.foodId === food.id ? (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setQuickAdd(q => q ? { ...q, quantity: Math.max(0.5, q.quantity - (q.unit === 'gram' ? 25 : 0.5)) } : null)}
                              className="w-6 h-6 rounded-lg bg-bg-surface2 flex items-center justify-center text-xs"
                            >−</button>
                            <span className="text-sm font-medium w-8 text-center">{quickAdd.quantity}</span>
                            <button
                              onClick={() => setQuickAdd(q => q ? { ...q, quantity: q.quantity + (q.unit === 'gram' ? 25 : 0.5) } : null)}
                              className="w-6 h-6 rounded-lg bg-bg-surface2 flex items-center justify-center text-xs"
                            >+</button>
                          </div>
                          <select
                            value={quickAdd.unit}
                            onChange={e => setQuickAdd(q => q ? { ...q, unit: e.target.value } : null)}
                            className="text-xs bg-bg-surface2 border-none rounded-lg px-1 py-1"
                          >
                            {food.portionUnits.map(u => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAdd(food.id, quickAdd.quantity, quickAdd.unit)}
                            disabled={isAdding}
                            className="btn btn-accent btn-sm"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setQuickAdd(null)}
                            className="btn btn-ghost p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setQuickAdd({
                            foodId: food.id,
                            quantity: food.defaultPortion,
                            unit: food.defaultUnit,
                          })}
                          className="w-8 h-8 rounded-xl bg-accent-light flex items-center justify-center flex-shrink-0 hover:bg-accent hover:text-white transition-colors"
                          id={`add-food-${food.id}`}
                        >
                          <Plus size={14} className="text-accent" />
                        </button>
                      )}
                    </div>
                    <div className="h-px bg-border mx-4" />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border text-center">
          <p className="text-xs text-text-tertiary">
            {filtered.length} of {INDIAN_FOODS.length} foods · Tap + to add to {slot.replace('_', ' ')}
          </p>
        </div>
      </div>
    </div>
  )
}
