// ============================================================
// FORME — Workout Review Page (/train/review)
// ============================================================
// This is NO LONGER a modal. It is a full-page routed destination
// that owns the final Save / Discard / Done flow.
// ============================================================

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  ArrowLeft,
  BatteryMedium,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Flame,
  Loader2,
  Timer,
  Trophy,
  Trash2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useWorkoutSessionStore } from '@/store/workoutSessionStore'
import { useUserStore, toDisplayWeight } from '@/store/userStore'
import { useWorkoutFinish } from './EndWorkoutSheet'

// ── WorkoutSummaryData type (exported for EndWorkoutSheet too) ─
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

// ── Exercise summary row ──────────────────────────────────────
function ExerciseSummaryRow({
  exerciseName,
  totalSets,
  completedSets,
  sets,
}: {
  exerciseName: string
  totalSets: number
  completedSets: number
  sets: { setNumber: number; weightKg?: number; reps?: number; isComplete: boolean }[]
}) {
  const [expanded, setExpanded] = useState(false)
  const { weightUnit } = useUserStore()
  const allDone = completedSets === totalSets

  return (
    <div className="rounded-2xl bg-white/5 border border-white/8 overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left active:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${allDone ? 'bg-accent' : 'bg-white/10'}`}>
            {allDone && <CheckCircle2 size={12} className="text-black" />}
          </div>
          <p className="text-sm font-semibold text-white truncate">{exerciseName}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-bold tabular-nums ${allDone ? 'text-accent' : 'text-white/40'}`}>
            {completedSets}/{totalSets} sets
          </span>
          {expanded ? (
            <ChevronUp size={15} className="text-white/30" />
          ) : (
            <ChevronDown size={15} className="text-white/30" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="px-4 py-3 space-y-1.5">
              {sets.map(set => (
                <div
                  key={set.setNumber}
                  className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl ${set.isComplete ? 'bg-accent/8 border border-accent/15' : 'bg-white/3 border border-white/5'}`}
                >
                  <span className={`font-semibold ${set.isComplete ? 'text-accent' : 'text-white/30'}`}>
                    Set {set.setNumber}
                  </span>
                  {set.isComplete && set.weightKg !== undefined && set.reps !== undefined ? (
                    <span className="text-white/70 tabular-nums font-medium">
                      {toDisplayWeight(set.weightKg, weightUnit)} {weightUnit} × {set.reps}
                    </span>
                  ) : (
                    <span className="text-white/25 italic">Not completed</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Completed summary (post-save state) ───────────────────────
function CompletedSummary({
  summary,
  onDone,
}: {
  summary: WorkoutSummaryData
  onDone: () => void
}) {
  const { weightUnit } = useUserStore()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* Completion badge */}
      <div className="flex flex-col items-center py-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 20 }}
          className="w-20 h-20 rounded-[28px] bg-accent/15 border border-accent/30 flex items-center justify-center mb-4"
        >
          <Trophy size={36} className="text-accent" />
        </motion.div>
        <p className="text-xs text-white/40 font-bold uppercase tracking-widest mb-1">Saved</p>
        <h2 className="text-2xl font-heading font-bold text-white text-center">{summary.label}</h2>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Duration', value: `${summary.durationMin}`, unit: 'min', icon: <Timer size={16} className="text-accent/70" /> },
          { label: 'Exercises', value: `${summary.exerciseCount}`, unit: '', icon: <Dumbbell size={16} className="text-accent/70" /> },
          { label: 'Sets', value: `${summary.setCount}`, unit: '', icon: <CheckCircle2 size={16} className="text-accent/70" /> },
          {
            label: 'Volume',
            value: toDisplayWeight(summary.totalVolumeKg, weightUnit).toLocaleString(),
            unit: weightUnit,
            icon: <Activity size={16} className="text-accent/70" />
          },
        ].map(({ label, value, unit, icon }) => (
          <div key={label} className="bg-white/5 border border-white/8 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-white/35 font-semibold uppercase tracking-wide">{label}</span></div>
            <p className="text-2xl font-bold text-white tabular-nums">
              {value}<span className="text-sm text-white/35 ml-1">{unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Personal Records */}
      {summary.personalRecords.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={15} className="text-accent" />
            <h3 className="text-sm font-bold text-white">Personal Records</h3>
          </div>
          <div className="space-y-2">
            {summary.personalRecords.slice(0, 4).map((record, index) => (
              <div
                key={`${record.exerciseName}-${record.recordType}-${index}`}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-accent/8 border border-accent/15"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{record.exerciseName}</p>
                  <p className="text-[11px] text-white/35 mt-0.5">
                    {record.recordType === 'weight' ? 'Heaviest completed set' : 'Highest exercise volume'}
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
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell size={15} className="text-white/50" />
            <h3 className="text-sm font-bold text-white">Muscles Trained</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.musclesTrained.map(muscle => (
              <span
                key={muscle}
                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white/60"
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
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BatteryMedium size={15} className="text-white/50" />
            <h3 className="text-sm font-bold text-white">Recovery Impact</h3>
          </div>
          <div className="space-y-2">
            {summary.recoveryImpact.fatigued.length > 0 && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-red-500/8 border border-red-500/15">
                <Flame size={15} className="text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-red-400">Fatigued</p>
                  <p className="text-xs text-white/40 mt-0.5">{summary.recoveryImpact.fatigued.join(', ')}</p>
                </div>
              </div>
            )}
            {summary.recoveryImpact.recovering.length > 0 && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-orange-500/8 border border-orange-500/15">
                <Activity size={15} className="text-orange-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-orange-400">Recovering</p>
                  <p className="text-xs text-white/40 mt-0.5">{summary.recoveryImpact.recovering.join(', ')}</p>
                </div>
              </div>
            )}
            {summary.recoveryImpact.fresh.length > 0 && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-emerald-500/8 border border-emerald-500/15">
                <CheckCircle2 size={15} className="text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-400">Fresh</p>
                  <p className="text-xs text-white/40 mt-0.5">{summary.recoveryImpact.fresh.join(', ')}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Done CTA */}
      <button
        onClick={onDone}
        className="w-full min-h-[56px] rounded-2xl bg-accent text-black font-bold text-base active:scale-[0.99] transition-all mt-2"
      >
        Done
      </button>
    </motion.div>
  )
}

// ── Main Review Page ──────────────────────────────────────────
export function PostWorkoutSummary() {
  const navigate = useNavigate()
  const { session, isActive } = useWorkoutSessionStore()
  const { weightUnit } = useUserStore()
  const { finishWorkout, discardWorkout } = useWorkoutFinish()

  const [isSaving, setIsSaving] = useState(false)
  const [savedSummary, setSavedSummary] = useState<WorkoutSummaryData | null>(null)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  // If no active session and nothing saved, bounce back to /train
  useEffect(() => {
    if (!isActive && !session && !savedSummary) {
      navigate('/train', { replace: true })
    }
  }, [isActive, session, savedSummary, navigate])

  if (!session && !savedSummary) return <div className="min-h-dvh bg-bg" aria-hidden="true" />

  async function handleSave() {
    if (isSaving) return
    setIsSaving(true)
    try {
      const summary = await finishWorkout()
      if (summary) {
        setSavedSummary(summary)
      }
    } finally {
      setIsSaving(false)
    }
  }

  function handleDiscard() {
    discardWorkout()
    navigate('/train', { replace: true })
  }

  function handleDone() {
    navigate('/train', { replace: true })
  }

  function handleBackToWorkout() {
    navigate('/train/active', { replace: true })
  }

  // ── Computed review values ─────────────────────────────────
  const completedSets = session?.exercises.reduce(
    (total, ex) => total + ex.sets.filter(s => s.isComplete).length, 0
  ) ?? 0
  const totalSets = session?.exercises.reduce(
    (total, ex) => total + ex.sets.length, 0
  ) ?? 0
  const totalVolume = session?.exercises.reduce(
    (total, ex) => total + ex.sets
      .filter(s => s.isComplete && s.weightKg && s.reps)
      .reduce((sum, s) => sum + (s.weightKg! * s.reps!), 0),
    0
  ) ?? 0

  // ── POST-SAVE: show completed summary ─────────────────────
  if (savedSummary) {
    return (
      <div
        className="min-h-dvh bg-bg overflow-y-auto"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="max-w-lg mx-auto px-4 pb-10 pt-4">
          <CompletedSummary summary={savedSummary} onDone={handleDone} />
        </div>
      </div>
    )
  }

  // ── PRE-SAVE: review + confirm ─────────────────────────────
  return (
    <div
      className="min-h-dvh flex flex-col bg-bg"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* HEADER */}
      <header className="shrink-0 px-4 pt-4 pb-4 border-b border-white/5 bg-bg">
        <div className="flex items-center justify-between gap-3 mb-1">
          <button
            onClick={handleBackToWorkout}
            className="min-h-[44px] min-w-[44px] flex items-center gap-1 text-white/50 hover:text-white transition-colors text-xs font-bold uppercase tracking-[0.15em]"
          >
            <ArrowLeft size={16} />
            Edit
          </button>

          <div className="flex flex-col items-center min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
              Workout Review
            </p>
            <h1 className="text-base font-heading font-bold text-white truncate max-w-[180px]">
              {session?.label}
            </h1>
          </div>

          <div className="min-w-[60px] flex justify-end">
            <span className="text-xs font-semibold text-accent tabular-nums">
              {completedSets}/{totalSets}
            </span>
          </div>
        </div>

        {/* Summary bar */}
        <div className="flex items-center justify-center gap-5 mt-3">
          <div className="text-center">
            <p className="text-lg font-bold text-white tabular-nums">{session?.exercises.length ?? 0}</p>
            <p className="text-[10px] text-white/35 font-semibold uppercase tracking-wider">Exercises</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <p className="text-lg font-bold text-white tabular-nums">{completedSets}</p>
            <p className="text-[10px] text-white/35 font-semibold uppercase tracking-wider">Sets done</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <p className="text-lg font-bold text-white tabular-nums">
              {toDisplayWeight(totalVolume, weightUnit).toLocaleString()}
              <span className="text-sm text-white/35 ml-1">{weightUnit}</span>
            </p>
            <p className="text-[10px] text-white/35 font-semibold uppercase tracking-wider">Volume</p>
          </div>
        </div>
      </header>

      {/* BODY: Exercise checklist */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-2">
        {session?.exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Dumbbell size={32} className="text-white/15 mb-3" />
            <p className="text-sm text-white/40">No exercises were logged in this session.</p>
          </div>
        ) : (
          session?.exercises.map(ex => (
            <ExerciseSummaryRow
              key={ex.instanceId}
              exerciseName={ex.exerciseName}
              totalSets={ex.sets.length}
              completedSets={ex.sets.filter(s => s.isComplete).length}
              sets={ex.sets}
            />
          ))
        )}
      </div>

      {/* BOTTOM CTA */}
      <footer className="shrink-0 px-4 pb-8 pt-4 border-t border-white/5 bg-bg space-y-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full min-h-[56px] rounded-2xl bg-accent text-black font-bold text-base flex items-center justify-center gap-2 active:scale-[0.99] transition-all disabled:opacity-60"
        >
          {isSaving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Trophy size={18} />
              Save Workout
            </>
          )}
        </button>

        <button
          onClick={() => setShowDiscardConfirm(true)}
          className="w-full min-h-[48px] rounded-2xl bg-red-500/8 border border-red-500/15 text-red-400 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
        >
          <Trash2 size={16} />
          Discard Session
        </button>
      </footer>

      {/* Discard confirmation sheet */}
      <AnimatePresence>
        {showDiscardConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDiscardConfirm(false)}
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
              <h2 className="text-xl font-bold text-white text-center mb-2">Discard Session?</h2>
              <p className="text-white/40 text-sm text-center mb-8">
                All logged sets will be permanently lost.
              </p>
              <button
                onClick={handleDiscard}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-500/15 text-red-400 font-bold text-base mb-3 active:scale-95 transition-all border border-red-500/20"
              >
                <Trash2 size={18} /> Yes, Discard
              </button>
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 text-white font-semibold text-base active:scale-95 transition-all"
              >
                Keep Session
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
