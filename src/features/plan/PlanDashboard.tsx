// ============================================================
// FORME - Premium Diet Plan Dashboard
// ============================================================

import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Sun, Sunset, Moon, Coffee, Save, Download } from 'lucide-react'
import { usePlanStore } from '@/store/planStore'
import type { MealSlot, NutritionInfo } from '@/types'
import { PlanFoodSearch } from './PlanFoodSearch'
import { ProgressBar, AnimatedNumber } from '@/components/shared'
import { PageTransition } from '@/components/layout/PageTransition'
import { clsx } from 'clsx'
import { useUserStore } from '@/store/userStore'

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

function MealSection({ slot, label, foods, onBrowse }: {
  slot: MealSlot
  label: string
  foods: any[]
  onBrowse: (slot: MealSlot) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const { removeFoodFromSlot } = usePlanStore()
  
  const totals: NutritionInfo = foods.reduce((acc, f) => ({
    calories: acc.calories + f.nutrition.calories,
    protein: acc.protein + f.nutrition.protein,
    carbs: acc.carbs + f.nutrition.carbs,
    fat: acc.fat + f.nutrition.fat,
    fiber: acc.fiber + f.nutrition.fiber,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })

  const hasFood = foods.length > 0

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
          <div>
            <h3 className="text-white font-medium">{label}</h3>
            {hasFood && (
              <div className="flex items-center gap-4 mt-1">
                <span className="text-xs text-white/70 font-semibold">{Math.round(totals.calories)} kcal</span>
                <span className="text-[10px] text-emerald-400 font-medium">{Math.round(totals.protein)}g Protein</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onBrowse(slot); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-all text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-95"
          >
            <Plus size={14} /> Search food
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
          {foods.map(food => (
            <div key={food.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 mb-2 last:mb-0 group">
              <div>
                <div className="text-sm text-white font-medium">{food.name}</div>
                <div className="text-xs text-white/50 mt-1">
                  {food.quantity} {food.unit} - {Math.round(food.nutrition.calories)} kcal
                </div>
              </div>
              {confirmDeleteId === food.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-400 font-medium">Remove?</span>
                  <button 
                    onClick={() => { removeFoodFromSlot(slot, food.id); setConfirmDeleteId(null); }}
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
                  onClick={() => setConfirmDeleteId(food.id)}
                  className="px-3 py-1.5 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:opacity-100 text-xs font-semibold active:scale-95"
                >
                  Remove item
                </button>
              )}
            </div>
          ))}
          
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 mb-2">
            <button className="text-xs font-medium text-white/50 hover:text-white transition-colors active:scale-95 px-2 py-1 rounded-md hover:bg-white/5">Edit meal</button>
            <button className="text-xs font-medium text-white/50 hover:text-white transition-colors active:scale-95 px-2 py-1 rounded-md hover:bg-white/5">Copy previous meal</button>
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

export function PlanDashboard() {
  const { currentPlan, templates, saveAsTemplate, loadTemplate, clearPlan } = usePlanStore()
  const { metrics } = useUserStore()
  const [browsingSlot, setBrowsingSlot] = useState<MealSlot | null>(null)

  const totals = currentPlan.reduce((acc, slot) => {
    slot.foods.forEach(f => {
      acc.calories += f.nutrition.calories
      acc.protein += f.nutrition.protein
      acc.carbs += f.nutrition.carbs
      acc.fat += f.nutrition.fat
    })
    return acc
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const handleSaveTemplate = () => {
    const name = prompt("Enter a name for this diet plan template (e.g., Hostel Breakfast):")
    if (name) saveAsTemplate(name)
  }

  return (
    <PageTransition>
      <div className="page relative">
        <header className="page-header mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-white tracking-tight">
              Diet Plan
            </h1>
            <p className="text-sm text-white/50 font-medium tracking-wide mt-2">
              Plan your meals to hit your macros
            </p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleSaveTemplate}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Save size={16} /> Save Plan
            </button>
            <button 
              onClick={clearPlan}
              className="px-4 py-2 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Trash2 size={16} /> Clear
            </button>
          </div>
        </header>

        {templates.length > 0 && (
          <div className="mb-8 flex gap-3 overflow-x-auto hide-scrollbar">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => loadTemplate(t.id)}
                className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Download size={16} /> Load "{t.name}"
              </button>
            ))}
          </div>
        )}

        {/* Plan Summary vs Target */}
        <div className="bg-[#121212] border border-white/5 rounded-3xl p-6 mb-8 shadow-xl">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-sm font-medium text-white/50 uppercase tracking-widest mb-1">Planned Calories</h2>
              <div className="flex items-baseline gap-2">
                <AnimatedNumber value={totals.calories} className="text-4xl font-heading font-bold text-white" />
                <span className="text-white/40">/ {metrics?.caloricTarget || 0} kcal</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-white/50 mb-2">Protein ({metrics?.proteinTarget}g)</div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-lg font-bold text-emerald-400">{Math.round(totals.protein)}</span>
                <span className="text-xs text-white/40">g</span>
              </div>
              <ProgressBar value={totals.protein} max={metrics?.proteinTarget || 150} colorClass="bg-emerald-400" heightClass="h-1" className="bg-white/5" />
            </div>
            <div>
              <div className="text-xs text-white/50 mb-2">Carbs ({metrics?.carbTarget}g)</div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-lg font-bold text-blue-400">{Math.round(totals.carbs)}</span>
                <span className="text-xs text-white/40">g</span>
              </div>
              <ProgressBar value={totals.carbs} max={metrics?.carbTarget || 250} colorClass="bg-blue-400" heightClass="h-1" className="bg-white/5" />
            </div>
            <div>
              <div className="text-xs text-white/50 mb-2">Fats ({metrics?.fatTarget}g)</div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-lg font-bold text-purple-400">{Math.round(totals.fat)}</span>
                <span className="text-xs text-white/40">g</span>
              </div>
              <ProgressBar value={totals.fat} max={metrics?.fatTarget || 80} colorClass="bg-purple-400" heightClass="h-1" className="bg-white/5" />
            </div>
          </div>
        </div>

        {/* Meal Slots */}
        <div className="space-y-1">
          {currentPlan.map(slot => (
            <MealSection
              key={slot.slot}
              slot={slot.slot}
              label={slot.label}
              foods={slot.foods}
              onBrowse={setBrowsingSlot}
            />
          ))}
        </div>

        {browsingSlot && (
          <div className="fixed inset-0 z-50 bg-[#0a0a0a] overflow-y-auto">
            <PlanFoodSearch slot={browsingSlot} onClose={() => setBrowsingSlot(null)} />
          </div>
        )}
      </div>
    </PageTransition>
  )
}
