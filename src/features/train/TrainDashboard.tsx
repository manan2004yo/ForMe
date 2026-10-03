/* eslint-disable no-unused-vars */
// ============================================================
// FORME - Premium Train Dashboard (Manual)
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bookmark,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Coffee,
  Dumbbell,
  History,
  Library,
  Play,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react'
import { useTrainStore } from '@/store/trainStore'
import { useAuthStore } from '@/store/authStore'
import { useProgressStore } from '@/store/progressStore'
import { useWorkoutSessionStore } from '@/store/workoutSessionStore'
import { TrainExerciseSearch } from './TrainExerciseSearch'
import { MuscleMapSection } from './MuscleMapSection'
import { ExerciseHistorySheet } from './components/ExerciseHistorySheet'
import { EXERCISE_DATABASE, type ExerciseEntry } from '@/lib/data/exerciseDatabase'
import { PageTransition } from '@/components/layout/PageTransition'
import { clsx } from 'clsx'
import type { PlannedExercise } from '@/types'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { PromptModal } from '@/components/ui/PromptModal'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function ExerciseRow({ exercise, onRemove }: { exercise: PlannedExercise, onRemove: () => void }) {
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 mb-2 last:mb-0 group">
      <div>
        <div className="text-sm text-white font-medium">{exercise.exerciseName}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-white/50">
            {exercise.sets} sets • {exercise.repRange[0]}-{exercise.repRange[1]} reps
          </span>
        </div>
      </div>
      {confirm ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-red-400 font-medium">Remove?</span>
          <button onClick={onRemove} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-semibold hover:bg-red-500/30 transition-all active:scale-95">Yes</button>
          <button onClick={() => setConfirm(false)} className="px-3 py-1.5 bg-white/5 text-white/70 rounded-lg text-xs font-semibold hover:bg-white/10 transition-all active:scale-95">No</button>
        </div>
      ) : (
        <button
          onClick={() => setConfirm(true)}
          className="px-3 py-1.5 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:opacity-100 text-xs font-semibold active:scale-95"
        >
          Remove
        </button>
      )}
    </div>
  )
}

function DaySection({ dayIndex, isRestDay, exercises, isToday, onBrowse, onStartWorkout }: {
  dayIndex: number
  isRestDay: boolean
  exercises: PlannedExercise[]
  isToday?: boolean
  onBrowse: (dayIndex: number) => void
  onStartWorkout: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const { toggleRestDay, removeExerciseFromDay, saveAsTemplate } = useTrainStore()
  
  const hasExercises = exercises.length > 0

  return (
    <div className={clsx(
      'glass-panel overflow-hidden mb-4 transition-all duration-300 hover:shadow-card-hover',
      isToday
        ? 'border-accent/30 bg-accent/5'
        : 'border-white/5 bg-white/3'
    )}>
      <div 
        className={clsx(
          "p-5 flex items-center justify-between cursor-pointer transition-colors",
          (hasExercises || isRestDay) ? "hover:bg-white/5" : ""
        )}
        onClick={() => (hasExercises || isRestDay) && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center">
              <h3 className="text-white font-medium">{DAY_NAMES[dayIndex]}</h3>
              {isToday && (
                <span className="text-[10px] font-bold text-accent bg-accent/15 px-2 py-0.5 rounded-full ml-2">
                  TODAY
                </span>
              )}
            </div>
            {isRestDay ? (
              <span className="text-xs text-blue-400 font-medium mt-1 block">Rest Day</span>
            ) : hasExercises ? (
              <span className="text-xs text-white/50 mt-1 block">{exercises.length} exercises</span>
            ) : (
              <span className="text-xs text-white/30 mt-1 block">Unplanned</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {!hasExercises && !isRestDay && (
            <button
              onClick={(e) => { e.stopPropagation(); onBrowse(dayIndex); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-all text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-95"
            >
              <Plus size={14} /> Create workout day
            </button>
          )}
          
          {hasExercises && !isRestDay && (
            <button
              onClick={(e) => { e.stopPropagation(); onBrowse(dayIndex); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-all text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-95"
            >
              <Plus size={14} /> Add exercise manually
            </button>
          )}
          
          <button
            onClick={(e) => { e.stopPropagation(); toggleRestDay(dayIndex); }}
            className={clsx(
              "px-3 py-1.5 rounded-lg transition-all text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95",
              isRestDay ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
            )}
          >
            {isRestDay ? "Remove rest day" : "Mark rest day"}
          </button>

          {(hasExercises || isRestDay) && (
            <button 
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="text-white/40 p-1.5 hover:bg-white/5 rounded-lg ml-1 transition-all active:scale-95"
              aria-label={expanded ? "Collapse day" : "Expand day"}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>

      {expanded && !isRestDay && hasExercises && (
        <div className="border-t border-white/5 bg-[#0a0a0a]/50 p-2">
          <div className="mb-2">
            {exercises.map((ex) => (
              <ExerciseRow key={ex.id} exercise={ex} onRemove={() => removeExerciseFromDay(dayIndex, ex.id!)} />
            ))}
          </div>
          
          <div className="flex justify-between p-2 border-t border-white/5 mt-2">
            <button 
              onClick={(e) => { e.stopPropagation(); onStartWorkout(); }}
              className="px-4 py-1.5 text-xs font-bold text-black bg-accent hover:bg-accent/90 rounded-lg transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(45,212,191,0.2)] active:scale-95"
            >
              <CheckCircle2 size={14} /> Log Workout
            </button>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowSavePrompt(true)}
                className="px-3 py-1.5 text-xs font-semibold text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Save size={14} /> Save template
              </button>

            </div>
          </div>
        </div>
      )}
      
      {expanded && isRestDay && (
        <div className="border-t border-white/5 bg-blue-500/5 p-6 flex flex-col items-center justify-center text-center">
          <Coffee size={24} className="text-blue-400 mb-2" />
          <p className="text-sm font-medium text-blue-200">Rest & Recovery</p>
          <p className="text-xs text-blue-400/70 mt-1 max-w-[200px]">Focus on hydration, mobility, and high protein intake today.</p>
        </div>
      )}

      <PromptModal
        isOpen={showSavePrompt}
        title="Save as Template"
        message="Enter a name for this workout template (e.g., Push Day):"
        placeholder="Template Name"
        confirmText="Save Template"
        onCancel={() => setShowSavePrompt(false)}
        onSubmit={(name: string) => {
          saveAsTemplate(name, dayIndex)
          setShowSavePrompt(false)
        }}
      />
    </div>
  )
}

export function TrainDashboard() {
  const { currentPlan, templates, loadTemplate, clearPlan, loadAll } = useTrainStore()
  const { user } = useAuthStore()
  const { workoutLogs } = useProgressStore()

  const [browsingDay, setBrowsingDay] = useState<number | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [loadTemplateId, setLoadTemplateId] = useState<string | null>(null)
  const [libraryQuery, setLibraryQuery] = useState('')
  const [historyExpanded, setHistoryExpanded] = useState(false)
  const [selectedLibraryExercise, setSelectedLibraryExercise] = useState<ExerciseEntry | null>(null)

  const todayIndex = new Date().getDay()
  const todayDate = new Date().toISOString().split('T')[0]
  const todayWorkout = currentPlan.find(day => day.dayIndex === todayIndex)
  const completedToday = workoutLogs.some(log => log.date === todayDate && log.completed)

  useEffect(() => {
    if (user) {
      loadAll(user.uid)
    }
  }, [user, loadAll])

  const recentHistory = useMemo(
    () => workoutLogs
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8),
    [workoutLogs]
  )

  const libraryResults = useMemo(() => {
    const q = libraryQuery.trim().toLowerCase()
    if (!q) return EXERCISE_DATABASE.slice(0, 50)

    return EXERCISE_DATABASE
      .filter(exercise =>
        exercise.name.toLowerCase().includes(q) ||
        exercise.aliases.some(alias => alias.toLowerCase().includes(q)) ||
        exercise.primaryMuscle.toLowerCase().includes(q) ||
        exercise.secondaryMuscles.some(muscle => muscle.toLowerCase().includes(q))
      )
      .slice(0, 50)
  }, [libraryQuery])

  const planHasExercises = currentPlan.some(day => day.exercises.length > 0)

  function startTodayWorkout() {
    if (!todayWorkout || todayWorkout.isRestDay || todayWorkout.exercises.length === 0) return

    useWorkoutSessionStore.getState().startSessionFromPlan(
      todayWorkout.dayLabel || DAY_NAMES[todayIndex],
      todayWorkout.exercises
    )
  }

  function startFreestyleWorkout() {
    useWorkoutSessionStore.getState().startSession('Freestyle Session')
  }

  return (
    <>
      <PageTransition>
        <div className="page relative space-y-8 pb-10">
          <header className="page-header flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent/70 mb-2">
                  TRAIN
                </p>
                <h1 className="text-3xl font-heading font-bold text-white tracking-tight">
                  Train
                </h1>
                <p className="text-sm text-white/50 font-medium mt-2">
                  Your workout plan, sessions, history, and recovery in one place.
                </p>
              </div>

              <button
                onClick={startFreestyleWorkout}
                className="min-h-11 shrink-0 px-4 rounded-2xl bg-accent text-black font-bold text-sm flex items-center gap-2 shadow-[0_0_24px_rgba(45,212,191,0.18)] active:scale-95 transition-all"
              >
                <Play size={16} fill="currentColor" />
                Train now
              </button>
            </div>
          </header>

          {/* Today's Workout */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/35">
                  TODAY'S WORKOUT
                </p>
                <h2 className="text-xl font-heading font-bold text-white mt-1">
                  {todayWorkout?.isRestDay ? 'Recovery day' : todayWorkout?.dayLabel || 'No workout planned'}
                </h2>
              </div>
              {completedToday && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/15 px-3 py-1.5 rounded-full">
                  Completed
                </span>
              )}
            </div>

            <div className="glass-panel p-5">
              {todayWorkout?.isRestDay ? (
                <div className="text-center py-6">
                  <CalendarDays size={28} className="mx-auto text-white/20 mb-3" />
                  <p className="text-white font-semibold">Rest & recovery</p>
                  <p className="text-white/35 text-sm mt-1">
                    No workout is scheduled for today.
                  </p>
                </div>
              ) : todayWorkout?.exercises.length ? (
                <>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="text-sm text-white/60">
                        {todayWorkout.exercises.length} exercises
                      </p>
                      <p className="text-xs text-white/30 mt-1">
                        {todayWorkout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0)} planned sets
                      </p>
                    </div>
                    <Clock3 size={22} className="text-accent/70" />
                  </div>

                  <div className="space-y-2 mb-5">
                    {todayWorkout.exercises.slice(0, 4).map(exercise => (
                      <div
                        key={exercise.id ?? exercise.exerciseId}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/5"
                      >
                        <span className="text-sm text-white/80 truncate">{exercise.exerciseName}</span>
                        <span className="text-xs text-white/35 shrink-0">
                          {exercise.sets} × {exercise.repRange[0]}-{exercise.repRange[1]}
                        </span>
                      </div>
                    ))}
                    {todayWorkout.exercises.length > 4 && (
                      <p className="text-xs text-white/30 px-1">
                        + {todayWorkout.exercises.length - 4} more exercises
                      </p>
                    )}
                  </div>

                  <button
                    onClick={startTodayWorkout}
                    disabled={completedToday}
                    className="w-full min-h-11 rounded-2xl bg-accent text-black font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] transition-all"
                  >
                    <Dumbbell size={17} />
                    {completedToday ? 'Workout completed' : 'Start today’s workout'}
                  </button>
                </>
              ) : (
                <div className="text-center py-6">
                  <Dumbbell size={28} className="mx-auto text-white/20 mb-3" />
                  <p className="text-white font-semibold">Nothing planned yet</p>
                  <p className="text-white/35 text-sm mt-1 mb-5">
                    Build today’s workout or start a freestyle session.
                  </p>
                  <button
                    onClick={() => setBrowsingDay(todayIndex)}
                    className="min-h-11 px-5 rounded-2xl bg-white/10 border border-white/10 text-white font-semibold text-sm active:scale-95 transition-all"
                  >
                    Build today’s workout
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Weekly Program */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/35">
                  WEEKLY PROGRAM
                </p>
                <h2 className="text-xl font-heading font-bold text-white mt-1">
                  Your seven-day plan
                </h2>
              </div>
              {planHasExercises && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="min-h-11 px-3 rounded-xl text-xs font-semibold text-red-400 border border-red-500/15 bg-red-500/5 active:scale-95 transition-all"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-2">
              {currentPlan.map(day => (
                <DaySection
                  key={day.dayIndex}
                  dayIndex={day.dayIndex}
                  isRestDay={day.isRestDay}
                  exercises={day.exercises}
                  isToday={day.dayIndex === todayIndex}
                  onBrowse={setBrowsingDay}
                  onStartWorkout={() => {
                    if (day.isRestDay || day.exercises.length === 0) return
                    useWorkoutSessionStore.getState().startSessionFromPlan(
                      day.dayLabel || DAY_NAMES[day.dayIndex],
                      day.exercises
                    )
                  }}
                />
              ))}
            </div>
          </section>

          {/* Saved Plans */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/35">
                  SAVED PLANS
                </p>
                <h2 className="text-xl font-heading font-bold text-white mt-1">
                  Reusable workout templates
                </h2>
              </div>
              <Bookmark size={19} className="text-accent/60" />
            </div>

            <div className="glass-panel p-4">
              {templates.length === 0 ? (
                <div className="text-center py-5">
                  <Save size={24} className="mx-auto text-white/15 mb-2" />
                  <p className="text-sm text-white/45">
                    Save any planned workout as a template to reuse it later.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => setLoadTemplateId(template.id)}
                      className="w-full min-h-11 flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 active:scale-[0.99] transition-all text-left"
                    >
                      <span className="text-sm font-semibold text-white truncate">{template.name}</span>
                      <span className="text-xs text-white/30 shrink-0">
                        {template.exercises.length} exercises
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Exercise Library */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/35">
                  EXERCISE LIBRARY
                </p>
                <h2 className="text-xl font-heading font-bold text-white mt-1">
                  {EXERCISE_DATABASE.length}+ canonical exercises
                </h2>
              </div>
              <Library size={19} className="text-accent/60" />
            </div>

            <div className="glass-panel p-4">
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  value={libraryQuery}
                  onChange={event => setLibraryQuery(event.target.value)}
                  placeholder="Search exercise or muscle..."
                  className="w-full min-h-11 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                {libraryResults.map(exercise => (
                  <button
                    key={exercise.id}
                    onClick={() => setSelectedLibraryExercise(exercise)}
                    className="w-full min-h-11 flex items-center justify-between gap-3 px-3 py-3 rounded-xl bg-white/5 border border-white/5 text-left hover:bg-white/10 active:scale-[0.99] transition-all"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{exercise.name}</p>
                      <p className="text-xs text-white/35 mt-0.5 capitalize">
                        {exercise.primaryMuscle.replace('_', ' ')} · {exercise.type}
                      </p>
                    </div>
                    <History size={15} className="text-white/25 shrink-0" />
                  </button>
                ))}

                {libraryResults.length === 0 && (
                  <div className="text-center py-8">
                    <Search size={24} className="mx-auto text-white/15 mb-2" />
                    <p className="text-sm text-white/40">No exercises match that search.</p>
                  </div>
                )}
              </div>

              {!libraryQuery.trim() && EXERCISE_DATABASE.length > libraryResults.length && (
                <p className="text-[11px] text-white/25 text-center mt-3">
                  Search to explore the full exercise database.
                </p>
              )}
            </div>
          </section>

          {/* History */}
          <section>
            <button
              onClick={() => setHistoryExpanded(value => !value)}
              className="w-full flex items-center justify-between gap-3 mb-3 text-left"
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/35">
                  HISTORY
                </p>
                <h2 className="text-xl font-heading font-bold text-white mt-1">
                  Recent sessions
                </h2>
              </div>
              {historyExpanded ? (
                <ChevronUp size={20} className="text-white/40" />
              ) : (
                <ChevronDown size={20} className="text-white/40" />
              )}
            </button>

            {historyExpanded && (
              <div className="glass-panel p-4">
                {recentHistory.length === 0 ? (
                  <div className="text-center py-7">
                    <History size={26} className="mx-auto text-white/15 mb-2" />
                    <p className="text-sm text-white/40">No workout history yet.</p>
                    <p className="text-xs text-white/25 mt-1">
                      Complete a real session to start building history.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentHistory.map(log => {
                      const completedSets = log.exercises.reduce(
                        (sum, exercise) => sum + exercise.sets.length,
                        0
                      )
                      const volume = log.exercises.reduce(
                        (sum, exercise) => sum + exercise.sets.reduce(
                          (exerciseSum, set) => exerciseSum + ((set.weight ?? 0) * set.reps),
                          0
                        ),
                        0
                      )

                      return (
                        <div
                          key={log.id}
                          className="p-4 rounded-xl bg-white/5 border border-white/5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">
                                {log.planDayLabel}
                              </p>
                              <p className="text-xs text-white/30 mt-1">
                                {log.date}
                              </p>
                            </div>
                            <span className="text-xs font-semibold text-accent/80 shrink-0">
                              {completedSets} sets
                            </span>
                          </div>

                          <div className="flex gap-3 mt-3 text-xs text-white/40">
                            <span>{log.durationMin ?? 0} min</span>
                            <span>{Math.round(volume).toLocaleString()} kg volume</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Recovery */}
          <section>
            <div className="mb-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/35">
                RECOVERY
              </p>
              <h2 className="text-xl font-heading font-bold text-white mt-1">
                Muscle recovery
              </h2>
            </div>
            <MuscleMapSection />
          </section>

          {/* Plan-first / train-first entry */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={startTodayWorkout}
              disabled={!todayWorkout || todayWorkout.isRestDay || todayWorkout.exercises.length === 0}
              className="min-h-12 rounded-2xl bg-accent text-black font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.99] transition-all"
            >
              <CalendarDays size={17} />
              Plan-first: train today
            </button>

            <button
              onClick={startFreestyleWorkout}
              className="min-h-12 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
            >
              <Plus size={17} />
              Train-first: start empty
            </button>
          </section>
        </div>
      </PageTransition>

      {browsingDay !== null && (
        <div className="fixed inset-0 z-50 bg-[#0a0a0a] overflow-y-auto">
          <TrainExerciseSearch
            dayIndex={browsingDay}
            onClose={() => setBrowsingDay(null)}
          />
        </div>
      )}

      <ConfirmModal
        isOpen={showClearConfirm}
        title="Clear Weekly Program"
        message="This removes exercises from your weekly program. Saved plans remain available."
        confirmText="Clear Program"
        isDestructive={true}
        onCancel={() => setShowClearConfirm(false)}
        onConfirm={() => {
          clearPlan()
          setShowClearConfirm(false)
        }}
      />

      <ConfirmModal
        isOpen={loadTemplateId !== null}
        title="Load Saved Plan"
        message={`Load "${templates.find(template => template.id === loadTemplateId)?.name}" into today's program?`}
        confirmText="Load Today"
        isDestructive={false}
        onCancel={() => setLoadTemplateId(null)}
        onConfirm={() => {
          if (loadTemplateId) {
            loadTemplate(loadTemplateId, todayIndex)
          }
          setLoadTemplateId(null)
        }}
      />

      <ExerciseHistorySheet
        isOpen={selectedLibraryExercise !== null}
        onClose={() => setSelectedLibraryExercise(null)}
        exerciseId={selectedLibraryExercise?.id ?? ''}
        exerciseName={selectedLibraryExercise?.name ?? ''}
      />
    </>
  )
}
