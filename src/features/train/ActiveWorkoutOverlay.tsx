// ============================================================
// FORME — Active Workout Page (/train/active)
// ============================================================
// This is NO LONGER a global overlay. It is a dedicated routed
// "Gym Mode" destination mounted inside AppShell.
// ============================================================

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Pause,
  Play,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useWorkoutSessionStore } from '@/store/workoutSessionStore'
import { useUserStore } from '@/store/userStore'
import { AddExerciseSheet } from './components/AddExerciseSheet'
import { RestTimer } from './components/RestTimer'
import { SetCountPicker } from './components/SetCountPicker'
import { ExerciseCard } from './components/ExerciseCard'
import type { ExerciseEntry } from '@/lib/data/exerciseDatabase'
import { VYBEMicButton } from '@/components/vybe/VYBEMicButton'
import clsx from 'clsx'

// ── Elapsed timer hook ───────────────────────────────────────
function useElapsedTimer(isActive: boolean, isPaused: boolean) {
  const { getElapsedSeconds } = useWorkoutSessionStore()
  const [elapsed, setElapsed] = useState(getElapsedSeconds())

  useEffect(() => {
    // Sync immediately when state changes
    setElapsed(getElapsedSeconds())
    if (!isActive || isPaused) return
    const id = setInterval(() => setElapsed(getElapsedSeconds()), 1000)
    return () => clearInterval(id)
  }, [isActive, isPaused, getElapsedSeconds])

  const m = Math.floor(elapsed / 60).toString().padStart(2, '0')
  const s = (elapsed % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// ── Exit confirmation overlay ────────────────────────────────
function ExitConfirmSheet({
  isOpen,
  onKeepTraining,
  onDiscard,
}: {
  isOpen: boolean
  onKeepTraining: () => void
  onDiscard: () => void
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onKeepTraining}
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[90] bg-[#111] border-t border-white/10 rounded-t-3xl p-6 pb-10"
          >
            <div className="flex justify-center mb-6">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <h2 className="text-xl font-bold text-white text-center mb-1">Exit workout?</h2>
            <p className="text-white/40 text-sm text-center mb-8">
              Your session will be discarded. This cannot be undone.
            </p>
            <button
              onClick={onDiscard}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-500/15 text-red-400 font-bold text-base mb-3 active:scale-95 transition-all border border-red-500/20"
            >
              <X size={18} /> Discard Session
            </button>
            <button
              onClick={onKeepTraining}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 text-white font-semibold text-base active:scale-95 transition-all"
            >
              Keep Training
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Main component ───────────────────────────────────────────
export function ActiveWorkoutOverlay() {
  const navigate = useNavigate()

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

  const { weightUnit, toggleWeightUnit } = useUserStore()

  const [showAddExercise, setShowAddExercise] = useState(false)
  const [pendingExerciseForPicker, setPendingExerciseForPicker] = useState<ExerciseEntry | null>(null)
  const [showUndoConfirmation, setShowUndoConfirmation] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const isPaused = session?.pausedAt !== null && session?.pausedAt !== undefined
  const timer = useElapsedTimer(isActive, isPaused)

  // If no active session, redirect back to /train
  useEffect(() => {
    if (!isActive || !session) {
      navigate('/train', { replace: true })
    }
  }, [isActive, session, navigate])

  if (!isActive || !session) {
    return null
  }

  const hasPrevious = currentExerciseIndex > 0
  const hasNext = currentExerciseIndex < session.exercises.length - 1
  const activeExercise = session.exercises[currentExerciseIndex] ?? null

  function handleUndo() {
    const undone = undoLastAction()
    if (!undone) return
    setShowUndoConfirmation(true)
    window.setTimeout(() => setShowUndoConfirmation(false), 1800)
  }

  function handleExit() {
    setShowExitConfirm(true)
  }

  function handleConfirmDiscard() {
    discardSession()
    navigate('/train', { replace: true })
  }

  function handleFinish() {
    // Navigate to review WITHOUT ending the session.
    // The review page owns the final save.
    navigate('/train/review')
  }

  // Handle slide directions
  const slideVariants = {
    initial: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    animate: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? 60 : -60, opacity: 0 })
  }
  const [[page, direction], setPage] = useState([currentExerciseIndex, 0])

  useEffect(() => {
    if (currentExerciseIndex > page) {
      setPage([currentExerciseIndex, 1])
    } else if (currentExerciseIndex < page) {
      setPage([currentExerciseIndex, -1])
    }
  }, [currentExerciseIndex, page])

  // ── Empty session state ────────────────────────────────────
  if (session.exercises.length === 0) {
    return (
      <div
        className="min-h-dvh flex flex-col bg-bg"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Header */}
        <header className="shrink-0 px-4 pt-4 pb-3 border-b border-white/5">
          <div className="flex items-center justify-between">
            <button
              onClick={handleExit}
              className="min-h-[44px] min-w-[44px] flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm font-semibold"
            >
              <ArrowLeft size={18} />
              Exit
            </button>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{timer}</p>
              <p className="text-base font-heading font-bold text-white truncate max-w-[160px]">{session.label}</p>
            </div>
            <div className="min-w-[60px]" />
          </div>
        </header>

        {/* Empty state */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center"
          >
            <div className="w-24 h-24 rounded-[32px] bg-accent/10 flex items-center justify-center mb-6">
              <Dumbbell size={44} className="text-accent" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-white mb-3 text-center">
              Add your first exercise
            </h2>
            <p className="text-sm text-white/50 text-center leading-relaxed mb-10 max-w-[280px]">
              Your session is running. Add an exercise to start logging sets.
            </p>
            <button
              onClick={() => setShowAddExercise(true)}
              className="w-full max-w-[320px] min-h-[60px] rounded-[20px] bg-accent text-black font-bold text-lg flex items-center justify-center gap-2 active:scale-[0.99] transition-all shadow-[0_0_20px_rgba(205,255,100,0.2)] mb-4"
            >
              <Plus size={24} />
              Add Exercise
            </button>
            <button
              onClick={handleExit}
              className="w-full max-w-[320px] min-h-[56px] rounded-[20px] bg-white/5 text-white/70 font-semibold text-base active:scale-[0.99] transition-all"
            >
              Cancel & Exit
            </button>
          </motion.div>
        </div>

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
              for (let i = 0; i < setCount; i++) addSet(instanceId)
            }
            setPendingExerciseForPicker(null)
          }}
          onClose={() => setPendingExerciseForPicker(null)}
        />
        <ExitConfirmSheet
          isOpen={showExitConfirm}
          onKeepTraining={() => setShowExitConfirm(false)}
          onDiscard={handleConfirmDiscard}
        />
      </div>
    )
  }

  // ── Active session with exercises ──────────────────────────
  return (
    <div
      className="min-h-dvh flex flex-col bg-bg"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* HEADER */}
      <header className="shrink-0 px-4 pt-4 pb-3 border-b border-white/5 bg-bg">
        {/* Row 1: Exit | Timer+Title | Unit Toggle */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <button
            onClick={handleExit}
            className="min-h-[44px] min-w-[44px] flex items-center gap-1 text-white/50 hover:text-white transition-colors text-xs font-bold uppercase tracking-[0.15em]"
          >
            <ArrowLeft size={16} />
            Exit
          </button>

          <div className="flex flex-col items-center min-w-0">
            <span className={clsx(
              'text-[10px] uppercase tracking-[0.2em] font-bold tabular-nums',
              isPaused ? 'text-amber-500' : 'text-accent'
            )}>
              {isPaused ? 'PAUSED' : timer}
            </span>
            <h1 className="text-base font-heading font-bold text-white truncate max-w-[160px] text-center">
              {session.label}
            </h1>
          </div>

          <div className="flex items-center gap-1.5">
            {/* KG/LB toggle */}
            <div className="flex items-center rounded-xl bg-white/8 border border-white/10 overflow-hidden">
              {(['kg', 'lb'] as const).map(unit => (
                <button
                  key={unit}
                  onClick={() => unit !== weightUnit && toggleWeightUnit()}
                  className={clsx(
                    'min-h-[36px] px-3 text-[11px] font-bold uppercase tracking-wider transition-all',
                    weightUnit === unit
                      ? 'bg-accent text-black'
                      : 'text-white/40 hover:text-white'
                  )}
                >
                  {unit.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Exercise nav + controls */}
        <div className="flex items-center justify-between gap-2">
          {/* Prev exercise */}
          <button
            onClick={() => setCurrentExerciseIndex(currentExerciseIndex - 1)}
            disabled={!hasPrevious}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-white/40 disabled:opacity-20 active:scale-95 transition-all rounded-xl hover:bg-white/5"
          >
            <ChevronLeft size={22} />
          </button>

          {/* Dot indicators + exercise label */}
          <div className="flex-1 flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              {session.exercises.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentExerciseIndex(idx)}
                  className={clsx(
                    'h-1.5 rounded-full transition-all duration-300',
                    idx === currentExerciseIndex ? 'w-6 bg-accent' : 'w-1.5 bg-white/20'
                  )}
                />
              ))}
            </div>
            <p className="text-[10px] text-white/35 font-semibold uppercase tracking-wider">
              Exercise {currentExerciseIndex + 1} of {session.exercises.length}
            </p>
          </div>

          {/* Next exercise */}
          <button
            onClick={() => setCurrentExerciseIndex(currentExerciseIndex + 1)}
            disabled={!hasNext}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-white/40 disabled:opacity-20 active:scale-95 transition-all rounded-xl hover:bg-white/5"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Row 3: Pause + Finish */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={isPaused ? resumeSession : pauseSession}
            className="min-h-[44px] px-4 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center gap-2 text-white/70 text-sm font-semibold active:scale-95 transition-all"
          >
            {isPaused ? <Play size={15} className="ml-0.5" /> : <Pause size={15} />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>

          <button
            onClick={handleFinish}
            className="flex-1 min-h-[44px] rounded-2xl bg-white text-black text-sm font-bold active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          >
            Finish
          </button>

          <button
            onClick={handleUndo}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl bg-white/8 border border-white/10 text-white/40 hover:text-white active:scale-95 transition-all"
            title="Undo last action"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </header>

      {/* MAIN EXERCISE WORKSPACE */}
      <main className="flex-1 relative min-h-0 overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          {activeExercise && (
            <motion.div
              key={activeExercise.instanceId}
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              className="absolute inset-0 overflow-y-auto"
            >
              <ExerciseCard
                exercise={activeExercise}
                index={currentExerciseIndex}
                isPaused={isPaused}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* BOTTOM ACTION AREA */}
      <footer className="shrink-0 px-4 pb-6 pt-3 bg-bg border-t border-white/5">
        <RestTimer />

        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={() => setShowAddExercise(true)}
            className="flex-1 min-h-[56px] rounded-2xl bg-white/8 border border-white/10 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Plus size={18} />
            Add Exercise
          </button>

          <div className="min-h-[56px] min-w-[56px] flex items-center justify-center rounded-2xl bg-white/8 border border-white/10">
            <VYBEMicButton context={{ workoutLabel: session.label }} />
          </div>
        </div>
      </footer>

      {/* Undo toast */}
      <AnimatePresence>
        {showUndoConfirmation && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            className="fixed left-1/2 bottom-32 z-[70] -translate-x-1/2 pointer-events-none"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#171717]/95 backdrop-blur-xl px-4 py-2.5 shadow-2xl">
              <RotateCcw size={14} className="text-accent" />
              <span className="text-sm font-semibold text-white">Last action undone</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Exercise Sheet */}
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
            for (let i = 0; i < setCount; i++) addSet(instanceId)
          }
          setPendingExerciseForPicker(null)
        }}
        onClose={() => setPendingExerciseForPicker(null)}
      />

      {/* Exit confirmation */}
      <ExitConfirmSheet
        isOpen={showExitConfirm}
        onKeepTraining={() => setShowExitConfirm(false)}
        onDiscard={handleConfirmDiscard}
      />
    </div>
  )
}
