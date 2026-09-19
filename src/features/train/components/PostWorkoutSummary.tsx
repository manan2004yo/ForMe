// ============================================================
// FORME — Post Workout Summary
// ============================================================
// Shown after endSession() completes successfully.
// Displays duration, sets, volume, and top progression highlight.
// ============================================================

import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, TrendingUp, X } from 'lucide-react'
import { useUserStore, toDisplayWeight } from '@/store/userStore'

export interface WorkoutSummaryData {
  label: string
  durationMin: number
  exerciseCount: number
  setCount: number
  totalVolumeKg: number
  topProgression: {
    exerciseName: string
    previous: { weight: number; reps: number } | null
    current: { weight: number; reps: number } | null
  } | null
}

interface PostWorkoutSummaryProps {
  summary: WorkoutSummaryData | null
  onClose: () => void
}

export function PostWorkoutSummary({ summary, onClose }: PostWorkoutSummaryProps) {
  const { weightUnit } = useUserStore()

  return (
    <AnimatePresence>
      {summary && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-end justify-center p-4"
        >
          <motion.div
            initial={{ y: 60, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 60, scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-6 pb-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center">
                  <Trophy size={20} className="text-accent" />
                </div>
                <div>
                  <p className="text-xs text-white/30 font-bold uppercase tracking-wider">
                    Workout Complete
                  </p>
                  <h2 className="text-lg font-bold text-white">{summary.label}</h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Duration', value: `${summary.durationMin}`, unit: 'min' },
                { label: 'Exercises', value: `${summary.exerciseCount}`, unit: '' },
                { label: 'Sets', value: `${summary.setCount}`, unit: '' },
                {
                  label: 'Volume',
                  value: toDisplayWeight(summary.totalVolumeKg, weightUnit).toLocaleString(),
                  unit: weightUnit
                },
              ].map(({ label, value, unit }) => (
                <div key={label} className="bg-white/5 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-bold text-white tabular-nums">
                    {value}<span className="text-sm text-white/40 ml-1">{unit}</span>
                  </p>
                  <p className="text-xs text-white/30 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Top progression highlight */}
            {summary.topProgression?.previous && summary.topProgression?.current && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-green-500/10 border border-green-500/20 mb-5">
                <TrendingUp size={16} className="text-green-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-green-400">
                    {summary.topProgression.exerciseName}
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">
                    {toDisplayWeight(summary.topProgression.previous.weight, weightUnit)}{weightUnit} × {summary.topProgression.previous.reps}
                    {' → '}
                    {toDisplayWeight(summary.topProgression.current.weight, weightUnit)}{weightUnit} × {summary.topProgression.current.reps}
                  </p>
                </div>
              </div>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl bg-accent text-black font-bold text-base active:scale-95 transition-all"
            >
              Done
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
