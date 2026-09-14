// ============================================================
// FORME - Premium Eat Dashboard
// ============================================================

import { useState } from 'react'
import { format } from 'date-fns'
import { Plus, Search, Trash2, ChevronDown, ChevronUp, Sun, Sunset, Moon, Coffee } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useFoodLogStore } from '@/store/foodLogStore'
import type { MealSlot, FoodLogEntry, NutritionInfo } from '@/types'
import { FoodSearch } from './FoodSearch'
import { ProgressBar, AnimatedNumber } from '@/components/shared'
import { PageTransition } from '@/components/layout/PageTransition'
import { clsx } from 'clsx'

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

function MealSection({ config, entries, onDelete, onBrowse }: {
  config: typeof MEAL_CONFIG[0]
  entries: FoodLogEntry[]
  onDelete: (entryId: string) => void
  onBrowse: (slot: MealSlot) => void
}) {
  const [expanded, setExpanded] = useState(true)
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
        
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); onBrowse(config.slot); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Plus size={14} /> Add Food
          </button>
          {hasFood && (
            <button className="text-white/40 p-1">
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
                  <button
                    onClick={() => onDelete(entry.id)}
                    className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:opacity-100"
                    aria-label="Remove food"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ))}
          
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
  const { user } = useAuthStore()
  const { entries, removeEntry } = useFoodLogStore()
  const [browsingSlot, setBrowsingSlot] = useState<MealSlot | null>(null)

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

  return (
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
        <div className="bg-[#121212] border border-white/5 rounded-3xl p-6 mb-8 shadow-xl">
          <h2 className="text-sm font-medium text-white/50 uppercase tracking-widest mb-6">Daily Totals</h2>
          <div className="flex justify-between items-end mb-6">
            <div className="flex items-baseline gap-2">
              <AnimatedNumber value={totals.calories} className="text-4xl font-heading font-bold text-white" />
              <span className="text-white/40">kcal</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-white/50 mb-2">Protein</div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-lg font-bold text-emerald-400">{Math.round(totals.protein)}</span>
                <span className="text-xs text-white/40">g</span>
              </div>
              <ProgressBar value={totals.protein} max={150} colorClass="bg-emerald-400" heightClass="h-1" className="bg-white/5" />
            </div>
            <div>
              <div className="text-xs text-white/50 mb-2">Carbs</div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-lg font-bold text-blue-400">{Math.round(totals.carbs)}</span>
                <span className="text-xs text-white/40">g</span>
              </div>
              <ProgressBar value={totals.carbs} max={250} colorClass="bg-blue-400" heightClass="h-1" className="bg-white/5" />
            </div>
            <div>
              <div className="text-xs text-white/50 mb-2">Fats</div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-lg font-bold text-purple-400">{Math.round(totals.fat)}</span>
                <span className="text-xs text-white/40">g</span>
              </div>
              <ProgressBar value={totals.fat} max={80} colorClass="bg-purple-400" heightClass="h-1" className="bg-white/5" />
            </div>
          </div>
        </div>

        {/* Meal Slots */}
        <div className="space-y-1">
          {MEAL_CONFIG.map(config => (
            <MealSection
              key={config.slot}
              config={config}
              entries={todayEntries.filter(e => e.meal === config.slot)}
              onDelete={(id) => removeEntry(user?.uid || "demo", id)}
              onBrowse={setBrowsingSlot}
            />
          ))}
        </div>

        {browsingSlot && (
          <div className="fixed inset-0 z-50 bg-[#0a0a0a] overflow-y-auto">
            <FoodSearch slot={browsingSlot} onClose={() => setBrowsingSlot(null)} />
          </div>
        )}
      </div>
    </PageTransition>
  )
}
