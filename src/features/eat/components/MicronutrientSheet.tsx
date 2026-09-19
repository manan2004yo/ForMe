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
import { useUserStore } from '@/store/userStore'
import { useFoodLogStore } from '@/store/foodLogStore'

interface MicronutrientSheetProps {
  isOpen: boolean
  onClose: () => void
}

interface MicroTarget {
  key: string
  label: string
  unit: string
  dailyTarget: number
  color: string
}

// Only track micros where the Indian food database has reliable data
const MICRO_TARGETS: MicroTarget[] = [
  { key: 'fiber', label: 'Fiber', unit: 'g', dailyTarget: 30, color: 'var(--macro-fiber)' },
  { key: 'calcium', label: 'Calcium', unit: 'mg', dailyTarget: 1000, color: '#60A5FA' },
  { key: 'iron', label: 'Iron', unit: 'mg', dailyTarget: 18, color: '#F87171' },
  { key: 'sodium', label: 'Sodium', unit: 'mg', dailyTarget: 2300, color: '#FBBF24' },
  { key: 'potassium', label: 'Potassium', unit: 'mg', dailyTarget: 3500, color: '#A78BFA' },
  { key: 'vitaminC', label: 'Vitamin C', unit: 'mg', dailyTarget: 90, color: '#34D399' },
]

export function MicronutrientSheet({ isOpen, onClose }: MicronutrientSheetProps) {
  const { todayTotals } = useFoodLogStore()
  const totals = todayTotals()

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
                  const current = (totals as any)[micro.key] ?? 0
                  const percent = Math.min(100, Math.round((current / micro.dailyTarget) * 100))
                  const isAdequate = percent >= 70
                  const isOver = percent > 120

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
                            {current > 0
                              ? `${Math.round(current)} / ${micro.dailyTarget}${micro.unit}`
                              : `— / ${micro.dailyTarget}${micro.unit}`
                            }
                          </span>
                          {current > 0 && (
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

                      {/* Progress bar */}
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.8, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: isOver
                              ? 'var(--status-warning)'
                              : micro.color
                          }}
                        />
                      </div>

                      {/* Status label */}
                      {current === 0 && (
                        <p className="text-[10px] text-white/20 mt-1">
                          No data — log foods with {micro.label.toLowerCase()} to track this
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
