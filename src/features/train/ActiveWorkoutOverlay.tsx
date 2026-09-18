import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pause, Play, ChevronDown } from 'lucide-react'
import { useWorkoutSessionStore } from '@/store/workoutSessionStore'
import { useUserStore, toDisplayWeight } from '@/store/userStore'
import { ExerciseCard } from './components/ExerciseCard'
import { AddExerciseSheet } from './components/AddExerciseSheet'
import { EndWorkoutSheet } from './components/EndWorkoutSheet'
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
  } = useWorkoutSessionStore()

  const { weightUnit, toggleWeightUnit } = useUserStore()

  const [showAddExercise, setShowAddExercise] = useState(false)
  const [showEndWorkout, setShowEndWorkout] = useState(false)

  const isPaused = session?.pausedAt !== null && session?.pausedAt !== undefined
  const timer = useElapsedTimer(isActive, isPaused)

  return (
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
              <button
                onClick={toggleWeightUnit}
                className="px-3 py-1.5 rounded-lg bg-white/5 text-white/50 hover:text-white text-xs font-bold tracking-wider transition-all"
              >
                {weightUnit.toUpperCase()}
              </button>

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
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            <AnimatePresence initial={false}>
              {session.exercises.map((exercise, index) => (
                <ExerciseCard
                  key={exercise.instanceId}
                  exercise={exercise}
                  index={index}
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

          {/* Footer */}
          <div className="px-4 py-3 border-t border-white/5">
            <button
              onClick={() => setShowAddExercise(true)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-all active:scale-95"
            >
              <Plus size={18} /> Add Exercise
            </button>
          </div>

          {/* Sheets */}
          <AddExerciseSheet
            isOpen={showAddExercise}
            onClose={() => setShowAddExercise(false)}
          />
          <EndWorkoutSheet
            isOpen={showEndWorkout}
            onClose={() => setShowEndWorkout(false)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
