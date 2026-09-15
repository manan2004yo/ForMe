// ============================================================
// FORME - Premium Eat Dashboard
// ============================================================

import { useState } from 'react'
import { format } from 'date-fns'
import { Plus, Search, Trash2, ChevronDown, ChevronUp, Sun, Sunset, Moon, Coffee } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useFoodLogStore } from '@/store/foodLogStore'
import { useUserStore } from '@/store/userStore'
import { useCnsStore } from '@/store/cnsStore'
import type { MealSlot, FoodLogEntry, NutritionInfo } from '@/types'
import { FoodSearch } from './FoodSearch'
import { SnapAndLogModal } from './SnapAndLogModal'
import { FamilyRecipeSplitter } from './FamilyRecipeSplitter'
import { ProgressBar, AnimatedNumber } from '@/components/shared'
import { PageTransition } from '@/components/layout/PageTransition'
import { clsx } from 'clsx'
import { v4 as uuidv4 } from 'uuid'

const MEAL_CONFIG: { slot: MealSlot; label: string; icon: any; time: string }[] = [
  { slot: 'breakfast', label: 'Breakfast', icon: Sun, time: 'Morning' },
  { slot: 'lunch', label: 'Lunch', icon: Sun, time: 'Afternoon' },
  { slot: 'snack', label: 'Snacks', icon: Coffee, time: 'Anytime' },
  { slot: 'dinner', label: 'Dinner', icon: Moon, time: 'Evening' },
  { slot: 'pre_workout', label: 'Pre-Workout', icon: Sunset, time: 'Before Training' },
  { slot: 'post_workout', label: 'Post-Workout', icon: Sunset, time: 'After Training' },
]

function NutritionChip({ label, value, unit, colorClass }: { label: string; value: number; unit: string; colorClass: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-white/40 mb-1">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={clsx("font-semibold text-sm", colorClass)}>{Math.round(value)}</span>
        <span className="text-xs text-white/50">{unit}</span>
      </div>
    </div>
  )
}

function MealSection({ config, entries, onDelete, onBrowse, onSnap }: {
  config: typeof MEAL_CONFIG[0]
  entries: FoodLogEntry[]
  onDelete: (entryId: string) => void
  onBrowse: (slot: MealSlot) => void
  onSnap: (slot: MealSlot) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const Icon = config.icon
  
  const allFoods = entries.flatMap(e => e.foods)
  const totals: NutritionInfo = allFoods.reduce((acc, f) => ({
    calories: acc.calories + f.nutrition.calories,
    protein: acc.protein + f.nutrition.protein,
    carbs: acc.carbs + f.nutrition.carbs,
    fat: acc.fat + f.nutrition.fat,
    fiber: acc.fiber + f.nutrition.fiber,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })

  const hasFood = allFoods.length > 0

  return (
    <div className="bg-[#121212] border border-white/5 rounded-2xl overflow-hidden mb-4">
      <div 
        className={clsx(
          "p-5 flex items-center justify-between cursor-pointer transition-colors",
          hasFood ? "hover:bg-white/5" : ""
        )}
        onClick={() => hasFood && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 text-white/70">
            <Icon size={18} />
          </div>
          <div>
            <h3 className="text-white font-medium">{config.label}</h3>
            {hasFood ? (
              <div className="flex items-center gap-4 mt-1">
                <span className="text-xs text-white/70 font-semibold">{Math.round(totals.calories)} kcal</span>
                <span className="text-[10px] text-emerald-400 font-medium">{Math.round(totals.protein)}g Protein</span>
              </div>
            ) : (
              <span className="text-xs text-white/40 mt-1 block">{config.time}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onSnap(config.slot); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-black hover:bg-accent/90 transition-all text-xs font-bold outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95 shadow-[0_0_10px_rgba(45,212,191,0.2)]"
          >
            <Sun size={14} /> Snap
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onBrowse(config.slot); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95"
          >
            <Search size={14} /> Search
          </button>
          {hasFood && (
            <button 
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="text-white/40 p-1.5 hover:bg-white/5 rounded-lg transition-colors active:scale-95"
              aria-label={expanded ? "Collapse meal" : "Expand meal"}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>

      {hasFood && expanded && (
        <div className="border-t border-white/5 bg-[#0a0a0a]/50 p-2">
          {entries.map(entry => (
            <div key={entry.id} className="mb-2 last:mb-0">
              {entry.foods.map(food => (
                <div key={food.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 mb-2 last:mb-0 group">
                  <div>
                    <div className="text-sm text-white font-medium">{food.foodName}</div>
                    <div className="text-xs text-white/50 mt-1">
                      {food.quantity} {food.unit} - {Math.round(food.nutrition.calories)} kcal
                    </div>
                  </div>
                  {confirmDeleteId === entry.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-400 font-medium">Remove?</span>
                      <button 
                        onClick={() => { onDelete(entry.id); setConfirmDeleteId(null); }}
                        className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-semibold hover:bg-red-500/30 transition-all active:scale-95"
                      >
                        Yes
                      </button>
                      <button 
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-1.5 bg-white/5 text-white/70 rounded-lg text-xs font-semibold hover:bg-white/10 transition-all active:scale-95"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(entry.id)}
                      className="px-3 py-1.5 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:opacity-100 text-xs font-semibold active:scale-95"
                    >
                      Remove item
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
          
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 mb-2">
            <button className="text-xs font-medium text-white/50 hover:text-white transition-colors active:scale-95 px-2 py-1 rounded-md hover:bg-white/5">Edit meal</button>
            <button className="text-xs font-medium text-white/50 hover:text-white transition-colors active:scale-95 px-2 py-1 rounded-md hover:bg-white/5">Copy previous</button>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4 p-3 bg-white/5 rounded-xl border border-white/5">
            <NutritionChip label="Calories" value={totals.calories} unit="kcal" colorClass="text-white" />
            <NutritionChip label="Protein" value={totals.protein} unit="g" colorClass="text-emerald-400" />
            <NutritionChip label="Carbs" value={totals.carbs} unit="g" colorClass="text-blue-400" />
            <NutritionChip label="Fats" value={totals.fat} unit="g" colorClass="text-purple-400" />
          </div>
        </div>
      )}
    </div>
  )
}

export function EatDashboard() {
  const [showRecipeSplitter, setShowRecipeSplitter] = useState(false)
  const { user } = useAuthStore()
  const { metrics } = useUserStore()
  const { entries, removeEntry, addFoodEntry } = useFoodLogStore()
  const { getCurrentStatus } = useCnsStore()
  const [browsingSlot, setBrowsingSlot] = useState<MealSlot | null>(null)
  const [snappingSlot, setSnappingSlot] = useState<MealSlot | null>(null)

  const cnsStatus = getCurrentStatus()
  const isFried = cnsStatus === 'Fried'

  const todayEntries = entries.filter(e => e.date === format(new Date(), 'yyyy-MM-dd'))

  const totals = todayEntries.reduce((acc, entry) => {
    entry.foods.forEach(f => {
      acc.calories += f.nutrition.calories
      acc.protein += f.nutrition.protein
      acc.carbs += f.nutrition.carbs
      acc.fat += f.nutrition.fat
    })
    return acc
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 })

  // Dynamic targets from User Profile
  const baseProtein = metrics?.proteinTarget || 150
  let baseCarbs = metrics?.carbTarget || 250
  const baseFat = metrics?.fatTarget || 80
  let baseCals = metrics?.caloricTarget || 2000

  // CNS AI Engine adjustments
  if (isFried) {
    baseCarbs += 50 // +50g carbs for recovery (~200 kcal)
    baseCals += 200
  }

  return (
    <>
      <PageTransition>
      <div className="page relative">
        <header className="page-header mb-8">
          <p className="text-sm text-white/50 font-medium tracking-wide mb-1 uppercase">
            {format(new Date(), 'EEEE, d MMM')}
          </p>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight">
            Food Log
          </h1>
        </header>

        {/* Daily Summary */}
        <div className="bg-[#121212] border border-white/5 rounded-3xl p-6 mb-8 shadow-xl relative overflow-hidden">
          {isFried && (
            <div className="absolute top-0 left-0 w-full bg-accent/20 border-b border-accent/20 p-2 text-center text-[10px] font-bold text-accent tracking-widest uppercase flex items-center justify-center gap-2">
              <Sun size={12} /> AI Adjusted: +50g Carbs for CNS Recovery
            </div>
          )}
          
          <h2 className={clsx("text-sm font-medium text-white/50 uppercase tracking-widest mb-6", isFried ? "mt-6" : "")}>Daily Totals</h2>
          <div className="flex justify-between items-end mb-6">
            <div className="flex items-baseline gap-2">
              <AnimatedNumber value={totals.calories} className="text-4xl font-heading font-bold text-white" />
              <span className="text-white/40">/ {baseCals} kcal</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-white/50 mb-2">Protein</div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-lg font-bold text-emerald-400">{Math.round(totals.protein)}</span>
                <span className="text-xs text-white/40">/ {baseProtein}g</span>
              </div>
              <ProgressBar value={totals.protein} max={baseProtein} colorClass="bg-emerald-400" heightClass="h-1" className="bg-white/5" />
            </div>
            <div>
              <div className="text-xs text-white/50 mb-2 flex items-center gap-1">
                Carbs {isFried && <span className="text-[10px] text-accent bg-accent/10 px-1 rounded">AI</span>}
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-lg font-bold text-blue-400">{Math.round(totals.carbs)}</span>
                <span className="text-xs text-white/40">/ {baseCarbs}g</span>
              </div>
              <ProgressBar value={totals.carbs} max={baseCarbs} colorClass="bg-blue-400" heightClass="h-1" className="bg-white/5" />
            </div>
            <div>
              <div className="text-xs text-white/50 mb-2">Fats</div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-lg font-bold text-purple-400">{Math.round(totals.fat)}</span>
                <span className="text-xs text-white/40">/ {baseFat}g</span>
              </div>
              <ProgressBar value={totals.fat} max={baseFat} colorClass="bg-purple-400" heightClass="h-1" className="bg-white/5" />
            </div>
          </div>
        </div>

        {/* Meal Slots */}
        <div className="space-y-1">
          
        {/* Mom's Kitchen Splitter CTA */}
        <button 
          onClick={() => setShowRecipeSplitter(true)}
          className="w-full mt-4 bg-gradient-to-r from-accent/20 to-[#121212] border border-accent/20 rounded-2xl p-4 flex items-center justify-between group active:scale-[0.98] transition-transform text-left"
        >
          <div>
            <h3 className="text-white font-semibold text-sm">Mom's Kitchen Splitter</h3>
            <p className="text-xs text-white/50 mt-1">Calculate exact macros for family meals</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-black transition-colors">
            <Plus size={16} />
          </div>
        </button>

        {MEAL_CONFIG.map(config => (
            <MealSection
              key={config.slot}
              config={config}
              entries={todayEntries.filter(e => e.meal === config.slot)}
              onDelete={(id) => removeEntry(user?.uid || "demo", id)}
              onBrowse={setBrowsingSlot}
              onSnap={setSnappingSlot}
            />
          ))}
        </div>

        {browsingSlot && (
          <div className="fixed inset-0 z-50 bg-[#0a0a0a] overflow-y-auto">
            <FoodSearch slot={browsingSlot} onClose={() => setBrowsingSlot(null)} />
          </div>
        )}

        {snappingSlot && (
          <SnapAndLogModal 
            slot={snappingSlot} 
            onClose={() => setSnappingSlot(null)}
            onLog={(name, cals, p, c, f) => {
              addFoodEntry(user?.uid || "demo", snappingSlot, [{
                id: uuidv4(),
                foodItemId: 'ai-vision',
                foodName: name,
                quantity: 1,
                unit: 'serving',
                gramsConsumed: 200,
                confidence: 'high',
                nutrition: { calories: cals, protein: p, carbs: c, fat: f, fiber: 0 }
              }])
              setSnappingSlot(null)
            }}
          />
        )}
      </div>
    </PageTransition>
      {showRecipeSplitter && <FamilyRecipeSplitter onClose={() => setShowRecipeSplitter(false)} />}
    </>
  )
}
