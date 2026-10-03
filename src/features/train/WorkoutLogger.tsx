import { useCallback, useEffect, useState } from 'react'
import { Portal } from '@/components/layout/Portal'
import { useAuthStore } from '@/store/authStore'
import { useProgressStore } from '@/store/progressStore'
import { useSpotifyStore, type SpotifyTrack } from '@/store/spotifyStore'
import { useToastStore } from '@/store/toastStore'
import type { PlannedExercise, WorkoutDay } from '@/types'
import { Check, ChevronDown, Dumbbell, Minus, Music, Plus, X, Edit2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SetLog {
  reps: number
  weightKg: number | null
  completed: boolean
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
}: {
  set: SetLog
  index: number
  onChange: (s: SetLog) => void
}) {
  return (
    <div className={`flex items-center gap-3 py-3 px-4 mb-2 rounded-2xl transition-all ${
      set.completed ? 'bg-success/10 border-success/20' : 'bg-white/5'
    } border border-transparent`}>
      <div className={`w-6 font-bold text-sm ${set.completed ? 'text-success' : 'text-white/30'}`}>
        {index + 1}
      </div>

      <div className="flex-1 flex items-center justify-center gap-2">
        <button
          onClick={() => onChange({ ...set, weightKg: Math.max(0, (set.weightKg || 0) - 2.5) })}
          className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center active:scale-95"
        >
          <Minus size={16} className="text-white/60" />
        </button>
        <div className="w-16 text-center">
          <input
            type="number"
            value={set.weightKg || ''}
            onChange={e => onChange({ ...set, weightKg: parseFloat(e.target.value) || 0 })}
            placeholder="kg"
            className="w-full text-center text-lg font-bold text-white bg-transparent outline-none p-0"
            step="2.5"
          />
          <div className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mt-0.5">Weight</div>
        </div>
        <button
          onClick={() => onChange({ ...set, weightKg: (set.weightKg || 0) + 2.5 })}
          className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center active:scale-95"
        >
          <Plus size={16} className="text-white/60" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center gap-2">
        <button
          onClick={() => onChange({ ...set, reps: Math.max(1, set.reps - 1) })}
          className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center active:scale-95"
        >
          <Minus size={16} className="text-white/60" />
        </button>
        <div className="w-12 text-center">
          <div className="text-lg font-bold text-white leading-tight">{set.reps}</div>
          <div className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mt-0.5">Reps</div>
        </div>
        <button
          onClick={() => onChange({ ...set, reps: set.reps + 1 })}
          className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center active:scale-95"
        >
          <Plus size={16} className="text-white/60" />
        </button>
      </div>

      <button
        onClick={() => onChange({ ...set, completed: !set.completed })}
        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 shrink-0 ${
          set.completed
            ? 'bg-success text-white'
            : 'bg-white/10 text-white/30'
        }`}
      >
        <Check size={20} strokeWidth={3} />
      </button>
    </div>
  )
}

function ExerciseSection({
  exerciseLog,
  exercise,
  onChange,
  isExpanded,
  onToggle,
  currentTrack,
}: {
  exerciseLog: ExerciseLog
  exercise: PlannedExercise
  onChange: (log: ExerciseLog) => void
  isExpanded: boolean
  onToggle: () => void
  currentTrack: SpotifyTrack | null
}) {
  const completedSets = exerciseLog.sets.filter(s => s.completed).length
  const isComplete = completedSets === exerciseLog.sets.length && exerciseLog.sets.length > 0

  return (
    <div className="mb-4">
      <div 
        onClick={onToggle}
        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
          isComplete ? 'bg-success/5 border-success/20' : 'bg-[#121212] border-white/5'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="font-heading font-bold text-lg text-white truncate">
              {exercise.exerciseName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-sm font-semibold ${isComplete ? 'text-success' : 'text-accent'}`}>
                {completedSets} / {exerciseLog.sets.length} sets completed
              </span>
              {isComplete && <Check size={14} className="text-success" strokeWidth={3} />}
            </div>
            
            {!isExpanded && exerciseLog.sets.length > 0 && (
              <div className="flex gap-2 mt-3 overflow-x-auto hide-scrollbar">
                {exerciseLog.sets.map((set, idx) => (
                  <div key={idx} className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium ${
                    set.completed ? 'bg-success/20 text-success' : 'bg-white/5 text-white/40'
                  }`}>
                    {set.weightKg ? `${set.weightKg}kg × ` : ''}{set.reps}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button 
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
              isExpanded ? 'bg-white text-black' : 'bg-white/5 text-white/50'
            }`}
          >
            {isExpanded ? <ChevronDown size={20} /> : <Edit2 size={18} />}
          </button>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-6 pb-2">
                {exerciseLog.sets.map((set, i) => (
                  <SetRow
                    key={i}
                    set={set}
                    index={i}
                    onChange={updated => {
                      const newSets = [...exerciseLog.sets]
                      newSets[i] = updated
                      onChange({ ...exerciseLog, sets: newSets })
                    }}
                  />
                ))}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange({
                      ...exerciseLog,
                      sets: [...exerciseLog.sets, { reps: exercise.repRange[0], weightKg: null, completed: false }],
                    })
                  }}
                  className="w-full mt-2 min-h-12 rounded-xl bg-white/5 text-white/60 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
                >
                  <Plus size={16} />
                  Add Set
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function WorkoutLogger({ day, onClose, onComplete }: WorkoutLoggerProps) {
  const { user } = useAuthStore()
  const { isConnected, currentTrack, fetchCurrentTrack } = useSpotifyStore()
  const { logWorkout } = useProgressStore()
  const toast = useToastStore()
  
  const [startTime] = useState(() => Date.now())
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number>(0)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (isConnected) {
      fetchCurrentTrack()
      const interval = setInterval(fetchCurrentTrack, 30000)
      return () => clearInterval(interval)
    }
  }, [isConnected, fetchCurrentTrack])

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
  const elapsedMin = Math.max(1, Math.round((currentTime - startTime) / 60000))

  const handleSave = useCallback(async () => {
    if (!user) return
    setIsSaving(true)
    try {
      await logWorkout(user.uid, {
        userId: user.uid,
        date: new Date().toISOString().split('T')[0],
        planDayLabel: day.dayLabel || 'Custom Workout',
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
      toast.error('Failed to save workout.')
    } finally {
      setIsSaving(false)
    }
  }, [user, exerciseLogs, notes, day, elapsedMin, logWorkout, totalSetsCompleted, onComplete, toast])

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] bg-background flex flex-col">
        {/* Header */}
        <div className="shrink-0 pt-safe bg-background border-b border-white/5 pb-4 px-5">
          <div className="flex flex-col pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-accent/80 uppercase mb-1">
                  LOG WORKOUT
                </p>
                <h1 className="text-2xl font-heading font-bold text-white">
                  {day.dayLabel}
                </h1>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <div className="flex-1">
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-white/50">Progress</span>
                  <span className="text-accent">{totalSetsCompleted} / {totalSets} sets</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-500 rounded-full"
                    style={{ width: `${(totalSetsCompleted / Math.max(1, totalSets)) * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-semibold text-white/50 mb-1">Duration</div>
                <div className="text-sm font-bold text-white tabular-nums">{elapsedMin} min</div>
              </div>
            </div>

            {isConnected && currentTrack && (
              <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Music size={12} className="text-emerald-500 animate-pulse shrink-0" />
                <span className="text-xs font-semibold text-emerald-400 truncate">
                  {currentTrack.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-6 overscroll-contain">
          {day.exercises.map((exercise, i) => (
            <ExerciseSection
              key={exercise.exerciseId}
              exercise={exercise}
              exerciseLog={exerciseLogs[i]}
              currentTrack={currentTrack}
              isExpanded={expandedIndex === i}
              onToggle={() => setExpandedIndex(expandedIndex === i ? -1 : i)}
              onChange={updated => {
                const newLogs = [...exerciseLogs]
                newLogs[i] = updated
                setExerciseLogs(newLogs)
              }}
            />
          ))}

          <div className="mt-8 mb-6 px-1">
            <h4 className="text-sm font-bold text-white mb-3">Session Notes</h4>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="How was this session? Any PRs?"
              className="w-full bg-[#121212] border border-white/5 rounded-2xl p-4 text-white text-sm focus:border-accent focus:outline-none transition-colors min-h-[100px] resize-none"
            />
          </div>
          
          <div className="px-1 pb-10">
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-[#121212] rounded-2xl p-4 text-center border border-white/5">
                <div className="text-2xl font-heading font-bold text-white">{totalSetsCompleted}</div>
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mt-1">Sets</div>
              </div>
              <div className="bg-[#121212] rounded-2xl p-4 text-center border border-white/5">
                <div className="text-2xl font-heading font-bold text-white">{day.exercises.length}</div>
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mt-1">Exercises</div>
              </div>
              <div className="bg-[#121212] rounded-2xl p-4 text-center border border-white/5">
                <div className="text-2xl font-heading font-bold text-white">{elapsedMin}m</div>
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mt-1">Time</div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving || totalSetsCompleted === 0}
              className={`w-full min-h-[60px] rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.99] ${
                totalSetsCompleted > 0
                  ? 'bg-accent text-black shadow-[0_0_20px_rgba(205,255,100,0.3)]'
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
              }`}
            >
              <Dumbbell size={20} />
              {isSaving ? 'Saving...' : totalSetsCompleted === 0 ? 'Complete sets to finish' : 'Finish Workout'}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
