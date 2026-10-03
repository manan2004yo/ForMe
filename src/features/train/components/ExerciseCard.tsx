import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Dumbbell, History, Minus, Plus, TrendingUp, X } from 'lucide-react'
import { useWorkoutSessionStore, type ActiveExercise } from '@/store/workoutSessionStore'
import { useUserStore, toDisplayWeight } from '@/store/userStore'
import { usePreviousPerformance } from '../hooks/usePreviousPerformance'
import { ExerciseHistorySheet } from './ExerciseHistorySheet'
import { MuscleExerciseVisual } from '../MuscleExerciseVisual'
import clsx from 'clsx'

interface ExerciseCardProps {
  exercise: ActiveExercise
  index: number
  isActive?: boolean // kept for signature compatibility
  onClick?: () => void
  isPaused?: boolean
}

export function ExerciseCard({ exercise, index, isPaused }: ExerciseCardProps) {
  const { removeExercise, getExerciseVolume, addSet, updateSet, completeSet, deleteSet } = useWorkoutSessionStore()
  const { weightUnit } = useUserStore()
  const previousPerformance = usePreviousPerformance(exercise.exerciseId)
  const [showHistory, setShowHistory] = useState(false)

  const volume = getExerciseVolume(exercise.instanceId)
  const completedSets = exercise.sets.filter(s => s.isComplete).length

  // Progressive overload indicator
  const prevVolume = previousPerformance?.totalVolume ?? 0
  const volumeDelta = volume - prevVolume
  const showPRIndicator = volume > 0 && prevVolume > 0 && volumeDelta > 0

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full max-w-lg mx-auto">
      {/* 1. HERO VISUAL AREA */}
      <div className="relative pt-6 pb-4 px-4 shrink-0 flex flex-col items-center">
        <div className="w-full max-w-sm aspect-square max-h-[30vh] flex items-center justify-center relative">
          <div className="absolute inset-0 bg-accent/5 rounded-full blur-3xl" />
          <MuscleExerciseVisual
            canonicalId={exercise.exerciseId}
            exerciseName={exercise.exerciseName}
            isAnimating={!isPaused}
            className="w-full h-full object-contain relative z-10"
          />
        </div>
        
        <div className="mt-4 flex flex-col items-center w-full relative">
          <h2 className="text-2xl font-heading font-bold text-white leading-tight text-center px-8">
            {exercise.exerciseName}
          </h2>
          <p className="text-xs text-accent uppercase tracking-[0.2em] mt-1.5 font-bold">
            {exercise.primaryMuscle.replace('_', ' ')}
          </p>

          <div className="absolute right-0 top-0 flex gap-1">
            <button
              onClick={() => setShowHistory(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all active:scale-95"
            >
              <History size={16} />
            </button>
            <button
              onClick={() => removeExercise(exercise.instanceId)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white/50 hover:bg-red-500/20 hover:text-red-400 transition-all active:scale-95"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. SET LOGGING AREA */}
      <div className="flex-1 bg-[#121212] rounded-t-[32px] border-t border-white/5 px-4 pt-6 pb-32 overflow-y-auto overscroll-contain hide-scrollbar">
        
        {/* Previous Performance & Volume Stats */}
        <div className="flex flex-col gap-3 mb-6">
          {previousPerformance && (
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col">
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                Previous Performance
              </div>
              <div className="flex flex-wrap gap-2">
                {previousPerformance.sets.map((s, i) => (
                  <div key={i} className="px-2 py-1 bg-white/5 rounded-lg text-xs font-semibold text-white/70 tabular-nums">
                    {s.weight ? `${toDisplayWeight(s.weight, weightUnit)}${weightUnit}` : '—'} × {s.reps}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between px-2">
            <div className="text-xs font-semibold text-white/50">
              {completedSets} / {exercise.sets.length} sets completed
            </div>
            {showPRIndicator && (
              <div className="flex items-center gap-1 text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-lg">
                <TrendingUp size={12} />
                +{toDisplayWeight(volumeDelta, weightUnit).toLocaleString()}{weightUnit} Vol PR
              </div>
            )}
          </div>
        </div>

        {/* Set Rows */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center px-4 mb-1">
            <div className="w-8 text-[10px] font-bold text-white/30 uppercase tracking-wider text-center">Set</div>
            <div className="flex-1 text-[10px] font-bold text-white/30 uppercase tracking-wider text-center">Weight ({weightUnit})</div>
            <div className="flex-1 text-[10px] font-bold text-white/30 uppercase tracking-wider text-center">Reps</div>
            <div className="w-12 text-[10px] font-bold text-white/30 uppercase tracking-wider text-center">Done</div>
          </div>

          <AnimatePresence initial={false}>
            {exercise.sets.map((set, i) => {
              const isCurrent = i === completedSets
              const isDone = set.isComplete

              return (
                <motion.div
                  key={set.setId}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={clsx(
                    "flex items-center gap-2 p-3 rounded-2xl border transition-all",
                    isDone 
                      ? "bg-accent/5 border-accent/20" 
                      : isCurrent 
                        ? "bg-white/10 border-white/20 shadow-lg" 
                        : "bg-white/5 border-transparent opacity-60"
                  )}
                >
                  <div className={clsx(
                    "w-8 text-center font-bold text-sm",
                    isDone ? "text-accent" : isCurrent ? "text-white" : "text-white/40"
                  )}>
                    {i + 1}
                  </div>

                  {/* Weight Control */}
                  <div className="flex-1 flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => updateSet(exercise.instanceId, set.setId, { weightKg: Math.max(0, (set.weightKg || 0) - 2.5) })}
                      disabled={isDone}
                      className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center active:scale-95 disabled:opacity-50"
                    >
                      <Minus size={14} className="text-white/70" />
                    </button>
                    <div className="w-16">
                      <input
                        type="number"
                        value={set.weightKg || ''}
                        onChange={e => updateSet(exercise.instanceId, set.setId, { weightKg: parseFloat(e.target.value) || 0 })}
                        placeholder="--"
                        disabled={isDone}
                        className={clsx(
                          "w-full text-center font-bold bg-transparent outline-none p-0 tabular-nums",
                          isCurrent ? "text-xl text-white" : "text-lg text-white/80"
                        )}
                        step="2.5"
                      />
                    </div>
                    <button
                      onClick={() => updateSet(exercise.instanceId, set.setId, { weightKg: (set.weightKg || 0) + 2.5 })}
                      disabled={isDone}
                      className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center active:scale-95 disabled:opacity-50"
                    >
                      <Plus size={14} className="text-white/70" />
                    </button>
                  </div>

                  {/* Reps Control */}
                  <div className="flex-1 flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => updateSet(exercise.instanceId, set.setId, { reps: Math.max(1, (set.reps || 0) - 1) })}
                      disabled={isDone}
                      className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center active:scale-95 disabled:opacity-50"
                    >
                      <Minus size={14} className="text-white/70" />
                    </button>
                    <div className="w-12 text-center">
                      <input
                        type="number"
                        value={set.reps || ''}
                        onChange={e => updateSet(exercise.instanceId, set.setId, { reps: parseInt(e.target.value) || 0 })}
                        disabled={isDone}
                        className={clsx(
                          "w-full text-center font-bold bg-transparent outline-none p-0 tabular-nums",
                          isCurrent ? "text-xl text-white" : "text-lg text-white/80"
                        )}
                      />
                    </div>
                    <button
                      onClick={() => updateSet(exercise.instanceId, set.setId, { reps: (set.reps || 0) + 1 })}
                      disabled={isDone}
                      className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center active:scale-95 disabled:opacity-50"
                    >
                      <Plus size={14} className="text-white/70" />
                    </button>
                  </div>

                  {/* Complete Button */}
                  <button
                    onClick={() => {
                        if (!isDone) {
                            completeSet(exercise.instanceId, set.setId)
                        }
                    }}
                    disabled={isDone}
                    className={clsx(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0",
                      isDone 
                        ? "bg-accent text-black shadow-[0_0_15px_rgba(205,255,100,0.3)] cursor-default" 
                        : isCurrent
                          ? "bg-white/20 text-white active:scale-95"
                          : "bg-white/10 text-white/30 active:scale-95"
                    )}
                  >
                    <Check size={20} strokeWidth={isDone ? 3 : 2} />
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
          
          <button
            onClick={() => addSet(exercise.instanceId)}
            className="w-full mt-2 min-h-[52px] rounded-2xl bg-white/5 text-white/70 font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/10 active:scale-[0.99] transition-all"
          >
            <Plus size={18} />
            Add Set
          </button>
        </div>
      </div>

      <ExerciseHistorySheet
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        exerciseId={exercise.exerciseId}
        exerciseName={exercise.exerciseName}
      />
    </div>
  )
}
