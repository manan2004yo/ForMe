import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Pause,
  Play,
  Plus,
  RotateCcw,
} from 'lucide-react'
import { useWorkoutSessionStore } from '@/store/workoutSessionStore'
import { AddExerciseSheet } from './components/AddExerciseSheet'
import { EndWorkoutSheet } from './components/EndWorkoutSheet'
import { RestTimer } from './components/RestTimer'
import { SetCountPicker } from './components/SetCountPicker'
import { PostWorkoutSummary, type WorkoutSummaryData } from './components/PostWorkoutSummary'
import { ExerciseCard } from './components/ExerciseCard'
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
  }, [isActive, isPaused, getElapsedSeconds])

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
    discardSession,
  } = useWorkoutSessionStore()

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

  function handleUndo() {
    const undone = undoLastAction()
    if (!undone) return

    setShowUndoConfirmation(true)
    window.setTimeout(() => {
      setShowUndoConfirmation(false)
    }, 1800)
  }

  // Handle slide directions
  const slideVariants = {
    initial: (dir: number) => ({ x: dir > 0 ? 100 : -100, opacity: 0, scale: 0.95 }),
    animate: { x: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? 100 : -100, opacity: 0, scale: 0.95 })
  }
  const [[page, direction], setPage] = useState([currentExerciseIndex, 0])
  
  useEffect(() => {
    if (currentExerciseIndex > page) {
      setPage([currentExerciseIndex, 1])
    } else if (currentExerciseIndex < page) {
      setPage([currentExerciseIndex, -1])
    }
  }, [currentExerciseIndex, page])

  return (
    <>
      <AnimatePresence>
        {isActive && session && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 280 }}
            className="fixed inset-0 z-50 bg-background flex flex-col"
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {/* NEW GYM MODE HEADER */}
            <header className="shrink-0 px-5 py-4 border-b border-white/5 bg-background">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      onClick={() => discardSession()}
                      className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <ChevronLeft size={12} />
                      Exit
                    </button>
                    <span className="text-[10px] text-white/20">|</span>
                    <span className={clsx(
                      'text-[10px] uppercase tracking-[0.2em] font-bold tabular-nums',
                      isPaused ? 'text-amber-500' : 'text-accent'
                    )}>
                      {isPaused ? 'PAUSED' : timer}
                    </span>
                  </div>
                  <h1 className="text-xl font-heading font-bold text-white truncate max-w-[200px]">
                    {session.label}
                  </h1>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={isPaused ? resumeSession : pauseSession}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70 active:scale-95 transition-all"
                  >
                    {isPaused ? <Play size={16} className="ml-1" /> : <Pause size={16} />}
                  </button>
                  <button
                    onClick={() => setShowEndWorkout(true)}
                    className="min-h-10 px-4 rounded-full bg-white text-black text-sm font-bold active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                  >
                    Finish
                  </button>
                </div>
              </div>

              {session.exercises.length > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6 mb-2">
                  <button
                    onClick={() => setCurrentExerciseIndex(currentExerciseIndex - 1)}
                    disabled={!hasPrevious}
                    className="p-2 text-white/30 disabled:opacity-20 active:scale-95 transition-all"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  
                  <div className="flex items-center gap-1.5">
                    {session.exercises.map((_, idx) => (
                      <div 
                        key={idx}
                        className={clsx(
                          "h-1.5 rounded-full transition-all duration-300",
                          idx === currentExerciseIndex ? "w-6 bg-accent" : "w-1.5 bg-white/20"
                        )}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentExerciseIndex(currentExerciseIndex + 1)}
                    disabled={!hasNext}
                    className="p-2 text-white/30 disabled:opacity-20 active:scale-95 transition-all"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              )}
            </header>

            {/* MAIN GYM MODE WORKSPACE */}
            <main className="flex-1 flex flex-col min-h-0 relative bg-background">
              {session.exercises.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
                  <div className="w-20 h-20 rounded-[32px] bg-accent/10 flex items-center justify-center mb-6">
                    <Dumbbell size={40} className="text-accent" />
                  </div>
                  <h2 className="text-3xl font-heading font-bold text-white mb-3 text-center">
                    Start your session
                  </h2>
                  <p className="text-base text-white/50 text-center leading-relaxed mb-10 max-w-[280px]">
                    Your active session is running. Add your first exercise to begin logging sets.
                  </p>
                  <button
                    onClick={() => setShowAddExercise(true)}
                    className="w-full max-w-[320px] min-h-[60px] rounded-[20px] bg-accent text-black font-bold text-lg flex items-center justify-center gap-2 active:scale-[0.99] transition-all shadow-[0_0_20px_rgba(205,255,100,0.2)]"
                  >
                    <Plus size={24} />
                    Add Exercise
                  </button>
                  <button
                    onClick={() => discardSession()}
                    className="w-full max-w-[320px] min-h-[60px] mt-4 rounded-[20px] bg-white/5 text-white/70 font-semibold text-base active:scale-[0.99] transition-all"
                  >
                    Cancel & Exit
                  </button>
                </div>
              ) : activeExercise ? (
                <AnimatePresence initial={false} custom={direction} mode="wait">
                  <motion.div 
                    key={activeExercise.instanceId}
                    custom={direction}
                    variants={slideVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="absolute inset-0 flex flex-col min-h-0"
                  >
                    <ExerciseCard 
                      exercise={activeExercise} 
                      index={currentExerciseIndex} 
                      isPaused={isPaused} 
                    />
                  </motion.div>
                </AnimatePresence>
              ) : null}
            </main>

            {/* DELIBERATE BOTTOM ACTIONS */}
            {session.exercises.length > 0 && (
              <footer className="shrink-0 px-4 pb-6 pt-3 bg-[#121212] z-20">
                <RestTimer />
                
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={() => setShowAddExercise(true)}
                    className="flex-1 min-h-[56px] rounded-2xl bg-white/10 text-white font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Plus size={20} />
                    Add Exercise
                  </button>

                  <div className="min-h-[56px] min-w-[56px] flex items-center justify-center rounded-2xl bg-white/10">
                    <VYBEMicButton context={{ workoutLabel: session.label }} />
                  </div>
                </div>
              </footer>
            )}

            {/* Existing Flows */}
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
