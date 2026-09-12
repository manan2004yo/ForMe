// ============================================================
// FORME — Eat Dashboard
// Food logging with NLP, meal cards, and daily summary
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { format, subDays, addDays, isToday } from 'date-fns'
import { Plus, Search, ChevronDown, ChevronUp, Trash2, Loader2, ChevronLeft, ChevronRight, Calendar, Camera, ImageIcon } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUserStore } from '@/store/userStore'
import { useFoodLogStore } from '@/store/foodLogStore'
import { useToastStore } from '@/store/toastStore'
import { parseNaturalLanguageFoodEntry } from '@/lib/engines/nlpParser'
import type { MealSlot, FoodLogEntry, LoggedFoodItem, NutritionInfo } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import { FOOD_MAP, getNutritionForGrams } from '@/lib/data/indianFoods'
import { FoodSearch } from './FoodSearch'

const MEAL_CONFIG: { slot: MealSlot; label: string; emoji: string; time: string }[] = [
  { slot: 'breakfast', label: 'Breakfast', emoji: '🌅', time: '7–9 AM' },
  { slot: 'lunch', label: 'Lunch', emoji: '☀️', time: '12–2 PM' },
  { slot: 'snack', label: 'Snack', emoji: '🍎', time: '3–5 PM' },
  { slot: 'dinner', label: 'Dinner', emoji: '🌙', time: '7–9 PM' },
  { slot: 'pre_workout', label: 'Pre-Workout', emoji: '⚡', time: 'Pre' },
  { slot: 'post_workout', label: 'Post-Workout', emoji: '💪', time: 'Post' },
]

function NutritionChip({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-xs text-text-tertiary">{label}</span>
      <span className="text-xs font-medium text-text-primary">{Math.round(value)}{unit}</span>
    </div>
  )
}

function MealCard({ config, entries, onAdd, onDelete, onBrowse, onVision }: {
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
    <div className={`card overflow-hidden border ${hasFood ? '' : 'border-border/50'}`}>
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={() => hasFood && setExpanded(e => !e)}
      >
        <div className="w-10 h-10 rounded-xl bg-bg-surface2 flex items-center justify-center text-xl flex-shrink-0">
          {config.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-medium text-text-primary">{config.label}</span>
            <span className="text-xs text-text-tertiary">{config.time}</span>
          </div>
          {hasFood && (
            <div className="text-xs text-text-secondary mt-0.5">
              {Math.round(totals.calories)} kcal · {allFoods.length} item{allFoods.length > 1 ? 's' : ''}
            </div>
          )}
          {!hasFood && (
            <div className="text-xs text-text-tertiary">Nothing logged yet</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); onVision(config.slot) }}
            className="btn btn-ghost p-2 rounded-xl"
            id={`vision-food-${config.slot}`}
            aria-label="Scan food with camera"
          >
            <Camera size={16} className="text-text-secondary hover:text-accent transition-colors" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onBrowse(config.slot) }}
            className="btn btn-ghost p-2 rounded-xl"
            id={`browse-food-${config.slot}`}
          >
            <Search size={16} className="text-text-secondary" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onAdd(config.slot) }}
            className="btn btn-ghost p-2 rounded-xl bg-accent/10"
            id={`add-food-${config.slot}`}
          >
            <Plus size={18} className="text-accent" />
          </button>
          {hasFood && (
            expanded ? <ChevronUp size={16} className="text-text-tertiary" /> : <ChevronDown size={16} className="text-text-tertiary" />
          )}
        </div>
      </div>

      {expanded && hasFood && (
        <div className="px-4 pb-4 border-t border-border animate-fade-in">
          <div className="flex gap-4 py-3">
            <NutritionChip label="P" value={totals.protein} unit="g" color="#7C6AF4" />
            <NutritionChip label="C" value={totals.carbs} unit="g" color="#F4A26A" />
            <NutritionChip label="F" value={totals.fat} unit="g" color="#6ABFF4" />
            <NutritionChip label="Fi" value={totals.fiber} unit="g" color="#6AF4A2" />
          </div>
          <div className="flex flex-col gap-2">
            {entries.map(entry => (
              <div key={entry.id}>
                {entry.foods.map((food, fi) => (
                  <div key={fi} className="flex items-center gap-3 py-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text-primary truncate">{food.foodName}</div>
                      <div className="text-xs text-text-tertiary">
                        {food.quantity} {food.unit} · {Math.round(food.nutrition.calories)} kcal
                      </div>
                    </div>
                    <button
                      onClick={() => user && onDelete(entry.id)}
                      className="p-1.5 text-text-tertiary hover:text-error transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
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

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

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
          if (unit !== 'gram') {
            grams = (food.gramsPerUnit[unit] || food.gramsPerUnit['serving'] || 100) * item.quantity
          }
          const nutrition = getNutritionForGrams(food, grams)
          return {
            id: uuidv4(),
            foodItemId: food.id,
            foodName: food.name,
            quantity: item.quantity,
            unit,
            gramsConsumed: grams,
            nutrition,
            confidence: item.confidence > 0.8 ? 'high' : item.confidence > 0.5 ? 'moderate' : 'lower',
          }
        })
      
      if (items.length === 0) {
        setError('Could not recognize the food items. Try: "2 roti, 1 katori dal, 1 cup rice"')
      } else {
        setParsedItems(items)
      }
    } finally {
      setIsProcessing(false)
    }
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">{mealConfig.emoji}</span>
            <h2 className="font-heading font-bold text-xl text-text-primary">Log {mealConfig.label}</h2>
          </div>

          {/* NLP Input */}
          <div className="mb-4">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => { setText(e.target.value); setParsedItems([]); setError('') }}
              placeholder={`What did you eat?\n\nExamples:\n• 2 roti, 1 katori dal, 1 katori sabzi\n• 3 boiled eggs, banana, oats\n• 1 plate rice, rajma, dahi`}
              className="input-field h-32 resize-none font-body text-sm"
            />
          </div>

          {error && (
            <div className="text-sm text-error bg-error-light px-3 py-2 rounded-xl mb-3">
              {error}
            </div>
          )}

          {/* Parsed Items Preview */}
          {parsedItems.length > 0 && (
            <div className="mb-4 animate-slide-up">
              <div className="text-sm font-medium text-text-secondary mb-2">Recognized items:</div>
              <div className="flex flex-col gap-2">
                {parsedItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 bg-success-light rounded-xl">
                    <div>
                      <div className="text-sm font-medium text-text-primary">{item.foodName}</div>
                      <div className="text-xs text-text-tertiary">
                        {item.quantity} {item.unit} · {Math.round(item.nutrition.calories)} kcal
                        · P:{Math.round(item.nutrition.protein)}g C:{Math.round(item.nutrition.carbs)}g F:{Math.round(item.nutrition.fat)}g
                      </div>
                    </div>
                    <div className={`badge ${item.confidence === 'high' ? 'badge-success' : 'badge-neutral'} text-xs`}>
                      {item.confidence}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 px-3 py-2 bg-bg-surface2 rounded-xl text-sm">
                <span className="font-medium text-text-primary">Total:</span>
                <span className="text-text-secondary ml-2">
                  {Math.round(parsedItems.reduce((s, i) => s + i.nutrition.calories, 0))} kcal ·{' '}
                  P:{Math.round(parsedItems.reduce((s, i) => s + i.nutrition.protein, 0))}g ·{' '}
                  C:{Math.round(parsedItems.reduce((s, i) => s + i.nutrition.carbs, 0))}g
                </span>
              </div>
            </div>
          )}

          {/* Quick suggestions */}
          {parsedItems.length === 0 && !text && (
            <div className="mb-4">
              <div className="text-xs text-text-tertiary mb-2">Quick log:</div>
              <div className="flex flex-wrap gap-2">
                {['2 roti, dal', '1 cup rice, rajma', '3 eggs', 'poha', 'oats + banana'].map(s => (
                  <button
                    key={s}
                    onClick={() => setText(s)}
                    className="badge badge-neutral cursor-pointer hover:bg-accent-light hover:text-accent-dark transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-secondary btn-md flex-1">
              Cancel
            </button>
            {parsedItems.length > 0 ? (
              <button
                onClick={handleLog}
                className="btn btn-accent btn-md flex-1"
                id="confirm-log-food"
              >
                Log {parsedItems.length} item{parsedItems.length > 1 ? 's' : ''}
              </button>
            ) : (
              <button
                onClick={handleParse}
                disabled={!text.trim() || isProcessing}
                className="btn btn-accent btn-md flex-1"
                id="parse-food"
              >
                {isProcessing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : 'Parse Food'}
              </button>
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
    
    // Simulate Vision API
    setIsAnalyzing(true)
    setTimeout(() => {
      // MOCK VISION AI RESPONSE
      const mockResultText = "2 roti, 1 katori dal makhani, 1 katori palak paneer"
      const result = parseNaturalLanguageFoodEntry(mockResultText)
      
      const items: LoggedFoodItem[] = result.parsedItems
        .filter(item => item.foodItem)
        .map(item => {
          const food = item.foodItem!
          const unit = item.unit as any
          let grams = item.quantity
          if (unit !== 'gram') {
            grams = (food.gramsPerUnit[unit] || food.gramsPerUnit['serving'] || 100) * item.quantity
          }
          const nutrition = getNutritionForGrams(food, grams)
          return {
            id: uuidv4(),
            foodItemId: food.id,
            foodName: food.name,
            quantity: item.quantity,
            unit,
            gramsConsumed: grams,
            nutrition,
            confidence: 'high',
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
    toast.success(`Vision AI logged ${parsedItems.length} item${parsedItems.length > 1 ? 's' : ''} · ${totalCal} kcal`)
    if (image) URL.revokeObjectURL(image)
    onClose()
  }

  const handleCancel = () => {
    if (image) URL.revokeObjectURL(image)
    onClose()
  }

  const mealConfig = MEAL_CONFIG.find(m => m.slot === slot)!

  return (
    <div className="modal-backdrop" onClick={handleCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">📸</span>
            <h2 className="font-heading font-bold text-xl text-text-primary">Vision AI for {mealConfig.label}</h2>
          </div>

          {!image ? (
            <div 
              className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all text-center mb-5"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 rounded-full bg-accent/10 text-accent flex items-center justify-center mb-4">
                <Camera size={32} />
              </div>
              <h3 className="font-heading font-semibold text-text-primary mb-1">Take a photo of your food</h3>
              <p className="text-sm text-text-tertiary">Our AI will automatically identify the items and portion sizes.</p>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageSelect}
              />
            </div>
          ) : (
            <div className="mb-5">
              <div className="relative rounded-xl overflow-hidden mb-4 border border-border bg-black/5 aspect-video flex items-center justify-center">
                <img src={image} alt="Food" className="w-full h-full object-cover" />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                    <Loader2 size={32} className="animate-spin text-accent mb-3" />
                    <div className="font-heading font-semibold text-lg">Vision AI Analyzing...</div>
                    <div className="text-sm text-white/70">Identifying ingredients & portions</div>
                  </div>
                )}
              </div>
              
              {!isAnalyzing && parsedItems.length > 0 && (
                <div className="animate-slide-up">
                  <div className="text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
                    <span className="text-accent">✨</span> AI Recognized:
                  </div>
                  <div className="flex flex-col gap-2">
                    {parsedItems.map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 bg-accent/10 border border-accent/20 rounded-xl">
                        <div>
                          <div className="text-sm font-medium text-text-primary">{item.foodName}</div>
                          <div className="text-xs text-text-tertiary">
                            {item.quantity} {item.unit} · {Math.round(item.nutrition.calories)} kcal
                          </div>
                        </div>
                        <div className="badge badge-accent text-xs">High Confidence</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 px-3 py-2 bg-bg-surface2 rounded-xl text-sm flex justify-between">
                    <span className="font-medium text-text-primary">Total Calories:</span>
                    <span className="font-bold text-accent">
                      {Math.round(parsedItems.reduce((s, i) => s + i.nutrition.calories, 0))} kcal
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={handleCancel} className="btn btn-secondary btn-md flex-1">
              Cancel
            </button>
            {image && !isAnalyzing && parsedItems.length > 0 && (
              <button
                onClick={handleLog}
                className="btn btn-accent btn-md flex-1"
                id="confirm-vision-log"
              >
                Log {parsedItems.length} item{parsedItems.length > 1 ? 's' : ''}
              </button>
            )}
            {image && !isAnalyzing && (
               <button
                 onClick={() => {
                   setImage(null);
                   setParsedItems([]);
                   fileInputRef.current?.click();
                 }}
                 className="btn btn-secondary btn-md"
               >
                 Retake
               </button>
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
  const { entries, selectedDate, todayTotals, loadLogs, removeEntry, entriesForMeal, setDate } = useFoodLogStore()
  const toast = useToastStore()

  useEffect(() => {
    if (user) loadLogs(user.uid)
  }, [user, loadLogs])

  if (!profile || !metrics) return null

  const totals = todayTotals()
  const calPct = Math.min(100, (totals.calories / metrics.caloricTarget) * 100)

  const navigateDate = (direction: 'prev' | 'next') => {
    const current = new Date(selectedDate)
    const next = direction === 'prev' ? subDays(current, 1) : addDays(current, 1)
    const nextStr = format(next, 'yyyy-MM-dd')
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    if (nextStr > todayStr) return // Don't go to future
    setDate(nextStr)
    if (user) loadLogs(user.uid, nextStr)
  }

  const selectedDateObj = new Date(selectedDate)
  const isTodaySelected = isToday(selectedDateObj)

  const handleDelete = async (entryId: string) => {
    if (!user) return
    await removeEntry(user.uid, entryId)
    toast.info('Entry removed')
  }

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <h1 className="font-heading font-bold text-2xl text-text-primary">What you ate 🥗</h1>
        {/* Date Navigation */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => navigateDate('prev')}
            className="btn btn-ghost p-2 rounded-xl"
            id="eat-prev-day"
          >
            <ChevronLeft size={18} className="text-text-secondary" />
          </button>
          <div className="flex-1 text-center">
            <div className="text-sm font-medium text-text-primary">
              {isTodaySelected ? 'Today' : format(selectedDateObj, 'EEEE')}
            </div>
            <div className="text-xs text-text-tertiary">{format(selectedDateObj, 'd MMMM yyyy')}</div>
          </div>
          <button
            onClick={() => navigateDate('next')}
            disabled={isTodaySelected}
            className="btn btn-ghost p-2 rounded-xl"
            id="eat-next-day"
          >
            <ChevronRight size={18} className={isTodaySelected ? 'text-text-tertiary opacity-30' : 'text-text-secondary'} />
          </button>
        </div>
      </div>

      {/* Daily Summary Bar */}
      <div className="card p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="font-heading font-bold text-2xl text-text-primary tabular-nums">
              {Math.round(totals.calories)}
            </span>
            <span className="text-text-tertiary text-sm ml-1">/ {metrics.caloricTarget} kcal</span>
          </div>
          <div className="text-right">
            <div className="text-sm text-text-secondary">
              {Math.round(metrics.caloricTarget - totals.calories)} kcal left
            </div>
          </div>
        </div>
        <div className="h-2 bg-bg-surface2 rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${calPct}%`, backgroundColor: calPct > 100 ? '#C0392B' : '#C17B3F' }}
          />
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'Protein', consumed: totals.protein, target: metrics.proteinTarget, color: '#7C6AF4' },
            { label: 'Carbs', consumed: totals.carbs, target: metrics.carbTarget, color: '#F4A26A' },
            { label: 'Fat', consumed: totals.fat, target: metrics.fatTarget, color: '#6ABFF4' },
            { label: 'Fiber', consumed: totals.fiber, target: metrics.fiberTarget, color: '#6AF4A2' },
          ].map(({ label, consumed, target, color }) => (
            <div key={label}>
              <div className="text-xs font-medium text-text-primary tabular-nums">
                {Math.round(consumed)}g
              </div>
              <div className="h-1 bg-bg-surface2 rounded-full overflow-hidden my-1">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(100, (consumed / Math.max(1, target)) * 100)}%`, backgroundColor: color }}
                />
              </div>
              <div className="text-[10px] text-text-tertiary">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Meal Cards */}
      <div className="flex flex-col gap-3">
        {MEAL_CONFIG.map(config => (
          <MealCard
            key={config.slot}
            config={config}
            entries={entriesForMeal(selectedDate, config.slot)}
            onAdd={(slot) => setActiveLogger(slot)}
            onDelete={handleDelete}
            onBrowse={(slot) => setActiveBrowser(slot)}
            onVision={(slot) => setActiveVision(slot)}
          />
        ))}
      </div>

      {activeLogger && (
        <FoodLogger
          slot={activeLogger}
          onClose={() => setActiveLogger(null)}
        />
      )}

      {/* Food Browser Modal */}
      {activeBrowser && (
        <FoodSearch
          slot={activeBrowser}
          onClose={() => setActiveBrowser(null)}
        />
      )}

      {/* Vision Logger Modal */}
      {activeVision && (
        <VisionLogger
          slot={activeVision}
          onClose={() => setActiveVision(null)}
        />
      )}
    </div>
  )
}
