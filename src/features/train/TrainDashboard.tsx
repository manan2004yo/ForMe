/* eslint-disable no-unused-vars */
// ============================================================
// FORME - Premium Train Dashboard (Manual)
// ============================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, ChevronDown, ChevronUp, Save, Download, Coffee, CheckCircle2, Music, Loader2 } from 'lucide-react'
import { useSpotifyStore } from '@/store/spotifyStore'
import { useEffect } from 'react'
import { useTrainStore } from '@/store/trainStore'
import { useAuthStore } from '@/store/authStore'
import { useProgressStore } from '@/store/progressStore'
import { TrainExerciseSearch } from './TrainExerciseSearch'
import { MuscleMapSection } from './MuscleMapSection'
import type { PlannedExercise } from '@/types'
import { useCnsStore } from '@/store/cnsStore'
import { v4 as uuidv4 } from 'uuid'
import type { WorkoutDay } from '@/types'
import { useWorkoutSessionStore } from '@/store/workoutSessionStore'
import { PageTransition } from '@/components/layout/PageTransition'
import { clsx } from 'clsx'
import { AlertTriangle } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { PromptModal } from '@/components/ui/PromptModal'

function SpotifyWidget() {
  const { isConnected, isConnecting, currentTrack, connect, disconnect, fetchCurrentTrack } = useSpotifyStore()

  useEffect(() => {
    if (isConnected) {
      fetchCurrentTrack()
      const interval = setInterval(fetchCurrentTrack, 10000)
      return () => clearInterval(interval)
    }
  }, [isConnected, fetchCurrentTrack])

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "relative overflow-hidden p-5 mb-8 rounded-3xl border transition-all duration-700 flex flex-col md:flex-row md:items-center justify-between gap-4",
        isConnected 
          ? "bg-gradient-to-br from-[#121212] to-[#1DB954]/10 border-[#1DB954]/30 shadow-[0_8px_32px_rgba(29,185,84,0.15)]"
          : "bg-[#121212] border-white/10 shadow-xl"
      )}
    >
      {/* Background ambient glow when connected */}
      {isConnected && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -top-24 -right-24 w-64 h-64 bg-[#1DB954]/20 rounded-full blur-[80px] pointer-events-none"
        />
      )}

      <div className="flex items-center gap-4 relative z-10">
        <div className={clsx(
          "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-700 relative",
          isConnected ? "bg-[#1DB954] text-black shadow-[0_0_20px_rgba(29,185,84,0.4)]" : "bg-white/5 text-white/40"
        )}>
          {isConnecting ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <Music size={24} className={isConnected ? "animate-pulse" : ""} />
          )}
          {isConnected && (
            <div className="absolute inset-0 rounded-full border-2 border-[#1DB954] animate-ping opacity-20" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-base tracking-tight mb-0.5">Spotify Performance</h3>
          
          <div className="h-5 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {isConnected && currentTrack ? (
                <motion.div 
                  key={currentTrack.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-[#1DB954] animate-pulse" />
                  <span className="text-white font-medium truncate max-w-[120px] sm:max-w-[200px]">
                    {currentTrack.name}
                  </span>
                  <span className="text-white/40 text-xs truncate max-w-[80px]">
                    by {currentTrack.artist}
                  </span>
                </motion.div>
              ) : (
                <motion.div 
                  key="disconnected"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-white/40"
                >
                  {isConnecting 
                    ? "Connecting to Spotify..." 
                    : isConnected 
                      ? "Connected. Play a song to see it here." 
                      : "Link your Spotify account"}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          if (isConnected) disconnect()
          else connect()
        }}
        disabled={isConnecting}
        className={clsx(
          "relative z-10 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95 flex items-center justify-center gap-2",
          isConnected 
            ? "bg-white/5 text-white hover:bg-white/10 border border-white/10" 
            : "bg-[#1DB954] text-black hover:bg-[#1ed760] shadow-[0_4px_14px_rgba(29,185,84,0.4)]"
        )}
      >
        {isConnecting && <Loader2 size={16} className="animate-spin" />}
        {isConnected ? 'Disconnect' : 'Connect Account'}
      </button>
    </motion.div>
  )
}

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

function DaySection({ dayIndex, isRestDay, exercises, onBrowse, onStartWorkout }: {
  dayIndex: number
  isRestDay: boolean
  exercises: PlannedExercise[]
  onBrowse: (dayIndex: number) => void
  onStartWorkout: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const { toggleRestDay, removeExerciseFromDay, saveAsTemplate } = useTrainStore()
  
  const hasExercises = exercises.length > 0

  return (
    <div className="glass-panel overflow-hidden mb-4 transition-all duration-300 hover:shadow-card-hover">
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
        onSubmit={(name) => {
          saveAsTemplate(name, dayIndex)
          setShowSavePrompt(false)
        }}
      />
    </div>
  )
}

export function TrainDashboard() {
  const { currentPlan, templates, loadTemplate, clearPlan, loadAll, isLoading } = useTrainStore()
  const { getCurrentStatus } = useCnsStore()
  const { user } = useAuthStore()
  
  useEffect(() => {
    if (user) {
      loadAll(user.uid)
    }
  }, [user, loadAll])
  const [browsingDay, setBrowsingDay] = useState<number | null>(null)
  const [activeWorkoutDay, setActiveWorkoutDay] = useState<WorkoutDay | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [loadTemplateId, setLoadTemplateId] = useState<string | null>(null)
  const cnsStatus = getCurrentStatus()

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
            <button 
              onClick={() => useWorkoutSessionStore.getState().startSession('Freestyle Session')}
              className="px-4 py-2 bg-accent text-black hover:bg-accent/90 rounded-lg text-sm font-bold transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus size={16} /> Start Session
            </button>
            {currentPlan.some((d: any) => d.exercises.length > 0) && (
              <button 
                onClick={() => setShowClearConfirm(true)}
                className="px-4 py-2 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 active:scale-95"
              >
                <Trash2 size={16} /> Clear Plan
              </button>
            )}
          </div>
        </header>



        {cnsStatus === 'Fried' && (
          <div className="mb-8 p-4 rounded-2xl bg-error/10 border border-error/20 flex gap-4 items-start">
            <div className="p-2 rounded-xl bg-error/20 text-error shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-error mb-1">CNS Warning: Overtraining Risk</h3>
              <p className="text-error/80 text-sm leading-relaxed">
                Your AI Engine detects high recovery strain based on your recent sleep and fatigue logs. 
                Consider taking an active recovery day or dropping your volume by 20% today.
              </p>
            </div>
          </div>
        )}

        <div className="mb-8">
          <MuscleMapSection />
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
                  onClick={() => setLoadTemplateId(t.id)}
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
              onStartWorkout={() => {
                useWorkoutSessionStore.getState().startSession(DAY_NAMES[day.dayIndex])
              }}
            />
          ))}
        </div>

        <div className="mt-8">
          <SpotifyWidget />
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
