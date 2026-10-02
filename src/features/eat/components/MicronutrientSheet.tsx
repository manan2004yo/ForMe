// ============================================================
// FORME — Micronutrient Detail Sheet
// ============================================================
// Secondary detailed view for vitamins and minerals.
// Only shows micronutrients where reliable data exists in the
// food database. Kept completely off the main dashboard.
// Accessible via a "Nutrients" button in EatDashboard.
// ============================================================

import { motion, AnimatePresence } from 'framer-motion'
import { X, Leaf } from 'lucide-react'
import { useMemo } from 'react'
import type { NutritionInfo } from '@/types'
import { useFoodLogStore } from '@/store/foodLogStore'

interface MicronutrientSheetProps {
  isOpen: boolean
  onClose: () => void
}

interface MicroTarget {
  key: keyof NutritionInfo
  label: string
  unit: string
  dailyTarget?: number
  color: string
}

const MICRO_TARGETS: MicroTarget[] = [
  { key: 'fiber', label: 'Fiber', unit: 'g', dailyTarget: 30, color: 'var(--macro-fiber)' },
  { key: 'calcium', label: 'Calcium', unit: 'mg', dailyTarget: 1000, color: '#60A5FA' },
  { key: 'iron', label: 'Iron', unit: 'mg', dailyTarget: 18, color: '#F87171' },
  { key: 'sodium', label: 'Sodium', unit: 'mg', dailyTarget: 2300, color: '#FBBF24' },
  { key: 'potassium', label: 'Potassium', unit: 'mg', dailyTarget: 3500, color: '#A78BFA' },
  { key: 'vitaminC', label: 'Vitamin C', unit: 'mg', dailyTarget: 90, color: '#34D399' },
  { key: 'magnesium', label: 'Magnesium', unit: 'mg', color: '#C084FC' },
  { key: 'zinc', label: 'Zinc', unit: 'mg', color: '#F59E0B' },
  { key: 'vitaminA', label: 'Vitamin A', unit: 'mcg', color: '#FB7185' },
  { key: 'vitaminD', label: 'Vitamin D', unit: 'IU', color: '#FDE047' },
  { key: 'b12', label: 'Vitamin B12', unit: 'mcg', color: '#22D3EE' },
]

export function MicronutrientSheet({ isOpen, onClose }: MicronutrientSheetProps) {
  const { entries, selectedDate } = useFoodLogStore()

  const totals = useMemo(() => {
    const foods = entries
      .filter(entry => entry.date === selectedDate)
      .flatMap(entry => entry.foods)

    return MICRO_TARGETS.reduce<Record<string, number | null>>((acc, micro) => {
      if (foods.length === 0) {
        acc[micro.key] = null
        return acc
      }

      let total = 0

      for (const food of foods) {
        const value = food.nutrition[micro.key]

        if (value === null || value === undefined) {
          acc[micro.key] = null
          return acc
        }

        total += value
      }

      acc[micro.key] = total
      return acc
    }, {})
  }, [entries, selectedDate])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-[#0f0f0f] border-t border-white/10 rounded-t-3xl"
            style={{ maxHeight: '80vh' }}
          >
            <div className="flex flex-col" style={{ maxHeight: '80vh' }}>
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 shrink-0">
                <div className="flex items-center gap-2">
                  <Leaf size={18} className="text-green-400" />
                  <h2 className="text-lg font-bold text-white">Micronutrients</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Disclaimer */}
              <div className="px-5 pb-3 shrink-0">
                <p className="text-xs text-white/30 text-center">
                  Only shown where reliable data exists in your food log.
                  Values are estimates based on logged foods.
                </p>
              </div>

              {/* Micronutrient bars */}
              <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-4">
                {MICRO_TARGETS.map((micro, index) => {
                  const current = totals[micro.key]
                  const hasData = typeof current === 'number'
                  const hasTarget = micro.dailyTarget !== undefined
                  const percent = hasData && hasTarget
                    ? Math.min(100, Math.round((current / micro.dailyTarget!) * 100))
                    : null
                  const isAdequate = percent !== null && percent >= 70
                  const isOver = percent !== null && percent > 120

                  return (
                    <motion.div
                      key={micro.key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-white">
                          {micro.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/40 tabular-nums">
                            {hasData
                              ? hasTarget
                                ? `${Math.round(current)} / ${micro.dailyTarget}${micro.unit}`
                                : `${Math.round(current)}${micro.unit}`
                              : '—'}
                          </span>
                          {percent !== null && (
                            <span
                              className="text-xs font-bold tabular-nums"
                              style={{
                                color: isOver
                                  ? 'var(--status-warning)'
                                  : isAdequate
                                  ? 'var(--status-good)'
                                  : 'var(--status-bad)'
                              }}
                            >
                              {percent}%
                            </span>
                          )}
                        </div>
                      </div>

                      {hasTarget ? (
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent ?? 0}%` }}
                            transition={{ duration: 0.8, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: isOver
                                ? 'var(--status-warning)'
                                : micro.color
                            }}
                          />
                        </div>
                      ) : (
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          {hasData && (
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              transition={{ duration: 0.5, delay: index * 0.05 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: micro.color, opacity: 0.55 }}
                            />
                          )}
                        </div>
                      )}

                      {!hasData && (
                        <p className="text-[10px] text-white/20 mt-1">
                          Unknown — at least one logged food has no reliable {micro.label.toLowerCase()} value
                        </p>
                      )}
                      {isOver && (
                        <p className="text-[10px] text-amber-400/60 mt-1">
                          Above daily recommended amount
                        </p>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
