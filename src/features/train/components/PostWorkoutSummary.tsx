// ============================================================
// FORME — Post Workout Summary
// ============================================================
// Shown after endSession() completes successfully.
// Displays duration, sets, volume, and top progression highlight.
// ============================================================

import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  BatteryMedium,
  CheckCircle2,
  Dumbbell,
  Flame,
  Trophy,
  TrendingUp,
  X,
} from 'lucide-react'
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
  personalRecords: Array<{
    exerciseName: string
    recordType: 'weight' | 'volume'
    currentWeightKg: number | null
    currentReps: number | null
    currentVolumeKg: number
    previousBestWeightKg: number | null
    previousBestVolumeKg: number | null
  }>
  musclesTrained: string[]
  recoveryImpact: {
    fatigued: string[]
    recovering: string[]
    fresh: string[]
  }
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

            {/* Personal records */}
            {summary.personalRecords.length > 0 && (
              <section className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy size={16} className="text-accent" />
                  <h3 className="text-sm font-bold text-white">
                    Personal records
                  </h3>
                </div>

                <div className="space-y-2">
                  {summary.personalRecords.slice(0, 4).map((record, index) => (
                    <div
                      key={`${record.exerciseName}-${record.recordType}-${index}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-accent/10 border border-accent/15"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {record.exerciseName}
                        </p>
                        <p className="text-[11px] text-white/35 mt-0.5">
                          {record.recordType === 'weight'
                            ? 'Heaviest completed set'
                            : 'Highest exercise volume'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        {record.recordType === 'weight' ? (
                          <p className="text-sm font-bold text-accent tabular-nums">
                            {record.currentWeightKg === null
                              ? '—'
                              : `${toDisplayWeight(record.currentWeightKg, weightUnit)}${weightUnit}`}
                            {record.currentReps !== null && ` × ${record.currentReps}`}
                          </p>
                        ) : (
                          <p className="text-sm font-bold text-accent tabular-nums">
                            {toDisplayWeight(record.currentVolumeKg, weightUnit).toLocaleString()}{weightUnit}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Muscles trained */}
            {summary.musclesTrained.length > 0 && (
              <section className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Dumbbell size={16} className="text-white/60" />
                  <h3 className="text-sm font-bold text-white">
                    Muscles trained
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  {summary.musclesTrained.map(muscle => (
                    <span
                      key={muscle}
                      className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white/65"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Recovery impact */}
            {(summary.recoveryImpact.fatigued.length > 0 ||
              summary.recoveryImpact.recovering.length > 0 ||
              summary.recoveryImpact.fresh.length > 0) && (
              <section className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <BatteryMedium size={16} className="text-white/60" />
                  <h3 className="text-sm font-bold text-white">
                    Recovery impact
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {summary.recoveryImpact.fatigued.length > 0 && (
                    <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/15">
                      <Flame size={16} className="text-red-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-red-400">Fatigued</p>
                        <p className="text-xs text-white/40 mt-0.5">
                          {summary.recoveryImpact.fatigued.join(', ')}
                        </p>
                      </div>
                    </div>
                  )}

                  {summary.recoveryImpact.recovering.length > 0 && (
                    <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-orange-500/10 border border-orange-500/15">
                      <Activity size={16} className="text-orange-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-orange-400">Recovering</p>
                        <p className="text-xs text-white/40 mt-0.5">
                          {summary.recoveryImpact.recovering.join(', ')}
                        </p>
                      </div>
                    </div>
                  )}

                  {summary.recoveryImpact.fresh.length > 0 && (
                    <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/15">
                      <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-emerald-400">Fresh</p>
                        <p className="text-xs text-white/40 mt-0.5">
                          {summary.recoveryImpact.fresh.join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
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
