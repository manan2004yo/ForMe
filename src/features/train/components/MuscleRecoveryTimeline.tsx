import { motion } from 'framer-motion'
import {
  useMuscleRecoveryStore,
  MUSCLE_DISPLAY_NAMES,
  RECOVERY_COLORS,
} from '@/store/muscleRecoveryStore'
import type { MuscleGroup } from '@/types'
import { formatDistanceToNow } from 'date-fns'


interface MuscleRecoveryTimelineProps {
  onMuscleClick: (muscle: MuscleGroup) => void
}

export function MuscleRecoveryTimeline({ onMuscleClick }: MuscleRecoveryTimelineProps) {
  const { getAllRecoveryData } = useMuscleRecoveryStore()

  const allData = getAllRecoveryData()

  const statusOrder = { fatigued: 0, recovering: 1, fresh: 2, untrained: 3 }
  const sorted = [...allData]
    .filter(d => d.status !== 'untrained')
    .sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status]
      if (statusDiff !== 0) return statusDiff
      return a.recoveryPercent - b.recoveryPercent
    })

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-white/20 text-sm">No training data yet</p>
        <p className="text-white/10 text-xs mt-1">Complete a workout to see recovery status</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sorted.map((data, index) => {
        const color = RECOVERY_COLORS[data.status]
        return (
          <motion.button
            key={data.muscle}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => onMuscleClick(data.muscle)}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl bg-white/3 hover:bg-white/6 active:scale-[0.99] transition-all text-left"
          >
            {/* Status dot */}
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
            />

            {/* Muscle name + progress */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-white">
                  {MUSCLE_DISPLAY_NAMES[data.muscle]}
                </span>
                <span className="text-xs font-bold tabular-nums" style={{ color }}>
                  {data.recoveryPercent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${data.recoveryPercent}%` }}
                  transition={{ duration: 0.8, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                />
              </div>

              {data.lastTrainedAt && (
                <p className="text-[11px] text-white/30 mt-1">
                  {formatDistanceToNow(new Date(data.lastTrainedAt), { addSuffix: true })}
                  {data.wasPrimary ? ' · Primary' : ' · Secondary'}
                </p>
              )}
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
