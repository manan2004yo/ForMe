// ============================================================
// FORME — Workout Logger Modal
// Log a completed workout session with sets & reps
// ============================================================

import { useState, useCallback } from 'react'
import { Check, Plus, Minus, ChevronDown, ChevronUp, X, Dumbbell, Music } from 'lucide-react'
import { useSpotifyStore, type SpotifyTrack } from '@/store/spotifyStore'
import { useEffect } from 'react'
import { useProgressStore } from '@/store/progressStore'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import type { WorkoutDay, PlannedExercise } from '@/types'
import { v4 as uuidv4 } from 'uuid'

interface SetLog {
  reps: number
  weightKg: number | null
  completed: boolean
  trackBpm?: number
}

interface ExerciseLog {
  exerciseId: string
  exerciseName: string
  sets: SetLog[]
}

interface WorkoutLoggerProps {
  day: WorkoutDay
  onClose: () => void
  onComplete: () => void
}

function SetRow({
  set,
  index,
  onChange,
  exercise,
}: {
  set: SetLog
  index: number
  onChange: (s: SetLog) => void
  exercise: PlannedExercise
}) {
  return (
    <div
      className={`flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors ${
        set.completed ? 'bg-success-light' : 'bg-bg-surface2'
      }`}
    >
      <div className="w-6 text-center text-xs font-medium text-text-tertiary">{index + 1}</div>

      {/* Weight */}
      <div className="flex-1 flex items-center gap-1">
        <button
          onClick={() => onChange({ ...set, weightKg: Math.max(0, (set.weightKg || 0) - 2.5) })}
          className="w-7 h-7 rounded-lg bg-bg-surface3 flex items-center justify-center"
        >
          <Minus size={12} className="text-text-secondary" />
        </button>
        <div className="flex-1 text-center">
          <input
            type="number"
            value={set.weightKg || ''}
            onChange={e => onChange({ ...set, weightKg: parseFloat(e.target.value) || 0 })}
            placeholder="kg"
            className="w-full text-center text-sm font-medium text-text-primary bg-transparent outline-none"
            step="2.5"
          />
        </div>
        <button
          onClick={() => onChange({ ...set, weightKg: (set.weightKg || 0) + 2.5 })}
          className="w-7 h-7 rounded-lg bg-bg-surface3 flex items-center justify-center"
        >
          <Plus size={12} className="text-text-secondary" />
        </button>
      </div>

      {/* Reps */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange({ ...set, reps: Math.max(1, set.reps - 1) })}
          className="w-7 h-7 rounded-lg bg-bg-surface3 flex items-center justify-center"
        >
          <Minus size={12} className="text-text-secondary" />
        </button>
        <span className="w-8 text-center text-sm font-semibold text-text-primary">{set.reps}</span>
        <button
          onClick={() => onChange({ ...set, reps: set.reps + 1 })}
          className="w-7 h-7 rounded-lg bg-bg-surface3 flex items-center justify-center"
        >
          <Plus size={12} className="text-text-secondary" />
        </button>
      </div>

      {/* Complete */}
      <button
        onClick={() => onChange({ ...set, completed: !set.completed })}
        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
          set.completed
            ? 'bg-success text-white shadow-sm'
            : 'bg-bg-surface3 text-text-tertiary hover:bg-success-light hover:text-success'
        }`}
      >
        <Check size={14} strokeWidth={2.5} />
      </button>
    </div>
  )
}

function ExerciseSection({
  exerciseLog,
  exercise,
  onChange,
  currentTrack,
}: {
  exerciseLog: ExerciseLog
  exercise: PlannedExercise
  onChange: (log: ExerciseLog) => void
  currentTrack: SpotifyTrack | null
}) {
  const [expanded, setExpanded] = useState(true)
  const completedSets = exerciseLog.sets.filter(s => s.completed).length

  return (
    <div className="card overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="font-medium text-text-primary">{exercise.exerciseName}</div>
          <div className="text-xs text-text-secondary mt-0.5">
            {exercise.sets} sets × {exercise.repRange[0]}–{exercise.repRange[1]} reps
            {' · '}{completedSets}/{exercise.sets} done
          </div>
        </div>
        <div className="flex items-center gap-2">
          {completedSets === exercise.sets && (
            <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center">
              <Check size={12} className="text-white" strokeWidth={2.5} />
            </div>
          )}
          {expanded ? <ChevronUp size={16} className="text-text-tertiary" /> : <ChevronDown size={16} className="text-text-tertiary" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border animate-fade-in">
          <div className="flex items-center justify-between py-2 mb-2">
            <span className="text-xs text-text-tertiary w-6 text-center">#</span>
            <span className="flex-1 text-xs text-text-tertiary text-center">Weight (kg)</span>
            <span className="text-xs text-text-tertiary">Reps</span>
            <span className="w-8 text-xs text-text-tertiary text-center">✓</span>
          </div>
          <div className="flex flex-col gap-2">
            {exerciseLog.sets.map((set, i) => (
              <SetRow
                key={i}
                set={set}
                index={i}
                exercise={exercise}
                onChange={updated => {
                  const newSets = [...exerciseLog.sets]
                  newSets[i] = updated
                  onChange({ ...exerciseLog, sets: newSets })
                }}
              />
            ))}
          </div>
          <button
            onClick={() => onChange({
              ...exerciseLog,
              sets: [...exerciseLog.sets, { reps: exercise.repRange[0], weightKg: null, completed: false }],
            })}
            className="btn btn-ghost btn-sm w-full mt-2 text-accent"
          >
            <Plus size={14} />
            Add Set
          </button>
        </div>
      )}
    </div>
  )
}

import { Portal } from '@/components/layout/Portal'

export function WorkoutLogger({ day, onClose, onComplete }: WorkoutLoggerProps) {
  const { user } = useAuthStore()
  const { isConnected, currentTrack, fetchCurrentTrack } = useSpotifyStore()

  useEffect(() => {
    if (isConnected) {
      fetchCurrentTrack()
      const interval = setInterval(fetchCurrentTrack, 10000)
      return () => clearInterval(interval)
    }
  }, [isConnected, fetchCurrentTrack])
  const { logWorkout } = useProgressStore()
  const toast = useToastStore()
  const [startTime] = useState(Date.now())
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>(() =>
    day.exercises.map(ex => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      sets: Array.from({ length: ex.sets }, () => ({
        reps: ex.repRange[0],
        weightKg: null,
        completed: false,
      })),
    }))
  )

  const totalSetsCompleted = exerciseLogs.reduce(
    (acc, el) => acc + el.sets.filter(s => s.completed).length,
    0
  )
  const totalSets = exerciseLogs.reduce((acc, el) => acc + el.sets.length, 0)
  const elapsedMin = Math.round((Date.now() - startTime) / 60000)

  const handleSave = useCallback(async () => {
    if (!user) return
    setIsSaving(true)
    try {
      await logWorkout(user.uid, {
        userId: user.uid,
        date: new Date().toISOString().split('T')[0],
        planDayLabel: day.dayLabel,
        durationMin: Math.max(1, elapsedMin),
        exercises: exerciseLogs.map((el, i) => ({
          exerciseId: el.exerciseId,
          exerciseName: el.exerciseName,
          muscleGroup: day.exercises[i]?.muscleGroup || 'core',
          sets: el.sets.filter(s => s.completed).map(s => {
            const loggedSet: any = { reps: s.reps }
            if (s.weightKg) loggedSet.weight = s.weightKg
            return loggedSet
          }),
        })),
        completed: totalSetsCompleted > 0,
        notes,
      })
      toast.success(`Workout complete! ${totalSetsCompleted} sets in ${Math.max(1, elapsedMin)} min 🔥`)
      onComplete()
    } catch (error) {
      console.error('Failed to save workout:', error)
      toast.error('Failed to save workout. Please check your connection and try again.')
    } finally {
      setIsSaving(false)
    }
  }, [user, exerciseLogs, notes, day, elapsedMin, logWorkout, totalSetsCompleted, onComplete, toast])

  return (
    <Portal>
      <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-border sticky top-0 bg-bg-surface z-10 rounded-t-3xl">
          <div className="flex-1 min-w-0">
            <div className="font-heading font-bold text-lg text-text-primary truncate">
              {day.dayLabel}
            </div>
            {isConnected && currentTrack && (
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full w-fit mt-1 border border-emerald-500/20">
                <Music size={10} className="animate-pulse" />
                <span className="truncate max-w-[120px]">{currentTrack.name}</span>
              </div>
            )}
            <div className="text-xs text-text-secondary mt-1">
              {totalSetsCompleted}/{totalSets} sets · {elapsedMin}m elapsed
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost p-2 rounded-xl">
            <X size={18} className="text-text-tertiary" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-bg-surface2">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${(totalSetsCompleted / Math.max(1, totalSets)) * 100}%` }}
          />
        </div>

        {/* Exercise List */}
        <div className="p-4 flex flex-col gap-3">
          {day.exercises.map((exercise, i) => (
            <ExerciseSection
              key={exercise.exerciseId}
              exercise={exercise}
              exerciseLog={exerciseLogs[i]}
              currentTrack={currentTrack}
              onChange={updated => {
                const newLogs = [...exerciseLogs]
                newLogs[i] = updated
                setExerciseLogs(newLogs)
              }}
            />
          ))}

          {/* Notes */}
          <div>
            <label className="text-xs text-text-secondary mb-1 block">Session notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="How was this session? Any PRs? Energy level?"
              className="input-field resize-none text-sm h-16"
            />
          </div>

          {/* Summary */}
          <div className="card p-4 gradient-bg-warm border-accent/20">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="font-heading font-bold text-xl text-text-primary">{totalSetsCompleted}</div>
                <div className="text-xs text-text-tertiary">Sets Done</div>
              </div>
              <div>
                <div className="font-heading font-bold text-xl text-text-primary">{day.exercises.length}</div>
                <div className="text-xs text-text-tertiary">Exercises</div>
              </div>
              <div>
                <div className="font-heading font-bold text-xl text-text-primary">{Math.max(1, elapsedMin)}m</div>
                <div className="text-xs text-text-tertiary">Duration</div>
              </div>
            </div>
          </div>

          {/* Finish */}
          <button
            onClick={handleSave}
            disabled={isSaving || totalSetsCompleted === 0}
            className="btn btn-accent btn-lg w-full"
            id="finish-workout"
          >
            <Dumbbell size={18} />
            {isSaving ? 'Saving...' : totalSetsCompleted === 0 ? 'Complete at least 1 set' : 'Finish Workout'}
          </button>
        </div>
      </div>
    </div>
    </Portal>
  )
}
