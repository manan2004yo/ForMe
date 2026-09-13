// ============================================================
// FORME — Train Dashboard
// Shows workout plan with exercises, sets, RIR guidance
// ============================================================

import { useState, useEffect } from 'react'
import { useUserStore } from '@/store/userStore'
import { useAuthStore } from '@/store/authStore'
import { generateWorkoutPlan, EXERCISES, getAlternatives } from '@/lib/engines/workoutEngine'
import { getWorkoutPlan, saveWorkoutPlan } from '@/lib/firebase/dataService'
import type { WorkoutPlan, WorkoutDay, PlannedExercise } from '@/types'
import { Clock, Dumbbell, RotateCcw, ChevronDown, ChevronUp, PlayCircle, ArrowLeftRight, Sparkles, Trash2, Plus, Search, FileX } from 'lucide-react'
import { WorkoutLogger } from './WorkoutLogger'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { PageTransition } from '@/components/layout/PageTransition'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const MUSCLE_COLORS: Record<string, string> = {
  chest: 'bg-red-100 text-red-700',
  back: 'bg-blue-100 text-blue-700',
  shoulders: 'bg-orange-100 text-orange-700',
  biceps: 'bg-purple-100 text-purple-700',
  triceps: 'bg-violet-100 text-violet-700',
  quads: 'bg-green-100 text-green-700',
  hamstrings: 'bg-teal-100 text-teal-700',
  glutes: 'bg-pink-100 text-pink-700',
  calves: 'bg-yellow-100 text-yellow-700',
  core: 'bg-amber-100 text-amber-700',
  full_body: 'bg-indigo-100 text-indigo-700',
  forearms: 'bg-lime-100 text-lime-700',
}

function RIRBadge({ rir }: { rir: number }) {
  const labels = { 0: 'Failure', 1: 'Near Max', 2: 'Hard', 3: 'Moderate' }
  const colors = {
    0: 'bg-error-light text-error',
    1: 'bg-warning-light text-warning',
    2: 'bg-accent-light text-accent-dark',
    3: 'bg-success-light text-success',
  }
  return (
    <span className={`badge text-xs ${colors[rir as keyof typeof colors] || 'badge-neutral'}`}>
      {rir} RIR — {labels[rir as keyof typeof labels] || 'Moderate'}
    </span>
  )
}

function ExerciseCard({ exercise, index, onRequestSwap, onRemove }: { exercise: PlannedExercise; index: number; onRequestSwap?: () => void, onRemove?: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const exData = EXERCISES[exercise.exerciseId]

  return (
    <div className="card overflow-hidden border border-border">
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="w-8 h-8 rounded-lg bg-bg-surface2 flex items-center justify-center text-sm font-bold text-text-secondary flex-shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-text-primary">{exercise.exerciseName}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-text-secondary">
              {exercise.sets} sets × {exercise.repRange[0]}–{exercise.repRange[1]} reps
            </span>
            <span className="text-xs text-text-tertiary">· Rest {exercise.restSeconds}s</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge text-xs hidden sm:inline-flex ${MUSCLE_COLORS[exercise.muscleGroup] || 'badge-neutral'}`}>
            {exercise.muscleGroup}
          </span>
          {expanded ? <ChevronUp size={14} className="text-text-tertiary" /> : <ChevronDown size={14} className="text-text-tertiary" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && exData && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 border-t border-border overflow-hidden"
          >
            <div className="mt-3">
              <RIRBadge rir={exercise.rir} />
            </div>
            <div className="mt-3">
              <div className="text-xs font-medium text-text-secondary mb-2">How to do it:</div>
              <ol className="flex flex-col gap-1">
                {exData.instructions.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm text-text-secondary">
                    <span className="text-accent font-medium flex-shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            {exData.homeAlternative && EXERCISES[exData.homeAlternative] && (
              <div className="mt-3 p-2 bg-bg-surface2 rounded-xl text-xs text-text-secondary">
                🏠 Home alternative: <span className="font-medium text-text-primary">{EXERCISES[exData.homeAlternative].name}</span>
              </div>
            )}
            
            <div className="flex gap-2 mt-4">
              {onRequestSwap && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onRequestSwap(); }}
                  className="flex-1 py-2.5 rounded-xl border border-accent/30 text-accent font-medium text-sm flex items-center justify-center gap-2 hover:bg-accent/5 transition-colors"
                >
                  <ArrowLeftRight size={14} />
                  Swap
                </button>
              )}
              {onRemove && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onRemove(); }}
                  className="py-2.5 px-4 rounded-xl border border-error/30 text-error font-medium text-sm flex items-center justify-center hover:bg-error/5 transition-colors"
                  aria-label="Remove exercise"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function WorkoutDayCard({ 
  day, 
  isToday, 
  onSwapExercise,
  onRemoveExercise,
  onAddExercise
}: { 
  day: WorkoutDay; 
  isToday: boolean; 
  onSwapExercise: (index: number, currentId: string) => void;
  onRemoveExercise: (index: number) => void;
  onAddExercise: () => void;
}) {
  const [expanded, setExpanded] = useState(isToday || day.exercises.length > 0)

  return (
    <div className={`card overflow-hidden ${isToday ? 'ring-2 ring-accent' : ''}`}>
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-heading font-semibold text-text-primary">{day.dayLabel}</span>
            {isToday && <span className="badge badge-accent text-xs">Today</span>}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-text-secondary flex items-center gap-1">
              <Clock size={10} />
              ~{day.estimatedDurationMin} min
            </span>
            <span className="text-xs text-text-secondary flex items-center gap-1">
              <Dumbbell size={10} />
              {day.exercises.length} exercises
            </span>
            <span className="text-xs text-text-secondary capitalize">
              {DAY_NAMES[day.dayOfWeek]}
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {day.muscleGroups.slice(0, 4).map(mg => (
              <span key={mg} className={`badge text-[10px] ${MUSCLE_COLORS[mg] || 'badge-neutral'}`}>
                {mg}
              </span>
            ))}
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-text-tertiary" /> : <ChevronDown size={16} className="text-text-tertiary" />}
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border animate-fade-in">
          <div className="flex flex-col gap-3 mt-3">
            {day.exercises.length === 0 ? (
              <div className="text-center py-6 text-sm text-text-secondary bg-bg-surface2 rounded-xl">
                Rest day. Or add exercises to build a custom routine!
              </div>
            ) : (
              day.exercises.map((exercise, i) => (
                <ExerciseCard 
                  key={`${exercise.exerciseId}-${i}`} 
                  exercise={exercise} 
                  index={i} 
                  onRequestSwap={() => onSwapExercise(i, exercise.exerciseId)}
                  onRemove={() => onRemoveExercise(i)}
                />
              ))
            )}
            
            <button
              onClick={(e) => { e.stopPropagation(); onAddExercise(); }}
              className="mt-2 w-full py-3 rounded-xl border border-dashed border-border-strong text-text-secondary font-medium text-sm flex items-center justify-center gap-2 hover:bg-bg-surface2 hover:text-text-primary transition-colors"
            >
              <Plus size={16} />
              Add Exercise
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ExerciseSwapModal({ 
  currentExerciseId, 
  onClose, 
  onConfirm 
}: { 
  currentExerciseId: string; 
  onClose: () => void; 
  onConfirm: (newId: string) => void;
}) {
  const [isSwapping, setIsSwapping] = useState(false)
  const [alternatives, setAlternatives] = useState<any[]>([])
  
  useEffect(() => {
    setIsSwapping(true)
    const timer = setTimeout(() => {
      setAlternatives(getAlternatives(currentExerciseId, 3))
      setIsSwapping(false)
    }, 1200)
    return () => clearTimeout(timer)
  }, [currentExerciseId])

  const original = EXERCISES[currentExerciseId]

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-text-primary">AI Exercise Swap</h2>
              <div className="text-xs text-text-tertiary">Swapping: {original?.name}</div>
            </div>
          </div>

          {isSwapping ? (
            <div className="py-8 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
              <div className="text-sm font-medium text-text-primary">Analyzing biomechanics...</div>
              <div className="text-xs text-text-tertiary mt-1">Finding the best {original?.muscleGroup} alternatives</div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {alternatives.length > 0 ? alternatives.map((alt) => (
                <button
                  key={alt.id}
                  onClick={() => onConfirm(alt.id)}
                  className="card-pressable p-4 text-left flex items-center justify-between group border border-border hover:border-accent/50"
                >
                  <div>
                    <div className="font-medium text-text-primary text-sm">{alt.name}</div>
                    <div className="flex gap-2 mt-1.5">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-text-secondary bg-bg-surface2 px-1.5 py-0.5 rounded">
                        {alt.muscleGroup}
                      </span>
                      <span className="text-[10px] text-text-tertiary bg-bg-surface2 px-1.5 py-0.5 rounded capitalize">
                        {alt.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="text-accent opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium bg-accent/10 px-3 py-1.5 rounded-lg">
                    Select
                  </div>
                </button>
              )) : (
                <div className="text-center py-6 text-sm text-text-secondary">
                  No direct alternatives found for this exercise.
                </div>
              )}
            </div>
          )}

          <div className="mt-5">
            <button onClick={onClose} className="btn btn-secondary w-full">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ExerciseLibraryModal({
  onClose,
  onSelect
}: {
  onClose: () => void;
  onSelect: (exId: string) => void;
}) {
  const [search, setSearch] = useState('')
  
  const allExercises = Object.entries(EXERCISES).map(([id, data]) => ({ id, ...data }))
  const filtered = allExercises.filter(ex => 
    ex.name.toLowerCase().includes(search.toLowerCase()) || 
    ex.muscleGroup.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content flex flex-col h-[85vh]" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-border sticky top-0 bg-bg-surface z-10 rounded-t-2xl">
          <h2 className="font-heading font-bold text-lg text-text-primary mb-3">Add Exercise</h2>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input 
              type="text" 
              placeholder="Search exercise or muscle..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10"
              autoFocus
            />
          </div>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          <div className="flex flex-col gap-2">
            {filtered.map(ex => (
              <button
                key={ex.id}
                onClick={() => onSelect(ex.id)}
                className="text-left p-3 rounded-xl hover:bg-bg-surface2 transition-colors flex items-center justify-between group border border-transparent hover:border-border"
              >
                <div>
                  <div className="font-medium text-text-primary text-sm">{ex.name}</div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-text-secondary bg-bg-surface2 px-1.5 py-0.5 rounded">
                      {ex.muscleGroup}
                    </span>
                    <span className="text-[10px] text-text-tertiary bg-bg-surface2 px-1.5 py-0.5 rounded capitalize">
                      {ex.difficulty}
                    </span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-bg-surface2 flex items-center justify-center text-text-secondary group-hover:bg-accent group-hover:text-white transition-colors">
                  <Plus size={16} />
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-10 text-text-secondary text-sm">
                No exercises found.
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-border">
          <button onClick={onClose} className="btn btn-secondary w-full">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export function TrainDashboard() {
  const { user } = useAuthStore()
  const { profile } = useUserStore()
  const [plan, setPlan] = useState<WorkoutPlan | null>(null)
  const [activeLogger, setActiveLogger] = useState<WorkoutDay | null>(null)
  const [lastCompleted, setLastCompleted] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Modals state
  const [swappingTarget, setSwappingTarget] = useState<{ dayOfWeek: number, exerciseIndex: number, currentId: string } | null>(null)
  const [addingToDay, setAddingToDay] = useState<number | null>(null)

  useEffect(() => {
    const loadPlan = async () => {
      if (!user || !profile) return
      setIsLoading(true)
      let currentPlan = await getWorkoutPlan(user.uid)
      
      if (!currentPlan) {
        currentPlan = generateWorkoutPlan(profile)
        await saveWorkoutPlan(user.uid, currentPlan)
      }
      setPlan(currentPlan)
      setIsLoading(false)
    }
    
    loadPlan()
  }, [user, profile])

  if (!profile || isLoading || !plan) {
    return (
      <div className="page flex items-center justify-center min-h-[50vh]">
        <div className="text-text-tertiary animate-pulse flex flex-col items-center">
          <Dumbbell size={24} className="mb-2 opacity-50" />
          Building your workout plan...
        </div>
      </div>
    )
  }

  const todayDow = new Date().getDay()
  const todayDay = plan.days.find(d => d.dayOfWeek === todayDow)
  const isRestDay = !todayDay || todayDay.exercises.length === 0

  const handleSavePlan = async (newPlan: WorkoutPlan) => {
    setPlan(newPlan)
    if (user) {
      await saveWorkoutPlan(user.uid, newPlan)
    }
  }

  const handleRegenerate = async () => {
    if (!profile) return
    const newPlan = generateWorkoutPlan(profile)
    await handleSavePlan(newPlan)
  }
  
  const handleClearPlan = async () => {
    const blankPlan: WorkoutPlan = {
      ...plan,
      splitName: 'Custom Plan',
      daysPerWeek: 0,
      days: Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i,
        dayLabel: 'Custom Day',
        muscleGroups: [],
        exercises: [],
        estimatedDurationMin: 0
      }))
    }
    await handleSavePlan(blankPlan)
  }

  const handleConfirmSwap = async (newExerciseId: string) => {
    if (!swappingTarget || !plan) return
    
    const newPlan = { ...plan, days: [...plan.days] }
    const dayIndex = newPlan.days.findIndex(d => d.dayOfWeek === swappingTarget.dayOfWeek)
    
    if (dayIndex >= 0) {
      const day = { ...newPlan.days[dayIndex] }
      const exList = [...day.exercises]
      
      const newExData = EXERCISES[newExerciseId]
      if (newExData) {
        exList[swappingTarget.exerciseIndex] = {
          ...exList[swappingTarget.exerciseIndex],
          exerciseId: newExerciseId,
          exerciseName: newExData.name,
          muscleGroup: newExData.muscleGroup,
          difficulty: newExData.difficulty as any,
        }
        day.exercises = exList
        newPlan.days[dayIndex] = day
        await handleSavePlan(newPlan)
      }
    }
    setSwappingTarget(null)
  }
  
  const handleRemoveExercise = async (dayOfWeek: number, exerciseIndex: number) => {
    if (!plan) return
    const newPlan = { ...plan, days: [...plan.days] }
    const dayIndex = newPlan.days.findIndex(d => d.dayOfWeek === dayOfWeek)
    
    if (dayIndex >= 0) {
      const day = { ...newPlan.days[dayIndex] }
      const exList = [...day.exercises]
      exList.splice(exerciseIndex, 1)
      
      // Update duration and muscle groups
      day.exercises = exList
      day.estimatedDurationMin = Math.max(0, day.estimatedDurationMin - 5)
      
      // Recompute muscle groups for the day
      const mgSet = new Set<string>()
      exList.forEach(e => mgSet.add(e.muscleGroup))
      day.muscleGroups = Array.from(mgSet) as any
      
      newPlan.days[dayIndex] = day
      await handleSavePlan(newPlan)
    }
  }
  
  const handleAddExercise = async (exerciseId: string) => {
    if (addingToDay === null || !plan) return
    
    const exData = EXERCISES[exerciseId]
    if (!exData) return
    
    const newPlan = { ...plan, days: [...plan.days] }
    const dayIndex = newPlan.days.findIndex(d => d.dayOfWeek === addingToDay)
    
    if (dayIndex >= 0) {
      const day = { ...newPlan.days[dayIndex] }
      const exList = [...day.exercises]
      
      // Default parameters for new exercise
      exList.push({
        exerciseId,
        exerciseName: exData.name,
        muscleGroup: exData.muscleGroup,
        sets: 3,
        repRange: exData.repRange,
        restSeconds: exData.restSec,
        rir: exData.rir,
        difficulty: exData.difficulty as any
      })
      
      day.exercises = exList
      day.estimatedDurationMin += 5
      if (!day.muscleGroups.includes(exData.muscleGroup as any)) {
        day.muscleGroups.push(exData.muscleGroup as any)
      }
      
      newPlan.days[dayIndex] = day
      await handleSavePlan(newPlan)
    }
    
    setAddingToDay(null)
  }

  return (
    <PageTransition>
      <div className="page bg-bg pt-6 pb-8">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-primary">Your Workout 💪</h1>
          <p className="text-text-secondary text-sm mt-1">
            {plan.splitName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleClearPlan} className="btn btn-ghost p-2 rounded-xl text-error hover:bg-error/10 hover:text-error" aria-label="Clear Plan">
            <FileX size={18} />
          </button>
          <button onClick={handleRegenerate} className="btn btn-ghost p-2 rounded-xl text-accent hover:bg-accent/10 hover:text-accent" aria-label="Auto Generate">
            <Sparkles size={18} />
          </button>
        </div>
      </div>

      {/* Today's Status */}
      {isRestDay ? (
        <div className="card p-5 mb-5 gradient-bg-warm border-accent/20">
          <div className="text-3xl mb-2">😴</div>
          <h2 className="font-heading font-semibold text-lg text-text-primary mb-1">
            Rest Day — {format(new Date(), 'EEEE')}
          </h2>
          <p className="text-sm text-text-secondary">
            Recovery is when you grow. Sleep 7–9 hours, stay hydrated, and eat your protein!
          </p>
        </div>
      ) : (
        <div className="card p-5 mb-5 border-accent/30 bg-accent-light">
          {lastCompleted === todayDay?.dayLabel ? (
            <div className="flex items-center gap-3">
              <div className="text-3xl">🏆</div>
              <div>
                <div className="font-heading font-semibold text-lg text-text-primary">Workout Done!</div>
                <div className="text-sm text-success">Great session today 💪</div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🔥</span>
                <h2 className="font-heading font-semibold text-lg text-text-primary">
                  Today: {todayDay?.dayLabel}
                </h2>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-text-secondary">
                  <span className="flex items-center gap-1">
                    <Clock size={13} />
                    ~{todayDay?.estimatedDurationMin} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Dumbbell size={13} />
                    {todayDay?.exercises.length} exercises
                  </span>
                </div>
                {todayDay && (
                  <button
                    onClick={() => setActiveLogger(todayDay)}
                    className="btn btn-accent btn-sm"
                    id="start-workout"
                  >
                    <PlayCircle size={15} />
                    Start
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Plan Overview */}
      <div className="card p-4 mb-5">
        <h2 className="font-heading font-semibold text-text-primary mb-3">Weekly Schedule</h2>
        <div className="flex gap-1.5">
          {Array.from({ length: 7 }, (_, i) => {
            const day = plan.days.find(d => d.dayOfWeek === i)
            const isToday = i === todayDow
            const hasExercises = day && day.exercises.length > 0
            
            return (
              <div key={i} className={`flex-1 rounded-xl p-2 text-center ${
                hasExercises ? (isToday ? 'bg-accent text-white' : 'bg-accent-light') : 'bg-bg-surface2'
              }`}>
                <div className={`text-xs font-medium ${hasExercises && !isToday ? 'text-accent-dark' : hasExercises && isToday ? 'text-white' : 'text-text-tertiary'}`}>
                  {DAY_NAMES[i]}
                </div>
                <div className={`text-[10px] mt-0.5 ${!hasExercises ? 'text-text-tertiary' : isToday ? 'text-white/80' : 'text-accent'}`}>
                  {hasExercises ? '💪' : '😴'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* RIR Guide */}
      <div className="card p-4 mb-5">
        <h2 className="font-heading font-semibold text-text-primary mb-3">Understanding RIR</h2>
        <div className="flex flex-col gap-2">
          {[
            { rir: 3, label: 'Warm Up / Easy', color: 'text-success' },
            { rir: 2, label: 'Working Set — target range', color: 'text-accent' },
            { rir: 1, label: 'Near Max Effort', color: 'text-warning' },
            { rir: 0, label: 'Go to failure (sparingly)', color: 'text-error' },
          ].map(({ rir, label, color }) => (
            <div key={rir} className="flex items-center gap-3">
              <span className={`font-heading font-bold text-sm w-6 ${color}`}>{rir}</span>
              <span className="text-sm text-text-secondary">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-tertiary mt-3">
          RIR = Reps In Reserve. Stop each set with the specified reps left in the tank for safe, progressive training.
        </p>
      </div>

      {/* All Days */}
      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {plan.days.map((day) => (
            <motion.div key={`${day.dayOfWeek}-${day.dayLabel}`}>
              <WorkoutDayCard
                day={day}
                isToday={day.dayOfWeek === todayDow}
                onSwapExercise={(index, currentId) => setSwappingTarget({ dayOfWeek: day.dayOfWeek, exerciseIndex: index, currentId })}
                onRemoveExercise={(index) => handleRemoveExercise(day.dayOfWeek, index)}
                onAddExercise={() => setAddingToDay(day.dayOfWeek)}
              />
              {day.dayOfWeek === todayDow && lastCompleted !== day.dayLabel && day.exercises.length > 0 && (
                <button
                  onClick={() => setActiveLogger(day)}
                  className="btn btn-secondary btn-sm w-full mt-2 mb-1"
                >
                  <PlayCircle size={14} /> Log This Session
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Workout Logger Modal */}
      {activeLogger && (
        <WorkoutLogger
          day={activeLogger}
          onClose={() => setActiveLogger(null)}
          onComplete={() => {
            setLastCompleted(activeLogger.dayLabel)
            setActiveLogger(null)
          }}
        />
      )}
      
      {/* Exercise Swap Modal */}
      {swappingTarget && (
        <ExerciseSwapModal
          currentExerciseId={swappingTarget.currentId}
          onClose={() => setSwappingTarget(null)}
          onConfirm={handleConfirmSwap}
        />
      )}
      
      {/* Add Exercise Modal */}
      {addingToDay !== null && (
        <ExerciseLibraryModal
          onClose={() => setAddingToDay(null)}
          onSelect={handleAddExercise}
        />
      )}
      </div>
    </PageTransition>
  )
}
