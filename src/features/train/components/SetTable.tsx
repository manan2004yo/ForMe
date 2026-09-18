import { AnimatePresence } from 'framer-motion'
import { Plus, Copy } from 'lucide-react'
import { useWorkoutSessionStore, type ActiveExercise } from '@/store/workoutSessionStore'
import { useUserStore } from '@/store/userStore'
import { SetRow } from './SetRow'
import type { PreviousPerformance } from '../hooks/usePreviousPerformance'

interface SetTableProps {
  exercise: ActiveExercise
  previousPerformance: PreviousPerformance | null | undefined
}

export function SetTable({ exercise, previousPerformance }: SetTableProps) {
  const { addSet, updateSet } = useWorkoutSessionStore()
  const { weightUnit } = useUserStore()

  function handleCopyPrevious() {
    if (!previousPerformance) return
    // Add one set per previous set and pre-fill values
    previousPerformance.sets.forEach((prevSet) => {
      addSet(exercise.instanceId)
    })
    // After adding, update the new sets with previous values
    // We read state fresh after the adds
    const freshSets = useWorkoutSessionStore.getState()
      .session?.exercises
      .find(e => e.instanceId === exercise.instanceId)
      ?.sets ?? []

    const newSets = freshSets.slice(-previousPerformance.sets.length)
    newSets.forEach((newSet, i) => {
      const prev = previousPerformance.sets[i]
      updateSet(exercise.instanceId, newSet.setId, {
        weightKg: prev.weight,
        reps: prev.reps,
      })
    })
  }

  return (
    <div className="mt-3 space-y-1">
      {/* Column headers */}
      <div className="grid grid-cols-[28px_1fr_1fr_40px_36px] gap-2 px-2 mb-1">
        <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider text-center">SET</span>
        <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider text-center">
          {weightUnit.toUpperCase()}
        </span>
        <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider text-center">REPS</span>
        <span />
        <span />
      </div>

      {/* Set rows */}
      <AnimatePresence initial={false}>
        {exercise.sets.map((set, index) => (
          <SetRow
            key={set.setId}
            instanceId={exercise.instanceId}
            set={set}
            previousSet={previousPerformance?.sets[index]}
          />
        ))}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-2 pt-2 px-2">
        <button
          onClick={() => addSet(exercise.instanceId)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-semibold transition-all active:scale-95"
        >
          <Plus size={14} /> Add Set
        </button>

        {previousPerformance && exercise.sets.length === 0 && (
          <button
            onClick={handleCopyPrevious}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent text-xs font-semibold transition-all active:scale-95"
          >
            <Copy size={14} /> Copy Previous
          </button>
        )}
      </div>
    </div>
  )
}
