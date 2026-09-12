// ============================================================
// FORME — Train Dashboard
// Shows workout plan with exercises, sets, RIR guidance
// ============================================================

import { useState, useEffect } from 'react'
import { useUserStore } from '@/store/userStore'
import { generateWorkoutPlan, EXERCISES } from '@/lib/engines/workoutEngine'
import type { WorkoutPlan, WorkoutDay, PlannedExercise } from '@/types'
import { Clock, Dumbbell, RotateCcw, ChevronDown, ChevronUp, PlayCircle } from 'lucide-react'
import { WorkoutLogger } from './WorkoutLogger'
import { format } from 'date-fns'

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

function ExerciseCard({ exercise, index }: { exercise: PlannedExercise; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const exData = EXERCISES[exercise.exerciseId]

  return (
    <div className="card overflow-hidden">
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
          <span className={`badge text-xs ${MUSCLE_COLORS[exercise.muscleGroup] || 'badge-neutral'}`}>
            {exercise.muscleGroup}
          </span>
          {expanded ? <ChevronUp size={14} className="text-text-tertiary" /> : <ChevronDown size={14} className="text-text-tertiary" />}
        </div>
      </div>

      {expanded && exData && (
        <div className="px-4 pb-4 border-t border-border animate-fade-in">
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
        </div>
      )}
    </div>
  )
}

function WorkoutDayCard({ day, isToday }: { day: WorkoutDay; isToday: boolean }) {
  const [expanded, setExpanded] = useState(isToday)

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
            {day.exercises.map((exercise, i) => (
              <ExerciseCard key={exercise.exerciseId} exercise={exercise} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function TrainDashboard() {
  const { profile } = useUserStore()
  const [plan, setPlan] = useState<WorkoutPlan | null>(null)
  const [activeLogger, setActiveLogger] = useState<WorkoutDay | null>(null)
  const [lastCompleted, setLastCompleted] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      setPlan(generateWorkoutPlan(profile))
    }
  }, [profile])

  if (!profile || !plan) {
    return (
      <div className="page flex items-center justify-center">
        <div className="text-text-tertiary">Building your workout plan...</div>
      </div>
    )
  }

  const todayDow = new Date().getDay()
  const todayDay = plan.days.find(d => d.dayOfWeek === todayDow)
  const isRestDay = !todayDay

  const regenerate = () => {
    if (profile) setPlan(generateWorkoutPlan(profile))
  }

  return (
    <div className="page animate-fade-in">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-primary">Your Workout 💪</h1>
          <p className="text-text-secondary text-sm mt-1">
            {plan.splitName} · {plan.daysPerWeek} days/week
          </p>
        </div>
        <button onClick={regenerate} className="btn btn-ghost p-2 rounded-xl">
          <RotateCcw size={18} className="text-text-secondary" />
        </button>
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
            return (
              <div key={i} className={`flex-1 rounded-xl p-2 text-center ${
                day ? (isToday ? 'bg-accent text-white' : 'bg-accent-light') : 'bg-bg-surface2'
              }`}>
                <div className={`text-xs font-medium ${day && !isToday ? 'text-accent-dark' : day && isToday ? 'text-white' : 'text-text-tertiary'}`}>
                  {DAY_NAMES[i]}
                </div>
                <div className={`text-[10px] mt-0.5 ${!day ? 'text-text-tertiary' : isToday ? 'text-white/80' : 'text-accent'}`}>
                  {day ? '💪' : '😴'}
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
        {plan.days.map((day) => (
          <div key={`${day.dayOfWeek}-${day.dayLabel}`}>
            <WorkoutDayCard
              day={day}
              isToday={day.dayOfWeek === todayDow}
            />
            {day.dayOfWeek === todayDow && lastCompleted !== day.dayLabel && (
              <button
                onClick={() => setActiveLogger(day)}
                className="btn btn-secondary btn-sm w-full mt-2 mb-1"
              >
                <PlayCircle size={14} /> Log This Session
              </button>
            )}
          </div>
        ))}
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
    </div>
  )
}
