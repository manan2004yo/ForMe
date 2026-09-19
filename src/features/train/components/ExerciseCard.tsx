import { useState } from 'react'
import { ChevronDown, ChevronUp, X, TrendingUp, History } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkoutSessionStore, type ActiveExercise } from '@/store/workoutSessionStore'
import { useUserStore, toDisplayWeight } from '@/store/userStore'
import { usePreviousPerformance } from '../hooks/usePreviousPerformance'
import { SetTable } from './SetTable'
import { ExerciseHistorySheet } from './ExerciseHistorySheet'
import clsx from 'clsx'


interface ExerciseCardProps {
  exercise: ActiveExercise
  index: number
  isActive?: boolean
  onClick?: () => void
}

export function ExerciseCard({ exercise, index, isActive, onClick }: ExerciseCardProps) {
  const { removeExercise, getExerciseVolume } = useWorkoutSessionStore()
  const { weightUnit } = useUserStore()
  const previousPerformance = usePreviousPerformance(exercise.exerciseId)
  const [expanded, setExpanded] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  const volume = getExerciseVolume(exercise.instanceId)
  const completedSets = exercise.sets.filter(s => s.isComplete).length

  // Progressive overload indicator
  const prevVolume = previousPerformance?.totalVolume ?? 0
  const volumeDelta = volume - prevVolume
  const showPRIndicator = volume > 0 && prevVolume > 0 && volumeDelta > 0

  return (
    <>
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={clsx(
        'card overflow-hidden transition-all cursor-pointer',
        isActive && 'ring-1 ring-accent/40 bg-accent/5'
      )}
      onClick={onClick}
    >
      {/* Card header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-xs font-bold text-white/30 w-5 shrink-0">{index + 1}</span>
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-sm leading-tight truncate">
              {exercise.exerciseName}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-white/40 capitalize">
                {exercise.primaryMuscle.replace('_', ' ')}
              </span>
              {completedSets > 0 && (
                <span className="text-[11px] text-white/40">
                  · {completedSets} set{completedSets !== 1 ? 's' : ''}
                  {volume > 0 && ` · ${toDisplayWeight(volume, weightUnit).toLocaleString()}${weightUnit}`}
                </span>
              )}
              {showPRIndicator && (
                <span className="flex items-center gap-0.5 text-[11px] text-green-400 font-semibold">
                  <TrendingUp size={10} />
                  +{toDisplayWeight(volumeDelta, weightUnit).toLocaleString()}{weightUnit}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowHistory(true)}
            className="p-2 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/5 transition-all"
            title="View exercise history"
          >
            <History size={15} />
          </button>
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={() => removeExercise(exercise.instanceId)}
            className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Previous performance banner */}
      <AnimatePresence>
        {expanded && previousPerformance && exercise.sets.length === 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-2"
          >
            <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/5">
              <p className="text-[11px] text-white/40 font-medium">
                Last session · {previousPerformance.sets.length} sets ·{' '}
                {toDisplayWeight(previousPerformance.totalVolume, weightUnit).toLocaleString()}{weightUnit} total
              </p>
              <div className="flex gap-2 mt-1 flex-wrap">
                {previousPerformance.sets.map((s, i) => (
                  <span key={i} className="text-[11px] text-white/60 tabular-nums">
                    {s.weight ? `${toDisplayWeight(s.weight, weightUnit)}${weightUnit}` : '—'} × {s.reps}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Set table */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4"
          >
            <SetTable
              exercise={exercise}
              previousPerformance={previousPerformance}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>

    <ExerciseHistorySheet
      isOpen={showHistory}
      onClose={() => setShowHistory(false)}
      exerciseId={exercise.exerciseId}
      exerciseName={exercise.exerciseName}
    />
  </>
  )
}
