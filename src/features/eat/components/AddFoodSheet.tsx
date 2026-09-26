// ============================================================
// FORME — Add Food Sheet
// Unified bottom sheet for all food-logging input methods
// ============================================================

import { parseNaturalLanguageFoodEntry, convertToLoggedItems } from '@/lib/engines/nlpParser'
import { getAllPortionMemories } from '@/lib/services/portionMemoryService'
import { startVybeListening } from '@/components/vybe/VYBEMicButton'
import { useAuthStore } from '@/store/authStore'
import { useFoodLogStore } from '@/store/foodLogStore'
import { useToastStore } from '@/store/toastStore'
import { useVybeStore } from '@/store/vybeStore'
import type { LoggedFoodItem, MealSlot } from '@/types'
import { clsx } from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Barcode,
  ChevronRight,
  Clock,
  PenLine,
  Search,
  SplitSquareHorizontal,
  Sun,
  X,
  Mic,
  Check,
  AlertCircle,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { createPortal } from 'react-dom'

// ─── Meal label helper ────────────────────────────────────────

const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snack: 'Snacks',
  dinner: 'Dinner',
  pre_workout: 'Pre-Workout',
  post_workout: 'Post-Workout',
}

// ─── NLP Type-it-out sub-view ─────────────────────────────────

interface NlpViewProps {
  onCancel: () => void
  onFallbackSearch: () => void
  onFallbackSnap: () => void
  onConfirm: (items: LoggedFoodItem[]) => void
}

function NlpView({ onCancel, onFallbackSearch, onFallbackSnap, onConfirm }: NlpViewProps) {
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<LoggedFoodItem[] | null>(null)
  const [noMatch, setNoMatch] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleParse = () => {
    if (!text.trim()) return
    const result = parseNaturalLanguageFoodEntry(text.trim())
    const items = convertToLoggedItems(result)
    if (items.length === 0) {
      setNoMatch(true)
      setParsed(null)
    } else {
      setNoMatch(false)
      setParsed(items)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-base">Type it out</h3>
        <button onClick={onCancel} className="p-1.5 text-white/40 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <textarea
        ref={inputRef}
        autoFocus
        value={text}
        onChange={e => { setText(e.target.value); setParsed(null); setNoMatch(false) }}
        placeholder="e.g. 2 roti, 1 katori dal, 150g rice"
        rows={3}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none focus:border-accent/50 resize-none transition-all"
      />

      <button
        onClick={handleParse}
        disabled={!text.trim()}
        className="w-full py-3 rounded-xl bg-accent text-black font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
      >
        Parse Food
      </button>

      {/* No match state */}
      {noMatch && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle size={18} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-white/70">
              Couldn't recognize that food. Try Search or Snap a photo instead.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onFallbackSearch}
              className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Search size={14} /> Search
            </button>
            <button
              onClick={onFallbackSnap}
              className="flex-1 py-2.5 rounded-xl bg-accent text-black text-sm font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Sun size={14} /> Snap Photo
            </button>
          </div>
        </motion.div>
      )}

      {/* Parsed confirmation */}
      {parsed && parsed.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
          <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Confirm items</p>
          <div className="flex flex-col gap-2">
            {parsed.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm text-white font-medium">{item.foodName}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {item.quantity} {item.unit} · {Math.round(item.nutrition.calories)} kcal
                  </p>
                </div>
                <span className="text-xs text-emerald-400 font-semibold">P:{Math.round(item.nutrition.protein)}g</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => onConfirm(parsed)}
            className="w-full py-3.5 rounded-xl bg-accent text-black font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Check size={16} /> Log {parsed.length} item{parsed.length > 1 ? 's' : ''}
          </button>
        </motion.div>
      )}
    </div>
  )
}

// ─── Recent food chip ─────────────────────────────────────────

interface RecentFoodsProps {
  uid: string
  onLog: (item: LoggedFoodItem) => void
}

function RecentFoods({ uid, onLog }: RecentFoodsProps) {
  const { entries } = useFoodLogStore()

  const recentItems = useMemo(() => {
    // Derive recent unique food items from existing entries (newest first)
    const seen = new Set<string>()
    const result: LoggedFoodItem[] = []

    const sorted = [...entries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    for (const entry of sorted) {
      for (const food of entry.foods) {
        if (!seen.has(food.foodItemId)) {
          seen.add(food.foodItemId)
          result.push(food)
          if (result.length >= 8) return result
        }
      }
    }
    return result
  }, [entries])

  // Also include portion memory data to surface items user logs often
  const memoryItems = useMemo(() => getAllPortionMemories(uid).slice(0, 5), [uid])

  if (recentItems.length === 0 && memoryItems.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-white/40 uppercase tracking-wider font-semibold flex items-center gap-2">
        <Clock size={11} /> Recent Foods
      </p>
      <div className="flex flex-wrap gap-2">
        {recentItems.map(item => (
          <button
            key={item.id}
            onClick={() => onLog({ ...item, id: uuidv4() })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-medium hover:bg-white/10 hover:text-white active:scale-95 transition-all"
          >
            {item.foodName}
            <span className="text-white/30">· {Math.round(item.nutrition.calories)} kcal</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main Sheet ───────────────────────────────────────────────

export interface AddFoodSheetCallbacks {
  onSnap: (slot: MealSlot) => void
  onScan: (slot: MealSlot) => void
  onSearch: (slot: MealSlot) => void
  onFamilyMeal: () => void
}

export interface AddFoodSheetProps {
  slot: MealSlot
  onClose: () => void
  callbacks: AddFoodSheetCallbacks
}

export function AddFoodSheet({ slot, onClose, callbacks }: AddFoodSheetProps) {
  const { user } = useAuthStore()
  const { addFoodEntry } = useFoodLogStore()
  const toast = useToastStore()
  const { startListening, setProcessing, setResult, setError, reset } = useVybeStore()

  const [showNlp, setShowNlp] = useState(false)

  const mealLabel = MEAL_LABELS[slot]

  const handleVybe = () => {
    // Call startVybeListening DIRECTLY and SYNCHRONOUSLY inside this click handler.
    // rec.start() must fire as a direct result of the user gesture — any indirection
    // (window events, programmatic .click() calls, async gaps) causes browsers to
    // silently refuse to start Speech Recognition.
    startVybeListening(
      { mealSlot: slot },
      { startListening, setProcessing, setResult, setError, reset }
    )
    // Close the sheet visually AFTER rec.start() has been invoked synchronously above.
    onClose()
  }

  const handleNlpConfirm = async (items: LoggedFoodItem[]) => {
    if (!user) return
    await addFoodEntry(user.uid, slot, items)
    toast.success(`${items.length} item${items.length > 1 ? 's' : ''} logged!`)
    onClose()
  }

  const handleRecentLog = async (item: LoggedFoodItem) => {
    if (!user) return
    await addFoodEntry(user.uid, slot, [item])
    toast.success(`${item.foodName} added!`)
    onClose()
  }

  const ACTIONS = [
    {
      id: 'snap',
      icon: Sun,
      label: 'Snap a Photo',
      sublabel: 'AI identifies your meal instantly',
      accent: true,
      onClick: () => { onClose(); callbacks.onSnap(slot) },
    },
    {
      id: 'scan',
      icon: Barcode,
      label: 'Scan Barcode',
      sublabel: 'Packaged food in seconds',
      accent: false,
      onClick: () => { onClose(); callbacks.onScan(slot) },
    },
    {
      id: 'search',
      icon: Search,
      label: 'Search Foods',
      sublabel: 'Browse Indian food database',
      accent: false,
      onClick: () => { onClose(); callbacks.onSearch(slot) },
    },
    {
      id: 'vybe',
      icon: Mic,
      label: 'Speak to Vybe',
      sublabel: 'Log food with your voice',
      accent: false,
      onClick: handleVybe,
    },
    {
      id: 'type',
      icon: PenLine,
      label: 'Type it out',
      sublabel: 'Natural language · "2 roti, 1 katori dal"',
      accent: false,
      onClick: () => setShowNlp(true),
    },
    {
      id: 'family',
      icon: SplitSquareHorizontal,
      label: 'Split a Family Meal',
      sublabel: "Calculate exact macros for shared dishes",
      accent: false,
      onClick: () => { onClose(); callbacks.onFamilyMeal() },
    },
  ]

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="sheet-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
      />
      <motion.div
        key="sheet-panel"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[90] bg-[#0f0f0f] border-t border-white/10 rounded-t-3xl overflow-hidden"
        style={{ maxHeight: '90vh', paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="overflow-y-auto px-5 pb-6" style={{ maxHeight: 'calc(90vh - 32px)' }}>
          {/* Header */}
          <div className="flex items-center justify-between py-3 mb-2">
            <div>
              <p className="text-[11px] text-white/40 uppercase tracking-wider font-semibold">Add to</p>
              <h2 className="text-lg font-bold text-white">{mealLabel}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-white transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* NLP view or main actions */}
          <AnimatePresence mode="wait">
            {showNlp ? (
              <motion.div
                key="nlp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
              >
                <NlpView
                  onCancel={() => setShowNlp(false)}
                  onFallbackSearch={() => { setShowNlp(false); onClose(); callbacks.onSearch(slot) }}
                  onFallbackSnap={() => { setShowNlp(false); onClose(); callbacks.onSnap(slot) }}
                  onConfirm={handleNlpConfirm}
                />
              </motion.div>
            ) : (
              <motion.div
                key="actions"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-2"
              >
                {/* Action rows */}
                <div className="flex flex-col gap-2 mb-5">
                  {ACTIONS.map(action => {
                    const Icon = action.icon
                    return (
                      <button
                        key={action.id}
                        onClick={action.onClick}
                        className={clsx(
                          'w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all active:scale-[0.98] text-left',
                          action.accent
                            ? 'bg-accent/10 border-accent/20 hover:bg-accent/20'
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                        )}
                      >
                        <div className={clsx(
                          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                          action.accent ? 'bg-accent/20 text-accent' : 'bg-white/10 text-white/70'
                        )}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={clsx('font-semibold text-sm', action.accent ? 'text-accent' : 'text-white')}>
                            {action.label}
                          </p>
                          <p className="text-xs text-white/40 truncate">{action.sublabel}</p>
                        </div>
                        <ChevronRight size={16} className="text-white/20 shrink-0" />
                      </button>
                    )
                  })}
                </div>

                {/* Recent foods */}
                {user && user.uid !== 'demo' && (
                  <RecentFoods uid={user.uid} onLog={handleRecentLog} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
