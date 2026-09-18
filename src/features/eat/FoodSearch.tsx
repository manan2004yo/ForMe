// ============================================================
// FORME — Food Search Component
// Browse and search Indian foods by category
// ============================================================

import { searchFoods } from '@/lib/services/foodSearchService'
import { deleteCustomFood } from '@/lib/services/customFoodService'
import type { ScannedProduct } from '@/lib/services/barcodeProductService'
import { useAuthStore } from '@/store/authStore'
import { useFoodLogStore } from '@/store/foodLogStore'
import type { LoggedFoodItem, MealSlot } from '@/types'
import { Plus, Search, X, PlusCircle, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { CreateCustomFoodModal } from './CreateCustomFoodModal'


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
  const [searchResults, setSearchResults] = useState<ScannedProduct[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  const [quickAdd, setQuickAdd] = useState<QuickAddState | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [addedId, setAddedId] = useState<string | null>(null)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuthStore()
  const { addFoodEntry } = useFoodLogStore()

  const loadFoods = async (q: string) => {
    setIsSearching(true)
    const results = await searchFoods(q)
    setSearchResults(results)
    setIsSearching(false)
    setIsInitialLoad(false)
  }

  useEffect(() => {
    inputRef.current?.focus()
    loadFoods('')
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadFoods(query)
    }, 300)
    
    return () => clearTimeout(timeout)
  }, [query])

  const handleAdd = async (product: ScannedProduct, qtyGrams: number) => {
    if (!user) return

    setIsAdding(true)
    try {
      const multiplier = qtyGrams / 100
      
      const item: LoggedFoodItem = {
        id: uuidv4(),
        foodItemId: product.barcode,
        foodName: product.name,
        quantity: qtyGrams,
        unit: 'gram',
        gramsConsumed: Math.round(qtyGrams),
        nutrition: {
          calories: product.per100g.calories * multiplier,
          protein: product.per100g.protein * multiplier,
          carbs: product.per100g.carbs * multiplier,
          fat: product.per100g.fat * multiplier,
          fiber: product.per100g.fiber * multiplier
        },
        confidence: 'high',
      }
      
      await addFoodEntry(user.uid, slot, [item])
      setAddedId(product.barcode)
      setTimeout(() => setAddedId(null), 1500)
      setQuickAdd(null)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <>
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
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-ghost px-3 py-2 text-xs flex items-center gap-1.5 text-accent hover:bg-accent/10 rounded-xl"
              title="Add a missing food to your database"
            >
              <PlusCircle size={15} />
              <span className="hidden sm:inline font-medium">Add Food</span>
            </button>

            <button onClick={onClose} className="btn btn-ghost p-2 rounded-xl">
              <X size={18} className="text-text-tertiary" />
            </button>
          </div>

          {/* Food List */}
          <div className="overflow-y-auto" style={{ maxHeight: '55vh' }}>
            {isSearching || isInitialLoad ? (
               <div className="flex flex-col items-center justify-center py-12 text-center">
                 <div className="w-6 h-6 border-2 border-accent/40 border-t-accent rounded-full animate-spin mx-auto mb-3" />
                 <div className="text-sm text-text-tertiary">Loading foods...</div>
               </div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <div className="font-medium text-text-primary mb-1">"{query}" not found</div>
                <p className="text-xs text-text-tertiary max-w-xs mb-4">
                  Can't find this item? You can easily add it to your local database with custom macros!
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-accent px-4 py-2 text-xs font-semibold flex items-center gap-2 rounded-xl"
                >
                  <PlusCircle size={15} />
                  Add "{query}" to Database
                </button>
              </div>
            ) : (
              <div className="flex flex-col">
                {searchResults.map(product => {
                  const isJustAdded = addedId === product.barcode
                  const isCustom = product.dataSource === 'custom'

                  return (
                    <div key={product.barcode}>
                      <div
                        className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                          isJustAdded ? 'bg-success-light' : 'hover:bg-bg-surface2'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-medium text-text-primary truncate">{product.name}</span>
                            {isCustom && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent/15 text-accent font-semibold">
                                Custom
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-text-secondary mt-0.5">
                            {Math.round(product.per100g.calories)} kcal · P:{Math.round(product.per100g.protein)}g ·
                            C:{Math.round(product.per100g.carbs)}g · F:{Math.round(product.per100g.fat)}g
                            <span className="ml-1 text-text-tertiary">
                              per 100g
                            </span>
                          </div>
                        </div>

                        {isJustAdded ? (
                          <div className="w-8 h-8 rounded-xl bg-success flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        ) : quickAdd?.foodId === product.barcode ? (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setQuickAdd(q => q ? { ...q, quantity: Math.max(10, q.quantity - 10) } : null)}
                                className="w-6 h-6 rounded-lg bg-bg-surface2 flex items-center justify-center text-xs"
                              >−</button>
                              <span className="text-sm font-medium w-10 text-center">{quickAdd.quantity}</span>
                              <button
                                onClick={() => setQuickAdd(q => q ? { ...q, quantity: q.quantity + 10 } : null)}
                                className="w-6 h-6 rounded-lg bg-bg-surface2 flex items-center justify-center text-xs"
                              >+</button>
                            </div>
                            <span className="text-xs text-text-tertiary">grams</span>
                            
                            <button
                              onClick={() => handleAdd(product, quickAdd.quantity)}
                              disabled={isAdding}
                              className="ml-2 w-8 h-8 rounded-xl bg-accent text-bg-surface font-semibold flex items-center justify-center"
                            >
                              {isAdding ? '…' : '✓'}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {isCustom && (
                              <button
                                onClick={() => {
                                  deleteCustomFood(product.barcode)
                                  loadFoods(query)
                                }}
                                title="Delete custom food"
                                className="w-8 h-8 rounded-xl bg-error/10 text-error flex items-center justify-center hover:bg-error/20 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => setQuickAdd({ foodId: product.barcode, quantity: 100, unit: 'gram' })}
                              className="w-8 h-8 rounded-xl bg-bg-surface2 flex items-center justify-center hover:bg-bg-surface3"
                            >
                              <Plus size={16} className="text-text-secondary" />
                            </button>
                          </div>
                        )}

                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer info */}
          <div className="p-3 border-t border-border bg-bg-surface sticky bottom-0 flex items-center justify-between">
            <p className="text-xs text-text-tertiary">
              Local Indian Foods Database
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-xs text-accent font-medium hover:underline flex items-center gap-1"
            >
              <PlusCircle size={13} />
              + Add New Item
            </button>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateCustomFoodModal
          initialName={query}
          onClose={() => setShowCreateModal(false)}
          onCreated={(newFood) => {
            setShowCreateModal(false)
            setQuery(newFood.name)
            loadFoods(newFood.name)
          }}
        />
      )}
    </>
  )
}

