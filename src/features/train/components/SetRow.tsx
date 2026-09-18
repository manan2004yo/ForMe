import { useState, useRef, useEffect } from 'react'
import { Check, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkoutSessionStore, type ActiveSet } from '@/store/workoutSessionStore'
import { useUserStore, toDisplayWeight, toStorageWeight } from '@/store/userStore'
import clsx from 'clsx'

interface SetRowProps {
  instanceId: string
  set: ActiveSet
  previousSet?: { weight?: number; reps?: number } // in KG
}

export function SetRow({ instanceId, set, previousSet }: SetRowProps) {
  const { updateSet, completeSet, deleteSet } = useWorkoutSessionStore()
  const { weightUnit } = useUserStore()

  const displayPrevWeight = previousSet?.weight
    ? toDisplayWeight(previousSet.weight, weightUnit)
    : null

  const [weightInput, setWeightInput] = useState(
    set.weightKg ? String(toDisplayWeight(set.weightKg, weightUnit)) : ''
  )
  const [repsInput, setRepsInput] = useState(
    set.reps ? String(set.reps) : ''
  )

  const weightRef = useRef<HTMLInputElement>(null)

  // Auto-focus weight input when a new incomplete set is added
  useEffect(() => {
    if (!set.isComplete && !set.weightKg && !set.reps) {
      weightRef.current?.focus()
    }
  }, [set.setId])

  const prevWeight = previousSet?.weight
    ? toDisplayWeight(previousSet.weight, weightUnit)
    : null
  const prevReps = previousSet?.reps ?? null

  const currentWeight = set.weightKg ? toDisplayWeight(set.weightKg, weightUnit) : null
  const currentReps = set.reps ?? null

  const weightDelta = currentWeight !== null && prevWeight !== null ? currentWeight - prevWeight : null
  const repsDelta = currentReps !== null && prevReps !== null ? currentReps - prevReps : null

  const showOverloadBadge =
    set.isComplete &&
    (weightDelta !== null || repsDelta !== null) &&
    ((weightDelta !== null && weightDelta > 0) || (repsDelta !== null && repsDelta > 0))

  const showRegressBadge =
    set.isComplete &&
    (weightDelta !== null || repsDelta !== null) &&
    ((weightDelta !== null && weightDelta < 0) || (repsDelta !== null && repsDelta < 0)) &&
    !showOverloadBadge

  function handleComplete() {
    const w = parseFloat(weightInput)
    const r = parseInt(repsInput)
    if (!isNaN(w) && w > 0) {
      updateSet(instanceId, set.setId, { weightKg: toStorageWeight(w, weightUnit) })
    }
    if (!isNaN(r) && r > 0) {
      updateSet(instanceId, set.setId, { reps: r })
    }
    completeSet(instanceId, set.setId)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={clsx(
        'grid items-center gap-2 px-2 py-1.5 rounded-xl transition-colors',
        'grid-cols-[28px_1fr_1fr_40px_36px]',
        set.isComplete && 'bg-white/5'
      )}
    >
      {/* Set number */}
      <span className="text-xs font-bold text-white/40 text-center tabular-nums">
        {set.setNumber}
      </span>

      {/* Weight input */}
      <div className="flex flex-col">
        {displayPrevWeight && (
          <span className="text-[10px] text-white/30 tabular-nums mb-0.5">
            {displayPrevWeight}{weightUnit}
          </span>
        )}
        <input
          ref={weightRef}
          type="text"
          inputMode="decimal"
          pattern="[0-9]*\.?[0-9]*"
          placeholder={displayPrevWeight ? String(displayPrevWeight) : '0'}
          value={weightInput}
          onChange={e => setWeightInput(e.target.value)}
          onBlur={() => {
            const w = parseFloat(weightInput)
            if (!isNaN(w) && w > 0) {
              updateSet(instanceId, set.setId, { weightKg: toStorageWeight(w, weightUnit) })
            }
          }}
          disabled={set.isComplete}
          className={clsx(
            'w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5',
            'text-sm font-semibold text-white text-center tabular-nums',
            'focus:outline-none focus:border-accent focus:bg-white/10',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all'
          )}
        />
      </div>

      {/* Reps input */}
      <div className="flex flex-col">
        {previousSet?.reps && (
          <span className="text-[10px] text-white/30 tabular-nums mb-0.5">
            {previousSet.reps} reps
          </span>
        )}
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder={previousSet?.reps ? String(previousSet.reps) : '0'}
          value={repsInput}
          onChange={e => setRepsInput(e.target.value)}
          onBlur={() => {
            const r = parseInt(repsInput)
            if (!isNaN(r) && r > 0) {
              updateSet(instanceId, set.setId, { reps: r })
            }
          }}
          disabled={set.isComplete}
          className={clsx(
            'w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5',
            'text-sm font-semibold text-white text-center tabular-nums',
            'focus:outline-none focus:border-accent focus:bg-white/10',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all'
          )}
        />
      </div>

      {/* Complete button */}
      <button
        onClick={handleComplete}
        disabled={set.isComplete}
        className={clsx(
          'flex items-center justify-center w-9 h-9 rounded-xl transition-all',
          set.isComplete
            ? 'bg-green-500/20 text-green-400 cursor-default'
            : 'bg-accent/20 text-accent hover:bg-accent hover:text-black active:scale-95'
        )}
      >
        <Check size={16} strokeWidth={2.5} />
      </button>

      {/* Delete button */}
      <button
        onClick={() => deleteSet(instanceId, set.setId)}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-95"
      >
        <Trash2 size={14} />
      </button>

      {/* Progressive overload badge */}
      <AnimatePresence>
        {(showOverloadBadge || showRegressBadge) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="col-span-5 px-1 pb-1"
          >
            <span className={clsx(
              'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full',
              showOverloadBadge
                ? 'bg-green-500/15 text-green-400'
                : 'bg-red-500/15 text-red-400'
            )}>
              {showOverloadBadge ? '↑' : '↓'}
              {weightDelta !== null && weightDelta !== 0 && (
                <span>{weightDelta > 0 ? '+' : ''}{weightDelta.toFixed(1)}{weightUnit}</span>
              )}
              {repsDelta !== null && repsDelta !== 0 && (
                <span>{repsDelta > 0 ? '+' : ''}{repsDelta} reps</span>
              )}
              {showOverloadBadge ? 'PR pace' : 'Below previous'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
