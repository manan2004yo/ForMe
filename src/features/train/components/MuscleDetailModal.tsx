import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Zap, CheckCircle, XCircle } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import {
  useMuscleRecoveryStore,
  MUSCLE_DISPLAY_NAMES,
  RECOVERY_COLORS,
  type MuscleRecoveryData,
} from '@/store/muscleRecoveryStore'
import { EXERCISE_DATABASE } from '@/lib/data/exerciseDatabase'
import type { MuscleGroup } from '@/types'

interface MuscleDetailModalProps {
  muscle: MuscleGroup | null
  onClose: () => void
}

function getExerciseRecommendations(muscle: MuscleGroup) {
  const avoid = EXERCISE_DATABASE.filter(e => e.primaryMuscle === muscle).slice(0, 4)
  const ok = EXERCISE_DATABASE
    .filter(e =>
      e.primaryMuscle !== muscle &&
      !e.secondaryMuscles.includes(muscle)
    )
    .slice(0, 4)
  return { avoid, ok }
}

function formatLastTrained(data: MuscleRecoveryData): string {
  if (!data.lastTrainedAt) return 'Never'
  return formatDistanceToNow(new Date(data.lastTrainedAt), { addSuffix: true })
}

function formatEstimatedReady(data: MuscleRecoveryData): string {
  if (!data.estimatedReadyAt) return '—'
  if (data.recoveryPercent >= 100) return 'Ready now'
  return format(new Date(data.estimatedReadyAt), 'EEE h:mm a')
}

function getDOMSLevel(data: MuscleRecoveryData): string {
  if (!data.hoursSinceTrained) return 'None'
  if (data.hoursSinceTrained < 12) return 'Mild'
  if (data.hoursSinceTrained < 36) return 'Moderate'
  if (data.hoursSinceTrained < 60) return 'Easing'
  return 'Cleared'
}

export function MuscleDetailModal({ muscle, onClose }: MuscleDetailModalProps) {
  const { getRecoveryData } = useMuscleRecoveryStore()

  const data: MuscleRecoveryData | null = muscle ? getRecoveryData(muscle) : null
  const { avoid, ok } = muscle ? getExerciseRecommendations(muscle) : { avoid: [], ok: [] }
  const color = data ? RECOVERY_COLORS[data.status] : '#374151'

  return createPortal(
    <AnimatePresence>
      {muscle && data && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[90] bg-[#0f0f0f] border-t border-white/10 rounded-t-3xl"
            style={{ maxHeight: '80vh', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="flex flex-col" style={{ maxHeight: '80vh' }}>
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                  />
                  <h2 className="text-xl font-bold text-white">
                    {MUSCLE_DISPLAY_NAMES[muscle]}
                  </h2>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                    style={{
                      color,
                      backgroundColor: `${color}20`,
                      border: `1px solid ${color}40`,
                    }}
                  >
                    {data.status}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-4">
                {/* Recovery progress bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-white/40 font-medium uppercase tracking-wider">Recovery</span>
                    <span className="text-sm font-bold" style={{ color }}>
                      {data.recoveryPercent}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${data.recoveryPercent}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={13} className="text-white/30" />
                      <span className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Last Trained</span>
                    </div>
                    <p className="text-sm font-semibold text-white">{formatLastTrained(data)}</p>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap size={13} className="text-white/30" />
                      <span className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Est. Ready</span>
                    </div>
                    <p className="text-sm font-semibold text-white">{formatEstimatedReady(data)}</p>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-4">
                    <span className="text-[10px] text-white/30 uppercase tracking-wider font-bold block mb-1">Last Volume</span>
                    <p className="text-sm font-semibold text-white">
                      {data.lastSessionVolume > 0
                        ? `${data.lastSessionVolume.toLocaleString()} kg`
                        : '—'}
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-4">
                    <span className="text-[10px] text-white/30 uppercase tracking-wider font-bold block mb-1">DOMS Level</span>
                    <p className="text-sm font-semibold text-white">{getDOMSLevel(data)}</p>
                  </div>
                </div>

                {/* Exercise recommendations */}
                {data.status !== 'untrained' && data.status !== 'fresh' && (
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle size={14} className="text-red-400" />
                        <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Avoid Today</span>
                      </div>
                      <div className="space-y-1">
                        {avoid.map(ex => (
                          <div
                            key={ex.id}
                            className="flex items-center justify-between px-3 py-2 rounded-xl bg-red-500/5 border border-red-500/10"
                          >
                            <span className="text-sm text-white/70">{ex.name}</span>
                            <span className="text-[10px] text-red-400/60 capitalize">{ex.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle size={14} className="text-green-400" />
                        <span className="text-xs font-bold text-green-400 uppercase tracking-wider">OK to Train</span>
                      </div>
                      <div className="space-y-1">
                        {ok.map(ex => (
                          <div
                            key={ex.id}
                            className="flex items-center justify-between px-3 py-2 rounded-xl bg-green-500/5 border border-green-500/10"
                          >
                            <span className="text-sm text-white/70">{ex.name}</span>
                            <span className="text-[10px] text-green-400/60 capitalize">{ex.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {data.status === 'fresh' && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-green-500/10 border border-green-500/20">
                    <CheckCircle size={18} className="text-green-400 shrink-0" />
                    <p className="text-sm text-green-300">
                      This muscle is fully recovered and ready for a full training stimulus.
                    </p>
                  </div>
                )}

                {data.status === 'untrained' && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-sm text-white/40">
                      No training data yet. Complete a workout targeting this muscle to see recovery status.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
