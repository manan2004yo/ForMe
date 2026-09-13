// ============================================================
// FORME — Eat Dashboard
// Premium Redesign
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { format, subDays, addDays, isToday } from 'date-fns'
import { Plus, Search, ChevronDown, ChevronUp, Trash2, Loader2, ChevronLeft, ChevronRight, Camera } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUserStore } from '@/store/userStore'
import { useFoodLogStore } from '@/store/foodLogStore'
import { useToastStore } from '@/store/toastStore'
import { parseNaturalLanguageFoodEntry } from '@/lib/engines/nlpParser'
import type { MealSlot, FoodLogEntry, LoggedFoodItem, NutritionInfo } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import { getNutritionForGrams } from '@/lib/data/indianFoods'
import { FoodSearch } from './FoodSearch'
import { StatCard, ProgressBar, AnimatedNumber } from '@/components/shared'
import { Button } from '@/components/ui'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { PageTransition } from '@/components/layout/PageTransition'

const MEAL_CONFIG: { slot: MealSlot; label: string; emoji: string; time: string }[] = [
  { slot: 'breakfast', label: 'Breakfast', emoji: '🌅', time: '7–9 AM' },
  { slot: 'lunch', label: 'Lunch', emoji: '☀️', time: '12–2 PM' },
  { slot: 'snack', label: 'Snack', emoji: '🍎', time: '3–5 PM' },
  { slot: 'dinner', label: 'Dinner', emoji: '🌙', time: '7–9 PM' },
  { slot: 'pre_workout', label: 'Pre-Workout', emoji: '⚡', time: 'Pre' },
  { slot: 'post_workout', label: 'Post-Workout', emoji: '💪', time: 'Post' },
]

function NutritionChip({ label, value, unit, colorClass }: { label: string; value: number; unit: string; colorClass: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={clsx("w-2 h-2 rounded-full", colorClass)} />
      <span className="text-micro text-text-tertiary">{label}</span>
      <AnimatedNumber value={value} className="text-caption font-bold text-text-primary" />
      <span className="text-caption font-medium text-text-primary">{unit}</span>
    </div>
  )
}

function MealIconTile({ config, entries, onAdd, onDelete, onBrowse, onVision }: {
  config: typeof MEAL_CONFIG[0]
  entries: FoodLogEntry[]
  onAdd: (slot: MealSlot) => void
  onDelete: (entryId: string) => void
  onBrowse: (slot: MealSlot) => void
  onVision: (slot: MealSlot) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const { user } = useAuthStore()
  
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
    <StatCard padding="none" className={clsx(hasFood ? 'shadow-sm' : 'border-border-strong/50 bg-bg-surface/50')}>
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-bg-surface2/50 transition-colors"
        onClick={() => hasFood && setExpanded(e => !e)}
      >
        <div className="w-12 h-12 rounded-[14px] bg-bg-surface2 flex items-center justify-center text-2xl flex-shrink-0 shadow-sm border border-border">
          {config.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="text-body font-semibold text-text-primary">{config.label}</span>
            <span className="text-micro text-text-tertiary">{config.time}</span>
          </div>
          {hasFood ? (
            <div className="text-caption text-text-secondary">
              <span className="font-semibold text-text-primary">{Math.round(totals.calories)} kcal</span>
              <span className="opacity-50 mx-1">·</span>
              {allFoods.length} item{allFoods.length > 1 ? 's' : ''}
            </div>
          ) : (
            <div className="text-caption text-text-tertiary">Nothing logged yet</div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={e => { e.stopPropagation(); onVision(config.slot) }}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-text-secondary hover:bg-bg-surface2 hover:text-accent transition-colors active:scale-95"
            aria-label="Scan food with camera"
          >
            <Camera size={18} strokeWidth={2.5} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onBrowse(config.slot) }}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-text-secondary hover:bg-bg-surface2 hover:text-text-primary transition-colors active:scale-95"
          >
            <Search size={18} strokeWidth={2.5} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onAdd(config.slot) }}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-accent-light text-accent hover:bg-accent hover:text-white transition-all shadow-sm active:scale-95"
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && hasFood && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 border-t border-border overflow-hidden"
          >
            <div className="flex gap-4 py-3 border-b border-border-strong/30 mb-2">
            <NutritionChip label="P" value={totals.protein} unit="g" colorClass="bg-macro-protein" />
            <NutritionChip label="C" value={totals.carbs} unit="g" colorClass="bg-macro-carbs" />
            <NutritionChip label="F" value={totals.fat} unit="g" colorClass="bg-macro-fat" />
            <NutritionChip label="Fi" value={totals.fiber} unit="g" colorClass="bg-macro-fiber" />
          </div>
          <div className="flex flex-col">
            {entries.map(entry => (
              <div key={entry.id}>
                {entry.foods.map((food, fi) => (
                  <div key={fi} className="flex items-center gap-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-text-primary truncate">{food.foodName}</div>
                      <div className="text-xs text-text-tertiary">
                        {food.quantity} {food.unit} · {Math.round(food.nutrition.calories)} kcal
                      </div>
                    </div>
                    <button
                      onClick={() => user && onDelete(entry.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-text-tertiary hover:bg-error/10 hover:text-error transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </StatCard>
  )
}

function FoodLogger({ slot, onClose }: { slot: MealSlot; onClose: () => void }) {
  const [text, setText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedItems, setParsedItems] = useState<LoggedFoodItem[]>([])
  const [error, setError] = useState('')
  const { user } = useAuthStore()
  const { addFoodEntry } = useFoodLogStore()
  const toast = useToastStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { textareaRef.current?.focus() }, [])

  const handleParse = async () => {
    if (!text.trim()) return
    setIsProcessing(true)
    setError('')
    try {
      const result = parseNaturalLanguageFoodEntry(text)
      const items: LoggedFoodItem[] = result.parsedItems
        .filter(item => item.foodItem)
        .map(item => {
          const food = item.foodItem!
          const unit = item.unit as any
          let grams = item.quantity
          if (unit !== 'gram') grams = (food.gramsPerUnit[unit] || food.gramsPerUnit['serving'] || 100) * item.quantity
          return {
            id: uuidv4(),
            foodItemId: food.id,
            foodName: food.name,
            quantity: item.quantity,
            unit,
            gramsConsumed: grams,
            nutrition: getNutritionForGrams(food, grams),
            confidence: item.confidence > 0.8 ? 'high' : item.confidence > 0.5 ? 'moderate' : 'lower',
          }
        })
      
      if (items.length === 0) setError('Could not recognize the food items. Try: "2 roti, 1 katori dal"')
      else setParsedItems(items)
    } finally { setIsProcessing(false) }
  }

  const handleLog = async () => {
    if (!user || parsedItems.length === 0) return
    const totalCal = Math.round(parsedItems.reduce((s, i) => s + i.nutrition.calories, 0))
    await addFoodEntry(user.uid, slot, parsedItems)
    toast.success(`Logged ${parsedItems.length} item${parsedItems.length > 1 ? 's' : ''} · ${totalCal} kcal`)
    onClose()
  }

  const mealConfig = MEAL_CONFIG.find(m => m.slot === slot)!

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-bg-surface w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-floating overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl drop-shadow-sm">{mealConfig.emoji}</span>
            <h2 className="text-section text-text-primary">Log {mealConfig.label}</h2>
          </div>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => { setText(e.target.value); setParsedItems([]); setError('') }}
            placeholder="What did you eat?&#10;&#10;Examples:&#10;• 2 roti, 1 dal, 1 sabzi&#10;• 3 boiled eggs, banana"
            className="w-full h-32 bg-bg-surface2 border border-border rounded-xl p-4 text-body text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none mb-4"
          />

          {error && <div className="text-sm text-status-bad bg-error/10 px-4 py-3 rounded-xl mb-4 font-medium border border-error/20">{error}</div>}

          {parsedItems.length > 0 && (
            <div className="mb-6 animate-slide-up">
              <div className="text-label text-text-secondary mb-3">Recognized items:</div>
              <div className="flex flex-col gap-2">
                {parsedItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-3 px-4 bg-bg-surface2 border border-border rounded-xl">
                    <div>
                      <div className="text-sm font-semibold text-text-primary">{item.foodName}</div>
                      <div className="text-xs text-text-tertiary mt-0.5">
                        {item.quantity} {item.unit} · {Math.round(item.nutrition.calories)} kcal
                        · P:{Math.round(item.nutrition.protein)}g C:{Math.round(item.nutrition.carbs)}g F:{Math.round(item.nutrition.fat)}g
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {parsedItems.length === 0 && !text && (
            <div className="mb-6">
              <div className="text-micro text-text-tertiary mb-3">Quick log:</div>
              <div className="flex flex-wrap gap-2">
                {['2 roti, dal', '1 cup rice, rajma', '3 eggs', 'poha', 'oats + banana'].map(s => (
                  <button key={s} onClick={() => setText(s)} className="px-3 py-1.5 bg-bg-surface2 border border-border rounded-pill text-xs font-medium text-text-secondary hover:bg-accent hover:text-white transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={onClose} variant="secondary" fullWidth>Cancel</Button>
            {parsedItems.length > 0 ? (
              <Button onClick={handleLog} variant="primary" fullWidth className="bg-accent hover:bg-accent-dark">
                Log {parsedItems.length} item{parsedItems.length > 1 ? 's' : ''}
              </Button>
            ) : (
              <Button onClick={handleParse} disabled={!text.trim() || isProcessing} isLoading={isProcessing} variant="primary" fullWidth className="bg-text-primary">
                Parse Food
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function VisionLogger({ slot, onClose }: { slot: MealSlot; onClose: () => void }) {
  const [image, setImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [parsedItems, setParsedItems] = useState<LoggedFoodItem[]>([])
  
  const { user } = useAuthStore()
  const { addFoodEntry } = useFoodLogStore()
  const toast = useToastStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setImage(url)
    
    setIsAnalyzing(true)
    setTimeout(() => {
      const mockResultText = "2 roti, 1 katori dal makhani, 1 katori palak paneer"
      const result = parseNaturalLanguageFoodEntry(mockResultText)
      const items: LoggedFoodItem[] = result.parsedItems.filter(i => i.foodItem).map(item => {
        const food = item.foodItem!
        const unit = item.unit as any
        let grams = item.quantity
        if (unit !== 'gram') grams = (food.gramsPerUnit[unit] || food.gramsPerUnit['serving'] || 100) * item.quantity
        return {
          id: uuidv4(), foodItemId: food.id, foodName: food.name, quantity: item.quantity, unit, gramsConsumed: grams,
          nutrition: getNutritionForGrams(food, grams), confidence: 'high',
        }
      })
      setParsedItems(items)
      setIsAnalyzing(false)
    }, 2500)
  }

  const handleLog = async () => {
    if (!user || parsedItems.length === 0) return
    const totalCal = Math.round(parsedItems.reduce((s, i) => s + i.nutrition.calories, 0))
    await addFoodEntry(user.uid, slot, parsedItems)
    toast.success(`Vision AI logged ${parsedItems.length} item${parsedItems.length > 1 ? 's' : ''}`)
    if (image) URL.revokeObjectURL(image)
    onClose()
  }

  const handleCancel = () => {
    if (image) URL.revokeObjectURL(image)
    onClose()
  }

  const mealConfig = MEAL_CONFIG.find(m => m.slot === slot)!

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={handleCancel}>
      <div className="bg-bg-surface w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-floating overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl drop-shadow-sm">📸</span>
            <h2 className="text-section text-text-primary">Vision AI for {mealConfig.label}</h2>
          </div>

          {!image ? (
            <div 
              className="border-2 border-dashed border-border-strong rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-accent-light/50 transition-all text-center mb-6"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 rounded-full bg-accent-light text-accent flex items-center justify-center mb-4 shadow-sm">
                <Camera size={32} />
              </div>
              <h3 className="text-body font-semibold text-text-primary mb-1">Take a photo of your food</h3>
              <p className="text-sm text-text-tertiary">Our AI will automatically identify the items and portion sizes.</p>
              <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
            </div>
          ) : (
            <div className="mb-6">
              <div className="relative rounded-2xl overflow-hidden mb-4 border border-border bg-black/5 aspect-video shadow-inner">
                <img src={image} alt="Food" className="w-full h-full object-cover" />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                    <Loader2 size={36} className="animate-spin text-accent mb-4" />
                    <div className="text-section font-semibold drop-shadow-md">Vision AI Analyzing...</div>
                    <div className="text-sm text-white/80 drop-shadow-sm">Identifying ingredients & portions</div>
                  </div>
                )}
              </div>
              
              {!isAnalyzing && parsedItems.length > 0 && (
                <div className="animate-slide-up">
                  <div className="text-label text-text-secondary mb-3 flex items-center gap-2">
                    <span className="text-accent">✨</span> AI Recognized:
                  </div>
                  <div className="flex flex-col gap-2">
                    {parsedItems.map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-3 px-4 bg-bg-surface2 border border-border rounded-xl">
                        <div>
                          <div className="text-sm font-semibold text-text-primary">{item.foodName}</div>
                          <div className="text-xs text-text-tertiary mt-0.5">
                            {item.quantity} {item.unit} · {Math.round(item.nutrition.calories)} kcal
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleCancel} variant="secondary" fullWidth>Cancel</Button>
            {image && !isAnalyzing && parsedItems.length > 0 && (
              <Button onClick={handleLog} variant="primary" fullWidth className="bg-accent hover:bg-accent-dark">
                Log {parsedItems.length} item{parsedItems.length > 1 ? 's' : ''}
              </Button>
            )}
            {image && !isAnalyzing && (
               <Button onClick={() => { setImage(null); setParsedItems([]); fileInputRef.current?.click(); }} variant="secondary" fullWidth>
                 Retake
               </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function EatDashboard() {
  const [activeLogger, setActiveLogger] = useState<MealSlot | null>(null)
  const [activeBrowser, setActiveBrowser] = useState<MealSlot | null>(null)
  const [activeVision, setActiveVision] = useState<MealSlot | null>(null)
  const { user } = useAuthStore()
  const { profile, metrics } = useUserStore()
  const { entries, selectedDate, todayTotals, loadLogs, removeEntry, setDate } = useFoodLogStore()
  const toast = useToastStore()

  useEffect(() => { if (user) loadLogs(user.uid) }, [user, loadLogs])
  if (!profile || !metrics) return null

  const totals = todayTotals()
  
  const navigateDate = (direction: 'prev' | 'next') => {
    const current = new Date(selectedDate)
    const next = direction === 'prev' ? subDays(current, 1) : addDays(current, 1)
    const nextStr = format(next, 'yyyy-MM-dd')
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    if (nextStr > todayStr) return
    setDate(nextStr)
    if (user) loadLogs(user.uid, nextStr)
  }

  const selectedDateObj = new Date(selectedDate)
  const isTodaySelected = isToday(selectedDateObj)

  const entriesForMeal = (slot: MealSlot) => entries.filter(e => e.date === selectedDate && e.meal === slot)

  const handleDelete = async (entryId: string) => {
    if (!user) return
    await removeEntry(user.uid, entryId)
    toast.info('Entry removed')
  }

  return (
    <PageTransition>
      <div className="page bg-bg pt-6">
        {/* Header (Sticky) */}
        <div className="page-header flex flex-col mb-6 animate-fade-in">
          <h1 className="text-display text-text-primary">What you ate <span className="drop-shadow-sm">🥗</span></h1>
          
          <div className="flex items-center gap-2 mt-4 bg-bg-surface2 rounded-xl p-1 shadow-inner border border-border">
            <button onClick={() => navigateDate('prev')} className="w-10 h-10 flex items-center justify-center rounded-lg text-text-secondary hover:bg-bg-surface hover:shadow-soft transition-all active:scale-95">
              <ChevronLeft size={20} />
            </button>
            <div className="flex-1 text-center flex flex-col justify-center">
              <div className="text-label text-text-primary leading-tight">
                {isTodaySelected ? 'Today' : format(selectedDateObj, 'EEEE')}
              </div>
              <div className="text-micro text-text-tertiary">{format(selectedDateObj, 'd MMM yyyy')}</div>
            </div>
            <button onClick={() => navigateDate('next')} disabled={isTodaySelected} className={clsx("w-10 h-10 flex items-center justify-center rounded-lg transition-all", isTodaySelected ? "text-text-tertiary opacity-30" : "text-text-secondary hover:bg-bg-surface hover:shadow-soft active:scale-95")}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <StatCard padding="lg" className="mb-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-baseline gap-1">
              <AnimatedNumber value={totals.calories} className="text-hero text-text-primary" />
              <span className="text-body font-semibold text-text-tertiary">/ {metrics.caloricTarget} kcal</span>
            </div>
            <div className="text-label text-text-secondary bg-bg-surface2 px-3 py-1.5 rounded-pill border border-border">
              {Math.max(0, Math.round(metrics.caloricTarget - totals.calories))} kcal left
            </div>
          </div>
          
          <ProgressBar value={totals.calories} max={metrics.caloricTarget} heightClass="h-2.5" className="mb-6" colorClass="bg-accent" />
          
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Protein', consumed: totals.protein, target: metrics.proteinTarget, colorClass: 'bg-macro-protein' },
              { label: 'Carbs', consumed: totals.carbs, target: metrics.carbTarget, colorClass: 'bg-macro-carbs' },
              { label: 'Fat', consumed: totals.fat, target: metrics.fatTarget, colorClass: 'bg-macro-fat' },
              { label: 'Fiber', consumed: totals.fiber, target: metrics.fiberTarget, colorClass: 'bg-macro-fiber' },
            ].map(({ label, consumed, target, colorClass }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <div className="text-sm font-semibold text-text-primary tabular-nums text-center">
                  <AnimatedNumber value={consumed} />g
                </div>
                <ProgressBar value={consumed} max={target} colorClass={colorClass} heightClass="h-1.5" />
                <div className="text-micro text-text-tertiary text-center">{label}</div>
              </div>
            ))}
          </div>
        </StatCard>

        <div className="flex flex-col gap-3 pb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
          {MEAL_CONFIG.map(config => (
            <MealIconTile
              key={config.slot}
              config={config}
              entries={entriesForMeal(config.slot)}
              onAdd={(slot) => setActiveLogger(slot)}
              onDelete={handleDelete}
              onBrowse={(slot) => setActiveBrowser(slot)}
              onVision={(slot) => setActiveVision(slot)}
            />
          ))}
        </div>

        {activeLogger && <FoodLogger slot={activeLogger} onClose={() => setActiveLogger(null)} />}
        {activeBrowser && <FoodSearch slot={activeBrowser} onClose={() => setActiveBrowser(null)} />}
        {activeVision && <VisionLogger slot={activeVision} onClose={() => setActiveVision(null)} />}
      </div>
    </PageTransition>
  )
}
