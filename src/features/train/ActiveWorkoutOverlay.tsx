import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pause, Play } from 'lucide-react'
import { useWorkoutSessionStore } from '@/store/workoutSessionStore'
import { useUserStore } from '@/store/userStore'
import { ExerciseCard } from './components/ExerciseCard'
import { AddExerciseSheet } from './components/AddExerciseSheet'
import { EndWorkoutSheet } from './components/EndWorkoutSheet'
import { RestTimer } from './components/RestTimer'
import { SetCountPicker } from './components/SetCountPicker'
import { PostWorkoutSummary, type WorkoutSummaryData } from './components/PostWorkoutSummary'
import type { ExerciseEntry } from '@/lib/data/exerciseDatabase'
import { VYBEMicButton } from '@/components/vybe/VYBEMicButton'
import clsx from 'clsx'

function useElapsedTimer(isActive: boolean, isPaused: boolean) {
  const { getElapsedSeconds } = useWorkoutSessionStore()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!isActive || isPaused) return
    const id = setInterval(() => setElapsed(getElapsedSeconds()), 1000)
    return () => clearInterval(id)
  }, [isActive, isPaused])

  const m = Math.floor(elapsed / 60).toString().padStart(2, '0')
  const s = (elapsed % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function ActiveWorkoutOverlay() {
  const {
    session,
    isActive,
    pauseSession,
    resumeSession,
    currentExerciseIndex,
    setCurrentExerciseIndex,
    addExercise,
    addSet,
  } = useWorkoutSessionStore()

  const { weightUnit, toggleWeightUnit } = useUserStore()

  const [showAddExercise, setShowAddExercise] = useState(false)
  const [showEndWorkout, setShowEndWorkout] = useState(false)
  const [pendingExerciseForPicker, setPendingExerciseForPicker] = useState<ExerciseEntry | null>(null)
  const [workoutSummary, setWorkoutSummary] = useState<WorkoutSummaryData | null>(null)

  const isPaused = session?.pausedAt !== null && session?.pausedAt !== undefined
  const timer = useElapsedTimer(isActive, isPaused)

  const hasPrevious = session ? currentExerciseIndex > 0 : false
  const hasNext = session ? currentExerciseIndex < session.exercises.length - 1 : false

  return (
    <>
    <AnimatePresence>
      {isActive && session && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 32, stiffness: 280 }}
          className="fixed inset-0 z-50 bg-[#080808] flex flex-col"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-safe pt-4 pb-4 border-b border-white/5">
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">{session.label}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={clsx(
                  'text-sm font-mono tabular-nums',
                  isPaused ? 'text-white/30' : 'text-accent'
                )}>
                  {timer}
                </span>
                {isPaused && (
                  <span className="text-xs text-white/30 font-medium">Paused</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* KG / LB toggle */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/10">
                {(['kg', 'lb'] as const).map(unit => (
                  <button
                    key={unit}
                    onClick={() => unit !== weightUnit && toggleWeightUnit()}
                    className={clsx(
                      'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                      weightUnit === unit
                        ? 'bg-white text-black'
                        : 'text-white/40 hover:text-white'
                    )}
                  >
                    {unit.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Pause / Resume */}
              <button
                onClick={isPaused ? resumeSession : pauseSession}
                className="p-2.5 rounded-xl bg-white/5 text-white/50 hover:text-white transition-all"
              >
                {isPaused ? <Play size={16} /> : <Pause size={16} />}
              </button>

              {/* Minimise (future: mini player) */}
              <button
                onClick={() => setShowEndWorkout(true)}
                className="px-4 py-2 rounded-xl bg-accent text-black text-sm font-bold transition-all active:scale-95"
              >
                Finish
              </button>
            </div>
          </div>

          {/* Exercise list */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 relative">
            <AnimatePresence initial={false}>
              {session.exercises.map((exercise, index) => (
                <ExerciseCard
                  key={exercise.instanceId}
                  exercise={exercise}
                  index={index}
                  isActive={index === currentExerciseIndex}
                  onClick={() => setCurrentExerciseIndex(index)}
                />
              ))}
            </AnimatePresence>

            {session.exercises.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-white/20 text-sm font-medium">No exercises yet</p>
                <p className="text-white/10 text-xs mt-1">Tap below to add your first exercise</p>
              </div>
            )}
          </div>

          {/* Rest timer floating pill */}
          <RestTimer />

          {/* Footer */}
          <div className="px-4 py-3 border-t border-white/5">
            {session.exercises.length > 1 && (
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setCurrentExerciseIndex(currentExerciseIndex - 1)}
                  disabled={!hasPrevious}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-white/50 hover:text-white disabled:opacity-20 transition-all text-sm font-semibold active:scale-95"
                >
                  ← Previous
                </button>
                <span className="text-xs text-white/30 font-medium">
                  {currentExerciseIndex + 1} of {session.exercises.length}
                </span>
                <button
                  onClick={() => setCurrentExerciseIndex(currentExerciseIndex + 1)}
                  disabled={!hasNext}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-white/50 hover:text-white disabled:opacity-20 transition-all text-sm font-semibold active:scale-95"
                >
                  Next →
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddExercise(true)}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-all active:scale-95"
              >
                <Plus size={18} /> Add Exercise
              </button>
              <div className="flex items-center justify-center p-2 rounded-2xl bg-white/5">
                <VYBEMicButton context={{ workoutLabel: session.label }} />
              </div>
            </div>
          </div>

          {/* Sheets */}
          <AddExerciseSheet
            isOpen={showAddExercise}
            onClose={() => setShowAddExercise(false)}
            onSelect={(exercise) => {
              setShowAddExercise(false)
              setPendingExerciseForPicker(exercise)
            }}
          />
          <SetCountPicker
            exercise={pendingExerciseForPicker}
            onConfirm={(exercise, setCount) => {
              addExercise(exercise)
              const exercises = useWorkoutSessionStore.getState().session?.exercises
              const instanceId = exercises ? exercises[exercises.length - 1]?.instanceId : undefined
              if (instanceId) {
                for (let i = 0; i < setCount; i++) {
                  addSet(instanceId)
                }
              }
              setPendingExerciseForPicker(null)
            }}
            onClose={() => setPendingExerciseForPicker(null)}
          />
          <EndWorkoutSheet
            isOpen={showEndWorkout}
            onClose={() => setShowEndWorkout(false)}
            onFinish={(summary) => setWorkoutSummary(summary)}
          />
        </motion.div>
      )}
    </AnimatePresence>
    <PostWorkoutSummary
      summary={workoutSummary}
      onClose={() => setWorkoutSummary(null)}
    />
    </>
  )
}
