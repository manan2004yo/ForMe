// ============================================================
// FORME - Plan Food Search Component
// ============================================================

import { INDIAN_FOODS, getNutritionForGrams } from '@/lib/data/indianFoods'
import { usePlanStore } from '@/store/planStore'
import type { MealSlot } from '@/types'
import { Plus, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

const CATEGORIES = ['All', 'Breads', 'Rice', 'Dal & Legumes', 'Vegetables', 'Dairy', 'Proteins', 'Snacks', 'Fruits', 'Beverages']

interface PlanFoodSearchProps {
  slot: MealSlot
  onClose: () => void
}

export function PlanFoodSearch({ slot, onClose }: PlanFoodSearchProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const inputRef = useRef<HTMLInputElement>(null)
  const { addFoodToSlot } = usePlanStore()
  const [quickAdd, setQuickAdd] = useState<{foodId: string, quantity: number, unit: string} | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const filteredFoods = useMemo(() => {
    return INDIAN_FOODS.filter(food => {
      const matchesSearch = food.name.toLowerCase().includes(query.toLowerCase()) || 
                            food.aliases?.some(n => n.toLowerCase().includes(query.toLowerCase()))
      const matchesCategory = category === 'All' || food.category === category
      return matchesSearch && matchesCategory
    })
  }, [query, category])

  const handleAdd = (foodId: string) => {
    const food = INDIAN_FOODS.find(f => f.id === foodId)
    if (!food) return

    setQuickAdd({
      foodId,
      quantity: 1,
      unit: food.portionUnits[0]
    })
  }

  const confirmAdd = () => {
    if (!quickAdd) return
    const food = INDIAN_FOODS.find(f => f.id === quickAdd.foodId)
    if (!food) return

    const gramsPerUnit = food.gramsPerUnit[quickAdd.unit] || 100
    const grams = gramsPerUnit * quickAdd.quantity
    const nutrition = getNutritionForGrams(food, grams)

    addFoodToSlot(slot, {
      foodId: food.id,
      name: food.name,
      quantity: quickAdd.quantity,
      unit: quickAdd.unit,
      nutrition
    })

    setQuickAdd(null)
    onClose()
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col pt-safe">
      <header className="p-4 border-b border-white/10 flex gap-3 items-center sticky top-0 bg-[#0a0a0a] z-10">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search Indian foods..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white/5 border-none rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-accent"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>
        <button onClick={onClose} className="p-3 text-white/70 hover:text-white">
          <X size={24} />
        </button>
      </header>

      <div className="overflow-x-auto hide-scrollbar border-b border-white/5">
        <div className="flex gap-2 p-4 w-max">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={"px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors " + (category === cat ? 'bg-white text-black' : 'bg-white/5 text-white/70 hover:bg-white/10')}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
        {filteredFoods.map(food => (
          <div key={food.id} className="bg-[#121212] border border-white/5 p-4 rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">{food.name}</h3>
              <p className="text-xs text-white/50">{food.nutrition.calories} kcal per 100g</p>
            </div>
            
            {quickAdd?.foodId === food.id ? (
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={quickAdd.quantity} 
                  onChange={e => setQuickAdd({...quickAdd, quantity: Number(e.target.value) || 1})}
                  className="w-16 bg-white/10 rounded px-2 py-1 text-white text-sm outline-none focus:ring-1 focus:ring-accent"
                  min="1"
                />
                <select 
                  value={quickAdd.unit}
                  onChange={e => setQuickAdd({...quickAdd, unit: e.target.value})}
                  className="bg-white/10 rounded px-2 py-1 text-white text-sm outline-none border-none focus:ring-1 focus:ring-accent"
                >
                  {food.portionUnits.map(p => (
                    <option key={p} value={p} className="bg-bg">{p}</option>
                  ))}
                  
                </select>
                <button onClick={confirmAdd} className="bg-accent text-white p-1.5 rounded hover:bg-accent/90">
                  <Plus size={16} />
                </button>
              </div>
            ) : (
              <button onClick={() => handleAdd(food.id)} className="p-2 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg">
                <Plus size={18} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
