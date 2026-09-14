// ============================================================
// FORME - Premium Train Dashboard (Manual)
// ============================================================

import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Save, Download, Coffee } from 'lucide-react'
import { useTrainStore } from '@/store/trainStore'
import type { PlannedExercise } from '@/types'
import { TrainExerciseSearch } from './TrainExerciseSearch'
import { MuscleHeatmap } from './MuscleHeatmap'
import { LiveWorkoutBanner } from './LiveWorkoutBanner'
import { PageTransition } from '@/components/layout/PageTransition'
import { clsx } from 'clsx'

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
          <span className="text-xs text-accent/70 bg-accent/10 px-1.5 py-0.5 rounded">
            {10 - (exercise.rir || 8)} RIR
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

function DaySection({ dayIndex, isRestDay, exercises, onBrowse }: {
  dayIndex: number
  isRestDay: boolean
  exercises: PlannedExercise[]
  onBrowse: (dayIndex: number) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const { toggleRestDay, removeExerciseFromDay, saveAsTemplate } = useTrainStore()
  
  const hasExercises = exercises.length > 0

  return (
    <div className="bg-[#121212] border border-white/5 rounded-2xl overflow-hidden mb-4">
      <div 
        className={clsx(
          "p-5 flex items-center justify-between cursor-pointer transition-colors",
          (hasExercises || isRestDay) ? "hover:bg-white/5" : ""
        )}
        onClick={() => (hasExercises || isRestDay) && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-white font-medium">{DAY_NAMES[dayIndex]}</h3>
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
          
          <div className="flex justify-end p-2 border-t border-white/5 mt-2">
            <button 
              onClick={() => {
                const name = prompt("Enter a name for this workout template (e.g., Push Day):")
                if (name) saveAsTemplate(name, dayIndex)
              }}
              className="px-3 py-1.5 text-xs font-semibold text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Save size={14} /> Save as template
            </button>
            <button 
              className="px-3 py-1.5 text-xs font-semibold text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all flex items-center gap-1.5 active:scale-95 ml-2"
            >
              Duplicate workout
            </button>
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
    </div>
  )
}

export function TrainDashboard() {
  const { currentPlan, templates, loadTemplate, clearPlan } = useTrainStore()
  const [browsingDay, setBrowsingDay] = useState<number | null>(null)

  return (
    <PageTransition>
      <div className="page relative">
        <header className="page-header mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-white tracking-tight">
              Workouts
            </h1>
            <p className="text-sm text-white/50 font-medium tracking-wide mt-2">
              Plan your weekly training split
            </p>
          </div>
          
          <div className="flex gap-3">
            {currentPlan.some((d: any) => d.exercises.length > 0) && (
              <button 
                onClick={() => {
                  if(confirm("Are you sure you want to clear your entire weekly plan? This will remove all planned exercises.")) {
                    clearPlan()
                  }
                }}
                className="px-4 py-2 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 active:scale-95"
              >
                Clear workout
              </button>
            )}
          </div>
        </header>

        <LiveWorkoutBanner />

        <div className="mb-8">
          <MuscleHeatmap />
        </div>

        {templates.length > 0 && (
          <div className="mb-8 overflow-x-auto hide-scrollbar">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-white/50 uppercase tracking-widest">Load Template</span>
            </div>
            <div className="flex gap-3">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    const day = prompt("Which day to load this into? (0=Sun, 1=Mon... 6=Sat)")
                    if (day && parseInt(day) >= 0 && parseInt(day) <= 6) {
                      loadTemplate(t.id, parseInt(day))
                    }
                  }}
                  className="px-4 py-2 bg-white/5 text-white border border-white/10 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Download size={16} /> {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Split */}
        <div className="space-y-1">
          {currentPlan.map(day => (
            <DaySection
              key={day.dayIndex}
              dayIndex={day.dayIndex}
              isRestDay={day.isRestDay}
              exercises={day.exercises}
              onBrowse={setBrowsingDay}
            />
          ))}
        </div>

        {browsingDay !== null && (
          <div className="fixed inset-0 z-50 bg-[#0a0a0a] overflow-y-auto">
            <TrainExerciseSearch dayIndex={browsingDay} onClose={() => setBrowsingDay(null)} />
          </div>
        )}
      </div>
    </PageTransition>
  )
}
