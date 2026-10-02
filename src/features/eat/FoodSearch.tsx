// ============================================================
// FORME — Food Search Component
// Browse and search Indian foods by category
// ============================================================

import { searchFoods } from '@/lib/services/foodSearchService'
import { deleteCustomFood } from '@/lib/services/customFoodService'
import type { ResolvedScannedProduct, ScannedProduct } from '@/lib/services/barcodeProductService'
import { useAuthStore } from '@/store/authStore'
import { useFoodLogStore } from '@/store/foodLogStore'
import type { LoggedFoodItem, MealSlot, NutritionInfo } from '@/types'
import { Plus, Search, X, PlusCircle, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import { CreateCustomFoodModal } from './CreateCustomFoodModal'
import { BarcodeResultSheet } from './components/BarcodeResultSheet'


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
  const [selectedProduct, setSelectedProduct] = useState<ResolvedScannedProduct | null>(null)
  const [isAiSearching, setIsAiSearching] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuthStore()
  const { addFoodEntry } = useFoodLogStore()

  const loadFoods = async (q: string) => {
    setIsSearching(true)
    setAiError(null)

    try {
      const results = await searchFoods(q)
      setSearchResults(results.slice(0, 50)) // Prevent rendering thousands of DOM nodes on short queries

      if (q.trim() && results.length === 0) {
        setIsAiSearching(true)

        try {
          const response = await fetch('/api/estimate-nutrition', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: q.trim(),
              mode: 'meal',
            }),
          })

          const data = await response.json()

          if (!response.ok || data.status !== 'ok' || !data.estimate) {
            setAiError(data?.message || 'AI estimate unavailable')
            return
          }

          const estimate = data.estimate
          const portionGrams =
            typeof estimate.portionGrams === 'number' && estimate.portionGrams > 0
              ? estimate.portionGrams
              : null

          if (!portionGrams) {
            setAiError('AI estimate did not include a usable portion size')
            return
          }

          const n = estimate.nutrients

          const per100g = {
            calories:
              typeof n.calories === 'number'
                ? (n.calories / portionGrams) * 100
                : 0,
            protein:
              typeof n.protein === 'number'
                ? (n.protein / portionGrams) * 100
                : 0,
            carbs:
              typeof n.carbs === 'number'
                ? (n.carbs / portionGrams) * 100
                : 0,
            fat:
              typeof n.fat === 'number'
                ? (n.fat / portionGrams) * 100
                : 0,
            fiber:
              typeof n.fiber === 'number'
                ? (n.fiber / portionGrams) * 100
                : 0,
            ...(typeof n.sugar === 'number'
              ? { sugar: (n.sugar / portionGrams) * 100 }
              : {}),
            ...(typeof n.sodium === 'number'
              ? { sodium: (n.sodium / portionGrams) * 100 }
              : {}),
          }

          const unknownFields: string[] = []

          if (n.calories === null) unknownFields.push('calories')
          if (n.protein === null) unknownFields.push('protein')
          if (n.carbs === null) unknownFields.push('carbs')
          if (n.fat === null) unknownFields.push('fat')
          if (n.fiber === null) unknownFields.push('fiber')
          if (n.sugar === null) unknownFields.push('sugar')
          if (n.sodium === null) unknownFields.push('sodium')

          // ProductTrust only accepts medium | low.
          // The estimator may return high | medium | low, so normalize high to medium.
          const trustConfidence: 'medium' | 'low' =
            estimate.confidence === 'low' ? 'low' : 'medium'

          const product: ResolvedScannedProduct = {
            barcode: `ai_text_${Date.now()}`,
            name: estimate.name || q.trim(),
            brand: null,
            per100g,
            servingSizeG: portionGrams,
            dataSource: 'estimated',
            imageUrl: null,
            trust: {
              tier: 'ai_estimate',
              label: 'AI Estimate',
              confidence: trustConfidence,
              consistent: estimate.consistent,
            },
            unknownFields,
          }

          setSelectedProduct(product)
        } catch {
          setAiError('AI estimate unavailable')
        } finally {
          setIsAiSearching(false)
        }
      }
    } finally {
      setIsSearching(false)
      setIsInitialLoad(false)
    }
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

  const toResolvedProduct = (product: ScannedProduct): ResolvedScannedProduct => {
    const unknownFields: string[] = []

    if (product.per100g.fiber === undefined) unknownFields.push('fiber')
    if (product.per100g.sugar === undefined) unknownFields.push('sugar')
    if (product.per100g.sodium === undefined) unknownFields.push('sodium')

    return {
      ...product,
      trust: {
        tier: product.dataSource === 'custom' ? 'manual' : 'database',
        label: product.dataSource === 'custom' ? 'Entered by you' : 'Database',
      },
      unknownFields,
    }
  }

  const handleLogConfirmed = async (
    product: ResolvedScannedProduct,
    qtyGrams: number
  ) => {
    if (!user) return

    setIsAdding(true)

    try {
      const multiplier = qtyGrams / 100

      const nutrition: NutritionInfo = {
        calories: product.unknownFields.includes('calories')
          ? 0
          : product.per100g.calories * multiplier,
        protein: product.unknownFields.includes('protein')
          ? 0
          : product.per100g.protein * multiplier,
        carbs: product.unknownFields.includes('carbs')
          ? 0
          : product.per100g.carbs * multiplier,
        fat: product.unknownFields.includes('fat')
          ? 0
          : product.per100g.fat * multiplier,
        fiber: product.unknownFields.includes('fiber')
          ? null
          : product.per100g.fiber * multiplier,
        ...(product.unknownFields.includes('sugar')
          ? {}
          : product.per100g.sugar !== undefined
            ? { sugar: product.per100g.sugar * multiplier }
            : {}),
        ...(product.unknownFields.includes('sodium')
          ? {}
          : product.per100g.sodium !== undefined
            ? { sodium: product.per100g.sodium * multiplier }
            : {}),
      }

      // ProductTrust confidence is only medium | low.
      // Normalize both the estimator's high and medium states to moderate
      // for LoggedFoodItem; low becomes lower.
      const confidence =
        product.trust.tier === 'ai_estimate'
          ? product.trust.confidence === 'low'
            ? 'lower'
            : 'moderate'
          : 'high'

      const item: LoggedFoodItem = {
        id: uuidv4(),
        foodItemId: product.barcode,
        foodName: product.name,
        quantity: qtyGrams,
        unit: 'gram',
        gramsConsumed: Math.round(qtyGrams),
        nutrition,
        confidence,
      }

      await addFoodEntry(user.uid, slot, [item])

      setAddedId(product.barcode)
      setTimeout(() => setAddedId(null), 1500)
      setSelectedProduct(null)
      setQuickAdd(null)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[110] bg-bg-surface border-t border-border rounded-t-3xl flex flex-col"
        style={{ 
          maxHeight: '90dvh', // Use dvh to correctly handle the mobile keyboard
          paddingBottom: 'env(safe-area-inset-bottom, 0px)' 
        }}
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
                {isAiSearching ? (
                  <>
                    <div className="w-6 h-6 border-2 border-accent/40 border-t-accent rounded-full animate-spin mx-auto mb-3" />
                    <div className="text-sm text-text-primary font-medium">
                      Estimating "{query}"…
                    </div>
                    <p className="text-xs text-text-tertiary mt-1">
                      AI Estimate
                    </p>
                  </>
                ) : aiError ? (
                  <>
                    <div className="text-4xl mb-3">🔍</div>
                    <div className="font-medium text-text-primary mb-1">
                      "{query}" needs a manual entry
                    </div>
                    <p className="text-xs text-text-tertiary max-w-xs mb-4">
                      {aiError}
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="btn btn-accent px-4 py-2 text-xs font-semibold flex items-center gap-2 rounded-xl"
                    >
                      <PlusCircle size={15} />
                      Enter Manually
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-4xl mb-3">🔍</div>
                    <div className="font-medium text-text-primary mb-1">
                      "{query}" not found locally
                    </div>
                    <p className="text-xs text-text-tertiary max-w-xs mb-4">
                      We couldn't produce an AI estimate. You can enter the food manually.
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="btn btn-accent px-4 py-2 text-xs font-semibold flex items-center gap-2 rounded-xl"
                    >
                      <PlusCircle size={15} />
                      Enter Manually
                    </button>
                  </>
                )}
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
                              onClick={() => {
                                setSelectedProduct(toResolvedProduct(product))
                                setQuickAdd(null)
                              }}
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
        </motion.div>

      {showCreateModal && (
        <CreateCustomFoodModal
          initialName={query}
          onClose={() => setShowCreateModal(false)}
          onCreated={(newFood) => {
            setShowCreateModal(false)
            setSelectedProduct(toResolvedProduct(newFood))
          }}
        />
      )}

      <BarcodeResultSheet
        product={selectedProduct}
        onLog={handleLogConfirmed}
        onClose={() => setSelectedProduct(null)}
      />
    </>
  )
}

