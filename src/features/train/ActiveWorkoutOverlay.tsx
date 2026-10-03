import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Maximize2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react'
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
    undoLastAction,
  } = useWorkoutSessionStore()

  const { weightUnit, toggleWeightUnit } = useUserStore()

  const [showAddExercise, setShowAddExercise] = useState(false)
  const [showEndWorkout, setShowEndWorkout] = useState(false)
  const [pendingExerciseForPicker, setPendingExerciseForPicker] = useState<ExerciseEntry | null>(null)
  const [workoutSummary, setWorkoutSummary] = useState<WorkoutSummaryData | null>(null)
  const [showUndoConfirmation, setShowUndoConfirmation] = useState(false)

  const isPaused = session?.pausedAt !== null && session?.pausedAt !== undefined
  const timer = useElapsedTimer(isActive, isPaused)

  const hasPrevious = session ? currentExerciseIndex > 0 : false
  const hasNext = session ? currentExerciseIndex < session.exercises.length - 1 : false
  const activeExercise = session?.exercises[currentExerciseIndex] ?? null
  const completedSets = session?.exercises.reduce(
    (total, exercise) => total + exercise.sets.filter(set => set.isComplete).length,
    0
  ) ?? 0
  const totalSets = session?.exercises.reduce(
    (total, exercise) => total + exercise.sets.length,
    0
  ) ?? 0

  function handleUndo() {
    const undone = undoLastAction()
    if (!undone) return

    setShowUndoConfirmation(true)

    window.setTimeout(() => {
      setShowUndoConfirmation(false)
    }, 1800)
  }

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
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {/* Compact workout header */}
            <header className="shrink-0 px-4 pt-3 pb-3 border-b border-white/5 bg-[#080808]/95 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-accent/60 font-bold">
                    ACTIVE SESSION
                  </p>
                  <h1 className="text-lg font-heading font-bold text-white truncate mt-0.5">
                    {session.label}
                  </h1>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowEndWorkout(true)}
                    aria-label="Finish workout"
                    className="min-h-11 px-4 rounded-xl bg-accent text-black text-sm font-bold active:scale-95 transition-all"
                  >
                    Finish
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 mt-3">
                <div className="flex items-center gap-3">
                  <span className={clsx(
                    'text-sm font-mono font-bold tabular-nums',
                    isPaused ? 'text-white/30' : 'text-accent'
                  )}>
                    {timer}
                  </span>

                  <span className="text-xs text-white/30">
                    {completedSets}/{totalSets || 0} sets
                  </span>

                  {isPaused && (
                    <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400">
                      Paused
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/5">
                    {(['kg', 'lb'] as const).map(unit => (
                      <button
                        key={unit}
                        onClick={() => unit !== weightUnit && toggleWeightUnit()}
                        className={clsx(
                          'min-h-9 min-w-10 px-2 rounded-lg text-[11px] font-bold transition-all',
                          weightUnit === unit
                            ? 'bg-white text-black'
                            : 'text-white/35'
                        )}
                      >
                        {unit.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleUndo}
                    aria-label="Undo last workout action"
                    title="Undo last workout action"
                    className="min-h-11 min-w-11 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-white/60 active:scale-95 transition-all"
                  >
                    <RotateCcw size={17} />
                  </button>

                  <button
                    onClick={isPaused ? resumeSession : pauseSession}
                    aria-label={isPaused ? 'Resume workout' : 'Pause workout'}
                    className="min-h-11 min-w-11 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-white/60 active:scale-95 transition-all"
                  >
                    {isPaused ? <Play size={17} /> : <Pause size={17} />}
                  </button>
                </div>
              </div>
            </header>

            {/* Session body */}
            <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3">
              {session.exercises.length === 0 ? (
                <div className="min-h-full flex items-center justify-center px-5">
                  <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.03] p-7 text-center">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                      <Dumbbell size={26} className="text-accent" />
                    </div>
                    <h2 className="text-lg font-heading font-bold text-white">
                      Start your session
                    </h2>
                    <p className="text-sm text-white/40 mt-2 leading-relaxed">
                      Add your first exercise. Your active session will persist if you lock your phone or leave the app.
                    </p>
                    <button
                      onClick={() => setShowAddExercise(true)}
                      className="w-full min-h-12 mt-6 rounded-2xl bg-accent text-black font-bold text-base flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
                    >
                      <Plus size={19} />
                      Add first exercise
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-1 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-white/30 font-bold">
                        Exercise
                      </span>
                      <span className="text-xs text-white/25">
                        {currentExerciseIndex + 1} / {session.exercises.length}
                      </span>
                    </div>

                    {activeExercise && (
                      <span className="text-xs text-white/30 truncate max-w-[48%]">
                        {activeExercise.exerciseName}
                      </span>
                    )}
                  </div>

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
                </>
              )}
            </main>

            {/* Existing real rest timer */}
            <RestTimer />

            {/* Bottom session controls */}
            <footer className="shrink-0 px-3 pt-2 pb-3 border-t border-white/5 bg-[#080808]/98 backdrop-blur-xl">
              {session.exercises.length > 1 && (
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setCurrentExerciseIndex(currentExerciseIndex - 1)}
                    disabled={!hasPrevious}
                    aria-label="Previous exercise"
                    className="min-h-11 min-w-11 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-white/50 disabled:opacity-20 active:scale-95 transition-all"
                  >
                    <ChevronLeft size={19} />
                  </button>

                  <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full bg-accent rounded-full"
                      animate={{
                        width: `${((currentExerciseIndex + 1) / session.exercises.length) * 100}%`,
                      }}
                    />
                  </div>

                  <button
                    onClick={() => setCurrentExerciseIndex(currentExerciseIndex + 1)}
                    disabled={!hasNext}
                    aria-label="Next exercise"
                    className="min-h-11 min-w-11 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-white/50 disabled:opacity-20 active:scale-95 transition-all"
                  >
                    <ChevronRight size={19} />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                <button
                  onClick={() => setShowAddExercise(true)}
                  className="flex-1 min-h-12 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
                >
                  <Plus size={18} />
                  Add Exercise
                </button>

                <button
                  onClick={handleUndo}
                  className="min-h-12 min-w-12 px-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 active:scale-[0.99] transition-all"
                  aria-label="Undo last workout action"
                  title="Undo last workout action"
                >
                  <RotateCcw size={18} />
                </button>

                <button
                  onClick={() => setShowEndWorkout(true)}
                  className="min-h-12 px-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 active:scale-[0.99] transition-all"
                  aria-label="Finish workout"
                >
                  <X size={18} />
                </button>

                <div className="min-h-12 min-w-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                  <VYBEMicButton context={{ workoutLabel: session.label }} />
                </div>
              </div>
            </footer>

            {/* Existing exercise picker flow */}
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
                const instanceId = exercises
                  ? exercises[exercises.length - 1]?.instanceId
                  : undefined

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

      <AnimatePresence>
        {showUndoConfirmation && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            className="fixed left-1/2 bottom-28 z-[70] -translate-x-1/2"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#171717]/95 backdrop-blur-xl px-4 py-2.5 shadow-2xl">
              <RotateCcw size={15} className="text-accent" />
              <span className="text-sm font-semibold text-white">
                Last action undone
              </span>
            </div>
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
