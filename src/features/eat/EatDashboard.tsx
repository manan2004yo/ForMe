// ============================================================
// FORME - Premium Eat Dashboard
// ============================================================

import { PageTransition } from '@/components/layout/PageTransition';

import { AnimatedNumber, ProgressBar } from '@/components/shared'
import { useAuthStore } from '@/store/authStore'
import { useCnsStore } from '@/store/cnsStore'
import { useFoodLogStore } from '@/store/foodLogStore'
import { useUserStore } from '@/store/userStore'
import { useVybeStore } from '@/store/vybeStore'
import type { FoodLogEntry, MealSlot, NutritionInfo } from '@/types'
import { createNutrient, sumNutrients } from '@/lib/nutrition/nutrientValue'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import { ChevronDown, ChevronUp, Coffee, Leaf, Moon, Plus, Sun, Sunset, Search, Flame } from 'lucide-react'
import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { EditFoodModal } from './EditFoodModal'
import { FamilyRecipeSplitter } from './FamilyRecipeSplitter'
import { FoodSearch } from './FoodSearch'
import { SnapAndLogModal } from './SnapAndLogModal'
import { startRecording } from '@/components/vybe/VYBEMicButton'
import type { SnapNutrients } from './SnapAndLogModal'
import { BarcodeScannerOverlay } from './components/BarcodeScannerOverlay'
import { BarcodeResultSheet } from './components/BarcodeResultSheet'
import { MicronutrientSheet } from './components/MicronutrientSheet'
import { AddFoodSheet } from './components/AddFoodSheet'
import type { ResolvedScannedProduct } from '@/lib/services/barcodeProductService'
import { calculateNutritionForGrams } from '@/lib/services/barcodeProductService'
import { saveLibraryProduct } from '@/lib/firebase/dataService'
import { displayToProfile } from '@/lib/nutrition/nutrientProfile'

/** Blank product for the Manual Add flow. Every nutrient starts unknown ("—"). */
function buildBlankManualProduct(barcode: string, name: string): ResolvedScannedProduct {
  return {
    barcode,
    name,
    brand: null,
    per100g: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    servingSizeG: null,
    dataSource: 'custom',
    imageUrl: null,
    trust: { tier: 'manual', label: 'Entered by you' },
    unknownFields: ['calories', 'protein', 'carbs', 'fat', 'fiber'],
  }
}

/** Builds the logged nutrition for a Snap photo meal. Unknown stays unknown; only known extras are included. */
function buildSnapNutrition(
  core: { calories: number; protein: number; carbs: number; fat: number },
  n: SnapNutrients | undefined
): NutritionInfo {
  const prov: import('@/types').Provenance = { source: 'ai_vision', timestamp: new Date().toISOString() }
  return {
    calories: createNutrient(core.calories, 'kcal', 'known', [prov]),
    protein: createNutrient(core.protein, 'g', 'known', [prov]),
    carbs: createNutrient(core.carbs, 'g', 'known', [prov]),
    fat: createNutrient(core.fat, 'g', 'known', [prov]),
    fiber: createNutrient(n?.fiber ?? 0, 'g', n?.fiber != null ? 'known' : 'unknown', [prov]),
    ...(n?.sugar != null && { sugar: createNutrient(n.sugar, 'g', 'known', [prov]) }),
    ...(n?.sodium != null && { sodium: createNutrient(n.sodium, 'mg', 'known', [prov]) }),
    ...(n?.potassium != null && { potassium: createNutrient(n.potassium, 'mg', 'known', [prov]) }),
    ...(n?.magnesium != null && { magnesium: createNutrient(n.magnesium, 'mg', 'known', [prov]) }),
    ...(n?.iron != null && { iron: createNutrient(n.iron, 'mg', 'known', [prov]) }),
    ...(n?.calcium != null && { calcium: createNutrient(n.calcium, 'mg', 'known', [prov]) }),
    ...(n?.zinc != null && { zinc: createNutrient(n.zinc, 'mg', 'known', [prov]) }),
    ...(n?.vitaminA != null && { vitaminA: createNutrient(n.vitaminA, 'mcg', 'known', [prov]) }),
    ...(n?.vitaminC != null && { vitaminC: createNutrient(n.vitaminC, 'mg', 'known', [prov]) }),
    ...(n?.vitaminD != null && { vitaminD: createNutrient(n.vitaminD, 'mcg', 'known', [prov]) }),
  }
}

/** Maps the Snap confidence words to the logged-item confidence type. */
function snapConfidence(c: 'high' | 'medium' | 'low' | undefined): 'high' | 'moderate' | 'lower' {
  return c === 'high' ? 'high' : c === 'medium' ? 'moderate' : 'lower'
}

/** Scales every known nutrient by ratio. null stays null (unknown), absent stays absent. */
function scaleNutrition(n: NutritionInfo, ratio: number): NutritionInfo {
  const out: Record<string, number | null> = {}
  for (const [key, value] of Object.entries(n)) {
    if (typeof value === 'number') out[key] = value * ratio
    else if (value === null) out[key] = null
  }
  return out as unknown as NutritionInfo
}

const MEAL_CONFIG: { slot: MealSlot; label: string; icon: any; time: string }[] = [
  { slot: 'breakfast', label: 'Breakfast', icon: Sun, time: 'Morning' },
  { slot: 'lunch', label: 'Lunch', icon: Sun, time: 'Afternoon' },
  { slot: 'snack', label: 'Snacks', icon: Coffee, time: 'Anytime' },
  { slot: 'dinner', label: 'Dinner', icon: Moon, time: 'Evening' },
  { slot: 'pre_workout', label: 'Pre-Workout', icon: Sunset, time: 'Before Training' },
  { slot: 'post_workout', label: 'Post-Workout', icon: Sunset, time: 'After Training' },
]

function NutritionChip({ label, value, unit, colorClass }: { label: string; value: import('@/types').NutrientValue; unit: string; colorClass: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-white/40 mb-1">{label}</span>
      <div className="flex items-baseline gap-1">
        {value.state !== 'known' && <span className={clsx("font-semibold text-sm", colorClass)}>{value.state === 'conflict' ? '~' : '>'}</span>}
        <span className={clsx("font-semibold text-sm", colorClass)}>{Math.round(value.value ?? 0)}</span>
        <span className="text-xs text-white/50">{unit}</span>
      </div>
    </div>
  )
}

function MealSection({ config, entries, onDelete, onAddFood, onEdit }: {
  config: typeof MEAL_CONFIG[0]
  entries: FoodLogEntry[]
  onDelete: (entryId: string) => void
  onAddFood: (slot: MealSlot) => void
  onEdit: (entry: FoodLogEntry) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const Icon = config.icon
  
  const hasFood = entries.length > 0
  const totals: NutritionInfo = {
    calories: sumNutrients(entries.map(e => e.totals?.calories ?? createNutrient(0, 'kcal', 'known', [])), 'kcal'),
    protein: sumNutrients(entries.map(e => e.totals?.protein ?? createNutrient(0, 'g', 'known', [])), 'g'),
    carbs: sumNutrients(entries.map(e => e.totals?.carbs ?? createNutrient(0, 'g', 'known', [])), 'g'),
    fat: sumNutrients(entries.map(e => e.totals?.fat ?? createNutrient(0, 'g', 'known', [])), 'g'),
    fiber: sumNutrients(entries.map(e => e.totals?.fiber ?? createNutrient(0, 'g', 'known', [])), 'g')
  }

  return (
    <div className="glass-panel overflow-hidden mb-4 transition-all duration-300 hover:shadow-card-hover">
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
                <span className="text-xs text-white/70 font-semibold">{Math.round(totals.calories.value ?? 0)} kcal</span>
                <span className="text-[10px] text-emerald-400 font-medium">{Math.round(totals.protein.value ?? 0)}g Protein</span>
              </div>
            ) : (
              <span className="text-xs text-white/40 mt-1 block">{config.time}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Single unified Add Food button */}
          <button
            onClick={(e) => { e.stopPropagation(); onAddFood(config.slot); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-black hover:bg-accent/90 transition-all text-xs font-bold outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95 shadow-[0_0_10px_rgba(45,212,191,0.2)]"
          >
            <Plus size={14} /> Add Food
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
                      {food.quantity} {food.unit} - {Math.round(food.nutrition.calories.value ?? 0)} kcal
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
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => onEdit(entry)}
                        className="px-3 py-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg outline-none text-xs font-semibold active:scale-95"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(entry.id)}
                        className="px-3 py-1.5 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg outline-none text-xs font-semibold active:scale-95"
                      >
                        Remove
                      </button>
                    </div>
                  )}
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
  const [showRecipeSplitter, setShowRecipeSplitter] = useState(false)
  const { user } = useAuthStore()
  const { metrics } = useUserStore()
  const { entries, removeEntry, addFoodEntry, updateEntry, loadLogs, selectedDate, isLoading } = useFoodLogStore()

  useEffect(() => {
    if (user) {
      loadLogs(user.uid, selectedDate)
    }
  }, [user, loadLogs, selectedDate])

  const [addFoodSlot, setAddFoodSlot] = useState<MealSlot | null>(null)
  const [browsingSlot, setBrowsingSlot] = useState<MealSlot | null>(null)
  const [snappingSlot, setSnappingSlot] = useState<MealSlot | null>(null)
  const [scanningSlot, setScanningSlot] = useState<MealSlot | null>(null)
  // Keep slot alive after scanner closes so BarcodeResultSheet can log to correct meal
  const [pendingScanSlot, setPendingScanSlot] = useState<MealSlot>('snack')
  const [scannedProduct, setScannedProduct] = useState<ResolvedScannedProduct | null>(null)
  const [isManualScan, setIsManualScan] = useState(false)
  const [editingEntry, setEditingEntry] = useState<FoodLogEntry | null>(null)
  const [showMicronutrients, setShowMicronutrients] = useState(false)

  // Listen for VYBE resolved food handoff
  const vybeResolvedFood = useVybeStore(s => s.resolvedFood)
  const vybeContext = useVybeStore(s => s.context)

  useEffect(() => {
    if (vybeResolvedFood) {
      setScannedProduct(vybeResolvedFood)
      setIsManualScan(false)
      if (vybeContext?.mealSlot) {
        setPendingScanSlot(vybeContext.mealSlot)
      }
      // Clear the handoff state so we don't reopen it endlessly
      useVybeStore.getState().setResolvedFood(null)
      useVybeStore.getState().reset()
    }
  }, [vybeResolvedFood, vybeContext])

  const todayEntries = entries.filter(e => e.date === format(new Date(), 'yyyy-MM-dd'))

  const totals = {
    calories: sumNutrients(todayEntries.map(e => e.totals?.calories ?? createNutrient(0, 'kcal', 'known', [])), 'kcal'),
    protein: sumNutrients(todayEntries.map(e => e.totals?.protein ?? createNutrient(0, 'g', 'known', [])), 'g'),
    carbs: sumNutrients(todayEntries.map(e => e.totals?.carbs ?? createNutrient(0, 'g', 'known', [])), 'g'),
    fat: sumNutrients(todayEntries.map(e => e.totals?.fat ?? createNutrient(0, 'g', 'known', [])), 'g')
  }

  // Dynamic targets from User Profile
  const baseProtein = metrics?.proteinTarget || 150
  const baseCarbs = metrics?.carbTarget || 250
  const baseFat = metrics?.fatTarget || 80
  const baseCals = metrics?.caloricTarget || 2000

  return (
    <>
      <PageTransition>
      <div className="page relative">
        <header className="page-header mb-8 flex justify-between items-start">
          <div>
            <p className="text-sm text-white/50 font-medium tracking-wide mb-1 uppercase">
              {format(new Date(), 'EEEE, d MMM')}
            </p>
            <h1 className="text-3xl font-heading font-bold text-white tracking-tight">
              Food Log
            </h1>
          </div>
          <button
            onClick={() => setShowMicronutrients(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs font-semibold transition-all active:scale-95"
          >
            <Leaf size={14} /> Nutrients
          </button>
        </header>

        {isLoading ? (
          <div className="flex flex-col gap-4 animate-pulse mt-8">
            <div className="h-48 bg-white/5 rounded-3xl w-full"></div>
            <div className="h-20 bg-white/5 rounded-2xl w-full"></div>
            <div className="h-20 bg-white/5 rounded-2xl w-full"></div>
            <div className="h-20 bg-white/5 rounded-2xl w-full"></div>
          </div>
        ) : (
          <>
        {/* INTENT CAPTURE HUB */}
        <div className="glass-panel p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <h2 className="text-lg font-medium text-white mb-4">What are you logging?</h2>
          
          <div className="grid grid-cols-4 gap-3 mb-4">
            <button 
              onClick={() => {
                const h = new Date().getHours();
                const slot = h < 11 ? 'breakfast' : h < 15 ? 'lunch' : h < 18 ? 'snack' : 'dinner';
                startRecording({ mealSlot: slot })
              }}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 group"
            >
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                <div className="w-4 h-4 rounded-full bg-accent animate-pulse" />
              </div>
              <span className="text-xs font-medium text-white/70 group-hover:text-white">Speak</span>
            </button>

            <button 
              onClick={() => {
                const h = new Date().getHours();
                const slot = h < 11 ? 'breakfast' : h < 15 ? 'lunch' : h < 18 ? 'snack' : 'dinner';
                setScanningSlot(slot); setPendingScanSlot(slot); 
              }}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-400/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M8 7v10"/><path d="M12 7v10"/><path d="M16 7v10"/></svg>
              </div>
              <span className="text-xs font-medium text-white/70 group-hover:text-white">Scan</span>
            </button>

            <button 
              onClick={() => {
                const h = new Date().getHours();
                const slot = h < 11 ? 'breakfast' : h < 15 ? 'lunch' : h < 18 ? 'snack' : 'dinner';
                setSnappingSlot(slot);
              }}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 group"
            >
              <div className="w-10 h-10 rounded-full bg-purple-400/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
              </div>
              <span className="text-xs font-medium text-white/70 group-hover:text-white">Snap</span>
            </button>

            <button 
              onClick={() => {
                const h = new Date().getHours();
                const slot = h < 11 ? 'breakfast' : h < 15 ? 'lunch' : h < 18 ? 'snack' : 'dinner';
                setAddFoodSlot(slot);
              }}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 group"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 group-hover:scale-110 transition-transform">
                <Plus size={20} />
              </div>
              <span className="text-xs font-medium text-white/70 group-hover:text-white">Type</span>
            </button>
          </div>
          
          <button 
            onClick={() => {
                const h = new Date().getHours();
                const slot = h < 11 ? 'breakfast' : h < 15 ? 'lunch' : h < 18 ? 'snack' : 'dinner';
                setAddFoodSlot(slot);
            }}
            className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-between transition-colors border border-white/5 group"
          >
            <div className="flex items-center gap-3">
              <Search size={16} className="text-white/40 group-hover:text-white/70" />
              <span className="text-sm text-white/50 group-hover:text-white/80 font-medium">Search for food or saved meals...</span>
            </div>
            <div className="px-2 py-1 bg-white/10 rounded text-[10px] text-white/40">Search</div>
          </button>
        </div>

        {/* DAILY PROGRESS */}
        <div className="glass-panel p-6 mb-8">
          <div className="flex justify-between items-end mb-6">
            <div>
              <div className="text-sm text-white/50 uppercase tracking-widest font-medium mb-1">Total Consumed</div>
              <div className="flex items-baseline gap-2">
                <AnimatedNumber value={totals.calories.value ?? 0} className="text-4xl font-heading font-bold text-white" />
                <span className="text-white/40 font-medium">/ {baseCals} kcal</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Pro</span>
                <span className="text-xs font-bold text-white">{Math.round(totals.protein.value ?? 0)}<span className="text-white/40 font-normal">/{baseProtein}</span></span>
              </div>
              <ProgressBar value={totals.protein.value ?? 0} max={baseProtein} colorClass="bg-emerald-400" heightClass="h-1.5" className="bg-white/5" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">Carb</span>
                <span className="text-xs font-bold text-white">{Math.round(totals.carbs.value ?? 0)}<span className="text-white/40 font-normal">/{baseCarbs}</span></span>
              </div>
              <ProgressBar value={totals.carbs.value ?? 0} max={baseCarbs} colorClass="bg-blue-400" heightClass="h-1.5" className="bg-white/5" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">Fat</span>
                <span className="text-xs font-bold text-white">{Math.round(totals.fat.value ?? 0)}<span className="text-white/40 font-normal">/{baseFat}</span></span>
              </div>
              <ProgressBar value={totals.fat.value ?? 0} max={baseFat} colorClass="bg-purple-400" heightClass="h-1.5" className="bg-white/5" />
            </div>
          </div>
        </div>

        {/* ACTUAL NUTRITION LOG */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-white/50 uppercase tracking-widest pl-1">Today's Log</h2>
          {MEAL_CONFIG.map(config => {
            const mealEntries = todayEntries.filter(e => e.meal === config.slot)
            if (mealEntries.length === 0) return null // Hide empty slots
            
            return (
              <MealSection
                key={config.slot}
                config={config}
                entries={mealEntries}
                onDelete={(id) => removeEntry(user?.uid || "demo", id)}
                onAddFood={setAddFoodSlot}
                onEdit={(entry) => setEditingEntry(entry)}
              />
            )
          })}
          {todayEntries.length === 0 && (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                <Flame size={24} className="text-white/20" />
              </div>
              <p className="text-white/40 text-sm font-medium">No fuel logged today.</p>
              <p className="text-white/30 text-xs mt-1">Use the options above to capture intent.</p>
            </div>
          )}
        </div>


        {editingEntry && (
          <EditFoodModal
            entry={editingEntry}
            onClose={() => setEditingEntry(null)}
            onSave={(newQty) => {
              const food = editingEntry.foods[0]
              if (!food) return
              const ratio = newQty / food.quantity
              const updatedFood = {
                ...food,
                quantity: newQty,
                gramsConsumed: food.gramsConsumed * ratio,
                nutrition: scaleNutrition(food.nutrition, ratio),
              }
              updateEntry(user?.uid || "demo", editingEntry.id, {
                ...editingEntry,
                foods: [updatedFood],
                totals: updatedFood.nutrition,
                updatedAt: new Date().toISOString()
              })
              setEditingEntry(null)
            }}
          />
        )}

        {browsingSlot && (
          <div className="fixed inset-0 z-50 bg-[#0a0a0a] overflow-y-auto">
            <FoodSearch slot={browsingSlot} onClose={() => setBrowsingSlot(null)} />
          </div>
        )}

        {snappingSlot && (
          <SnapAndLogModal 
            slot={snappingSlot} 
            onClose={() => setSnappingSlot(null)}
            onLog={(data) => {
              addFoodEntry(user?.uid || "demo", snappingSlot, [{
                id: uuidv4(),
                foodItemId: 'ai-vision',
                foodName: data.foodName,
                quantity: data.servings,
                unit: 'serving',
                gramsConsumed: data.portionGrams ?? 0,
                nutrition: buildSnapNutrition({ calories: data.calories, protein: data.protein, carbs: data.carbs, fat: data.fat }, data.nutrients)
              }])
              setSnappingSlot(null)
            }}
          />
        )}
      </>
        )}
      </div>
      </PageTransition>

      {showRecipeSplitter && <FamilyRecipeSplitter onClose={() => setShowRecipeSplitter(false)} />}

      {/* Unified Add Food Sheet */}
      {addFoodSlot && (
        <AddFoodSheet
          slot={addFoodSlot}
          onClose={() => setAddFoodSlot(null)}
          callbacks={{
            onSnap: (slot) => { setAddFoodSlot(null); setSnappingSlot(slot) },
            onScan: (slot) => { setAddFoodSlot(null); setScanningSlot(slot) },
            onSearch: (slot) => { setAddFoodSlot(null); setBrowsingSlot(slot) },
            onFamilyMeal: () => { setAddFoodSlot(null); setShowRecipeSplitter(true) },
          }}
        />
      )}

      {/* Barcode Scanner */}
      <BarcodeScannerOverlay
        isOpen={!!scanningSlot}
        onClose={() => setScanningSlot(null)}
        onProductFound={(product) => {
          // Persist the slot BEFORE clearing scanningSlot
          if (scanningSlot) setPendingScanSlot(scanningSlot)
          setIsManualScan(false)
          setScannedProduct(product)
          setScanningSlot(null)
        }}
        onSearchManually={(ctx) => {
          // scanningSlot is still set here. Keep its slot so the sheet logs to the right meal.
          const slot = scanningSlot
          setScanningSlot(null)
          if (slot) setPendingScanSlot(slot)
          setIsManualScan(true)
          setScannedProduct(buildBlankManualProduct(ctx.barcode, ctx.name))
        }}
      />

      <BarcodeResultSheet
        key={scannedProduct ? `${isManualScan ? 'manual' : 'scan'}-${scannedProduct.barcode}` : 'empty'}
        product={scannedProduct}
        isManualAdd={isManualScan}
        onLog={(product, grams) => {
          const multiplier = grams / 100
          const sourceMap: Record<string, import('@/types').EvidenceSource> = {
            'ai_estimate': 'ai_vision',
            'open_food_facts': 'open_food_facts',
            'upcitemdb': 'upcitemdb',
            'user_manual': 'user_manual',
          }
          const mappedSource = sourceMap[product.trust.tier] || 'legacy_log'
          const prov: import('@/types').Provenance = { source: mappedSource, timestamp: new Date().toISOString() }

          const nutrition: import('@/types').NutritionInfo = {
            calories: createNutrient(product.per100g.calories * multiplier, 'kcal', product.unknownFields.includes('calories') ? 'unknown' : 'known', [prov]),
            protein: createNutrient(product.per100g.protein * multiplier, 'g', product.unknownFields.includes('protein') ? 'unknown' : 'known', [prov]),
            carbs: createNutrient(product.per100g.carbs * multiplier, 'g', product.unknownFields.includes('carbs') ? 'unknown' : 'known', [prov]),
            fat: createNutrient(product.per100g.fat * multiplier, 'g', product.unknownFields.includes('fat') ? 'unknown' : 'known', [prov]),
            fiber: createNutrient(product.per100g.fiber * multiplier, 'g', product.unknownFields.includes('fiber') ? 'unknown' : 'known', [prov]),
            ...(product.unknownFields.includes('sugar')
              ? {}
              : product.per100g.sugar !== undefined
                ? { sugar: createNutrient(product.per100g.sugar * multiplier, 'g', 'known', [prov]) }
                : {}),
            ...(product.unknownFields.includes('sodium')
              ? {}
              : product.per100g.sodium !== undefined
                ? { sodium: createNutrient(product.per100g.sodium * multiplier, 'mg', 'known', [prov]) }
                : {}),
          }

          addFoodEntry(
            user?.uid || 'demo',
            pendingScanSlot,
            [{
              id: uuidv4(),
              foodItemId: `barcode-${product.barcode}`,
              foodName: product.brand ? `${product.name} (${product.brand})` : product.name,
              quantity: grams,
              unit: 'gram',
              gramsConsumed: grams,
              nutrition,
            }],
            `barcode-${product.barcode}`,
            'gram',
            grams
          )

          // Save user-confirmed products (label-verified or manually entered) to the personal library.
          // Database and AI-estimate products are never saved here.
          const libUid = user?.uid
          const libTier = product.trust.tier
          if (libUid && (libTier === 'label' || libTier === 'manual')) {

            saveLibraryProduct(libUid, {
              barcode: product.barcode,
              name: product.name,
              brand: product.brand,
              per100g: {
                ...displayToProfile(product.per100g, product.unknownFields),
              },
              servingSizeG: product.servingSizeG,
              trust: libTier,
              updatedAt: new Date().toISOString(),
            }).catch(() => {
              // Already saved on this device; cloud write failure is logged inside saveLibraryProduct
            })
          }

          setScannedProduct(null)
          setIsManualScan(false)
        }}
        onClose={() => { setScannedProduct(null); setIsManualScan(false) }}
      />

      <MicronutrientSheet
        isOpen={showMicronutrients}
        onClose={() => setShowMicronutrients(false)}
      />
    </>
  )
}
