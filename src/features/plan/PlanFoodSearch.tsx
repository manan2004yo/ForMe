// ============================================================
// FORME - Plan Food Search Component
// ============================================================

import { searchFoods } from '@/lib/services/foodSearchService'
import type { ScannedProduct } from '@/lib/services/barcodeProductService'
import { usePlanStore } from '@/store/planStore'
import type { MealSlot } from '@/types'
import { Plus, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface PlanFoodSearchProps {
  slot: MealSlot
  onClose: () => void
}

export function PlanFoodSearch({ slot, onClose }: PlanFoodSearchProps) {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ScannedProduct[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [quickAdd, setQuickAdd] = useState<{product: ScannedProduct, quantity: number} | null>(null)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const { addFoodToSlot } = usePlanStore()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }
    
    setIsSearching(true)
    const timeout = setTimeout(async () => {
      const results = await searchFoods(query)
      setSearchResults(results)
      setIsSearching(false)
    }, 500)
    
    return () => clearTimeout(timeout)
  }, [query])

  const handleAdd = (product: ScannedProduct) => {
    setQuickAdd({
      product,
      quantity: 100
    })
  }

  const confirmAdd = () => {
    if (!quickAdd) return
    const product = quickAdd.product
    const multiplier = quickAdd.quantity / 100

    const nutrition = {
      calories: product.per100g.calories * multiplier,
      protein: product.per100g.protein * multiplier,
      carbs: product.per100g.carbs * multiplier,
      fat: product.per100g.fat * multiplier,
      fiber: product.per100g.fiber * multiplier
    }

    addFoodToSlot(slot, {
      foodId: product.barcode,
      name: product.name,
      quantity: quickAdd.quantity,
      unit: 'gram',
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

      <div className="flex-1 overflow-y-auto">
        {isSearching ? (
          <div className="p-12 flex flex-col items-center justify-center text-white/50">
            <p>Searching global database...</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-white/50">
            <Search size={48} className="mb-4 text-white/20" />
            <p>Search for any food to add to {slot.replace('_', ' ')}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {searchResults.map(product => (
              <div key={product.barcode} className="p-4 flex items-center justify-between hover:bg-white/5">
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="font-medium text-white truncate">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-white/50">
                    <span>{Math.round(product.per100g.calories)} kcal</span>
                    <span>•</span>
                    <span>P: {Math.round(product.per100g.protein)}g</span>
                    <span>•</span>
                    <span>C: {Math.round(product.per100g.carbs)}g</span>
                    <span>•</span>
                    <span>F: {Math.round(product.per100g.fat)}g</span>
                    <span>(per 100g)</span>
                  </div>
                </div>
                
                {quickAdd?.product.barcode === product.barcode ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white/10 rounded-lg">
                      <button 
                        onClick={() => setQuickAdd(q => q ? {...q, quantity: Math.max(10, q.quantity - 10)} : null)}
                        className="px-3 py-1.5 text-white/70 hover:text-white"
                      >-</button>
                      <span className="text-sm font-medium w-12 text-center">{quickAdd.quantity}</span>
                      <button 
                        onClick={() => setQuickAdd(q => q ? {...q, quantity: q.quantity + 10} : null)}
                        className="px-3 py-1.5 text-white/70 hover:text-white"
                      >+</button>
                    </div>
                    <span className="text-xs text-white/50">g</span>
                    <button 
                      onClick={confirmAdd}
                      className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-black"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleAdd(product)}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
