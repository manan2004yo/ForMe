// ============================================================
// FORME — Active Workout Session Store
// ============================================================
// This store owns the entire lifecycle of a single gym session.
// It is the foundation for Phase 2 (Logger), Phase 3 (Gym Mode
// analytics), and Phase 4 (Muscle Map recovery tracking).
//
// CRITICAL DESIGN DECISIONS:
// 1. Uses Zustand `persist` middleware so an active session
//    survives phone lock, tab navigation, and accidental closes.
// 2. Manages the Screen Wake Lock so the screen never sleeps
//    during an active workout.
// 3. All time tracking uses Unix timestamps (Date.now()), never
//    duration strings, so pause/resume math is always correct.
// ============================================================

import { v4 as uuidv4 } from 'uuid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { saveWorkoutLog } from '@/lib/firebase/dataService'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { useMuscleRecoveryStore } from '@/store/muscleRecoveryStore'
import type { MuscleGroup, WorkoutLogEntry, PlannedExercise } from '@/types'
import type { ExerciseEntry } from '@/lib/data/exerciseDatabase'
import { useTrainStore } from '@/store/trainStore'
import { getExerciseById, getMergedLibrary } from '@/lib/data/exerciseSearch'

// ─── Session-level types ──────────────────────────────────────

/**
 * A single exercise being actively logged in the current session.
 * Distinct from PlannedExercise (the plan) and LoggedExercise
 * (the completed record). This is the in-progress shape.
 */
export interface ActiveExercise {
  /** Unique ID for this instance within the session */
  instanceId: string
  /** References ExerciseEntry.id from the database */
  exerciseId: string
  exerciseName: string
  primaryMuscle: MuscleGroup
  secondaryMuscles: MuscleGroup[]
  /** Sets logged so far. Appended to as the user completes sets. */
  sets: ActiveSet[]
  notes?: string
  /** Default rest duration for this exercise in seconds. User-overridable per session. */
  restSeconds: number
}

/**
 * A single set within an ActiveExercise.
 * weight is stored in KG internally always.
 * The UI layer handles KG/LB display conversion.
 */
export interface ActiveSet {
  setId: string
  setNumber: number
  weightKg?: number
  reps?: number
  /** Unix timestamp when this set was marked complete */
  completedAt?: number
  isComplete: boolean
}

/**
 * The top-level session state.
 */
export interface WorkoutSession {
  sessionId: string
  /** Unix timestamp when startSession() was called */
  startedAt: number
  /**
   * Accumulated paused milliseconds.
   * Add this to (Date.now() - startedAt) to get true elapsed time.
   */
  pausedDurationMs: number
  /**
   * Unix timestamp when the session was paused.
   * Null when the session is running.
   */
  pausedAt: number | null
  /** Optional label e.g. "Push Day", "Chest + Triceps" */
  label: string
  exercises: ActiveExercise[]
}

// ─── Store interface ──────────────────────────────────────────

interface WorkoutSessionState {
  session: WorkoutSession | null
  isActive: boolean

  // ── Session lifecycle ──
  startSession: (label?: string) => void
  startSessionFromPlan: (label: string, plannedExercises: PlannedExercise[]) => void
  pauseSession: () => void
  resumeSession: () => void
  /**
   * Finalises the session, writes a WorkoutLogEntry to Firestore,
   * fires the muscle fatigue update into cnsStore (Phase 4 hook),
   * releases the wake lock, and clears the persisted session state.
   */
  endSession: () => Promise<void>
  /**
   * Discards the session without saving. Prompts for confirmation
   * at the UI layer before calling this.
   */
  discardSession: () => void

  // ── Exercise management ──
  addExercise: (exercise: ExerciseEntry) => void
  removeExercise: (instanceId: string) => void
  reorderExercises: (fromIndex: number, toIndex: number) => void
  
  currentExerciseIndex: number
  setCurrentExerciseIndex: (index: number) => void
  pendingSetCount: number | null
  setPendingSetCount: (count: number | null) => void
  pendingExercise: ExerciseEntry | null
  setPendingExercise: (exercise: ExerciseEntry | null) => void

  // ── Set management ──
  addSet: (instanceId: string) => void
  updateSet: (instanceId: string, setId: string, updates: Partial<Pick<ActiveSet, 'weightKg' | 'reps'>>) => void
  completeSet: (instanceId: string, setId: string) => void
  deleteSet: (instanceId: string, setId: string) => void

  // ── Rest timer ──
  restTimer: {
    isActive: boolean
    remainingSeconds: number
    totalSeconds: number
    exerciseInstanceId: string | null
  } | null
  startRestTimer: (instanceId: string, seconds?: number) => void
  tickRestTimer: () => void
  skipRestTimer: () => void
  setExerciseRestDuration: (instanceId: string, seconds: number) => void

  // ── Derived getters ──
  /** Returns elapsed seconds, accounting for pauses. */
  getElapsedSeconds: () => number
  /**
   * Returns the total volume (kg) for a specific exercise instance.
   * Volume = sum of (weightKg * reps) for all completed sets.
   */
  getExerciseVolume: (instanceId: string) => number
  /** Returns total session volume across all exercises. */
  getTotalVolume: () => number
  /**
   * Returns all muscle groups trained so far in this session,
   * with duplicates removed. Used by Phase 4 to update the
   * muscle map after endSession().
   */
  getTrainedMuscles: () => { muscle: MuscleGroup; isPrimary: boolean }[]
}

// ─── Wake Lock management (module-level, not in store state) ──
// Kept outside Zustand state because WakeLockSentinel is not
// serialisable and must not be persisted.

let wakeLock: WakeLockSentinel | null = null

async function requestWakeLock() {
  if (!('wakeLock' in navigator)) return
  try {
    wakeLock = await navigator.wakeLock.request('screen')
  } catch {
    // Wake lock not available on this device/browser — fail silently
  }
}

function releaseWakeLock() {
  wakeLock?.release()
  wakeLock = null
}

// Re-acquire wake lock if the page becomes visible again
// (the OS releases wake locks when the tab backgrounds)
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const { isActive } = useWorkoutSessionStore.getState()
      if (isActive) requestWakeLock()
    }
  })
}

// ─── Store implementation ─────────────────────────────────────

export const useWorkoutSessionStore = create<WorkoutSessionState>()(
  persist(
    (set, get) => ({
      session: null,
      isActive: false,
      restTimer: null,
      currentExerciseIndex: 0,
      pendingSetCount: null,
      pendingExercise: null,

      setCurrentExerciseIndex: (index) => set({ currentExerciseIndex: index }),
      setPendingSetCount: (count) => set({ pendingSetCount: count }),
      setPendingExercise: (exercise) => set({ pendingExercise: exercise }),

      // ── Session lifecycle ────────────────────────────────────

      startSession: (label = 'Workout') => {
        const session: WorkoutSession = {
          sessionId: uuidv4(),
          startedAt: Date.now(),
          pausedDurationMs: 0,
          pausedAt: null,
          label,
          exercises: [],
        }
        set({ session, isActive: true, currentExerciseIndex: 0 })
        requestWakeLock()
      },

      startSessionFromPlan: (label, plannedExercises) => {
        const session: WorkoutSession = {
          sessionId: uuidv4(),
          startedAt: Date.now(),
          pausedDurationMs: 0,
          pausedAt: null,
          label,
          exercises: [],
        }
        set({ session, isActive: true, currentExerciseIndex: 0 })
        requestWakeLock()

        // Add each planned exercise with its planned sets
        plannedExercises.forEach(planned => {
          const exercise = getExerciseById(planned.exerciseId) ??
            getMergedLibrary(useTrainStore.getState().customExercises)
              .find(e => e.id === planned.exerciseId)
          if (!exercise) return

          useWorkoutSessionStore.getState().addExercise(exercise)
          const exercises = useWorkoutSessionStore.getState().session?.exercises
          const instanceId = exercises ? exercises[exercises.length - 1]?.instanceId : undefined
          if (!instanceId) return

          const setCount = planned.sets ?? 3
          for (let i = 0; i < setCount; i++) {
            useWorkoutSessionStore.getState().addSet(instanceId)
          }
        })
      },

      pauseSession: () => {
        const { session } = get()
        if (!session || session.pausedAt !== null) return
        set({
          session: {
            ...session,
            pausedAt: Date.now(),
          }
        })
        releaseWakeLock()
      },

      resumeSession: () => {
        const { session } = get()
        if (!session || session.pausedAt === null) return
        const additionalPause = Date.now() - session.pausedAt
        set({
          session: {
            ...session,
            pausedDurationMs: session.pausedDurationMs + additionalPause,
            pausedAt: null,
          }
        })
        requestWakeLock()
      },

      endSession: async () => {
        const { session } = get()
        if (!session) return

        releaseWakeLock()

        // Build the canonical WorkoutLogEntry for Firestore
        const logEntry: WorkoutLogEntry = {
          id: session.sessionId,
          userId: useAuthStore.getState().user?.uid ?? 'demo',
          date: new Date(session.startedAt).toISOString().split('T')[0],
          planDayLabel: session.label,
          exercises: session.exercises.map(ex => ({
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
            muscleGroup: ex.primaryMuscle,
            sets: ex.sets
              .filter(s => s.isComplete)
              .map(s => ({
                weight: s.weightKg,
                reps: s.reps ?? 0,
              })),
            notes: ex.notes,
          })),
          durationMin: Math.round(get().getElapsedSeconds() / 60),
          completed: true,
          createdAt: new Date().toISOString(),
        }

        // ── Phase 4: Record muscle recovery data ────────────────────────
        const trainedMuscles = get().getTrainedMuscles()
        const totalVolume = get().getTotalVolume()
        if (trainedMuscles.length > 0) {
          const { recordSession } = useMuscleRecoveryStore.getState()
          recordSession(trainedMuscles, totalVolume, Date.now())
        }

        // Persist to Firestore
        const uid = useAuthStore.getState().user?.uid
        if (uid) {
          try {
            await saveWorkoutLog(uid, logEntry)
            useToastStore.getState().success('Workout saved!')
          } catch {
            useToastStore.getState().error(
              'Workout saved locally. Cloud sync will retry automatically.'
            )
          }
        }

        // Clear session state
        set({ session: null, isActive: false })
      },

      discardSession: () => {
        releaseWakeLock()
        set({ session: null, isActive: false })
      },

      // ── Exercise management ──────────────────────────────────

      addExercise: (exercise: ExerciseEntry) => {
        const { session } = get()
        if (!session) return

        const activeExercise: ActiveExercise = {
          instanceId: uuidv4(),
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          primaryMuscle: exercise.primaryMuscle,
          secondaryMuscles: exercise.secondaryMuscles,
          sets: [],
          notes: undefined,
          restSeconds: exercise.defaultRestSeconds ?? 90,
        }

        const newExercises = [...session.exercises, activeExercise]
        set({
          session: { ...session, exercises: newExercises },
          currentExerciseIndex: newExercises.length - 1,
        })
        
        // Record in recent exercises
        useTrainStore.getState().recordExerciseUsed(exercise.id)
      },

      removeExercise: (instanceId) => {
        const { session } = get()
        if (!session) return
        set({
          session: {
            ...session,
            exercises: session.exercises.filter(e => e.instanceId !== instanceId),
          }
        })
      },

      reorderExercises: (fromIndex, toIndex) => {
        const { session } = get()
        if (!session) return
        const exercises = [...session.exercises]
        const [moved] = exercises.splice(fromIndex, 1)
        exercises.splice(toIndex, 0, moved)
        set({ session: { ...session, exercises } })
      },

      // ── Set management ───────────────────────────────────────

      addSet: (instanceId) => {
        const { session } = get()
        if (!session) return

        const exercise = session.exercises.find(e => e.instanceId === instanceId)
        if (!exercise) return

        const lastSet = exercise.sets[exercise.sets.length - 1]
        const newSet: ActiveSet = {
          setId: uuidv4(),
          setNumber: exercise.sets.length + 1,
          weightKg: lastSet?.weightKg,  // pre-fill from last set
          reps: lastSet?.reps,           // pre-fill from last set
          completedAt: undefined,
          isComplete: false,
        }

        set({
          session: {
            ...session,
            exercises: session.exercises.map(e =>
              e.instanceId === instanceId
                ? { ...e, sets: [...e.sets, newSet] }
                : e
            ),
          }
        })
      },

      updateSet: (instanceId, setId, updates) => {
        const { session } = get()
        if (!session) return
        set({
          session: {
            ...session,
            exercises: session.exercises.map(e =>
              e.instanceId === instanceId
                ? {
                    ...e,
                    sets: e.sets.map(s =>
                      s.setId === setId ? { ...s, ...updates } : s
                    ),
                  }
                : e
            ),
          }
        })
      },

      completeSet: (instanceId, setId) => {
        const { session } = get()
        if (!session) return
        set({
          session: {
            ...session,
            exercises: session.exercises.map(e =>
              e.instanceId === instanceId
                ? {
                    ...e,
                    sets: e.sets.map(s =>
                      s.setId === setId
                        ? { ...s, isComplete: true, completedAt: Date.now() }
                        : s
                    ),
                  }
                : e
            ),
          }
        })
        // Auto-start rest timer after completing a set
        get().startRestTimer(instanceId)
      },

      startRestTimer: (instanceId, seconds) => {
        const { session } = get()
        if (!session) return
        const exercise = session.exercises.find(e => e.instanceId === instanceId)
        const duration = seconds ?? exercise?.restSeconds ?? 90
        set({
          restTimer: {
            isActive: true,
            remainingSeconds: duration,
            totalSeconds: duration,
            exerciseInstanceId: instanceId,
          }
        })
        if (navigator.vibrate) navigator.vibrate(50)
      },

      tickRestTimer: () => {
        const { restTimer } = get()
        if (!restTimer || !restTimer.isActive) return
        if (restTimer.remainingSeconds <= 1) {
          if (navigator.vibrate) navigator.vibrate([100, 50, 100])
          set({ restTimer: null })
          return
        }
        set({
          restTimer: {
            ...restTimer,
            remainingSeconds: restTimer.remainingSeconds - 1,
          }
        })
      },

      skipRestTimer: () => {
        if (navigator.vibrate) navigator.vibrate(30)
        set({ restTimer: null })
      },

      setExerciseRestDuration: (instanceId, seconds) => {
        const { session } = get()
        if (!session) return
        set({
          session: {
            ...session,
            exercises: session.exercises.map(e =>
              e.instanceId === instanceId
                ? { ...e, restSeconds: seconds }
                : e
            ),
          }
        })
      },

      deleteSet: (instanceId, setId) => {
        const { session } = get()
        if (!session) return
        set({
          session: {
            ...session,
            exercises: session.exercises.map(e => {
              if (e.instanceId !== instanceId) return e
              const filtered = e.sets.filter(s => s.setId !== setId)
              // Re-number remaining sets
              const renumbered = filtered.map((s, i) => ({ ...s, setNumber: i + 1 }))
              return { ...e, sets: renumbered }
            }),
          }
        })
      },

      // ── Derived getters ──────────────────────────────────────

      getElapsedSeconds: () => {
        const { session } = get()
        if (!session) return 0
        const now = session.pausedAt ?? Date.now()
        return Math.floor((now - session.startedAt - session.pausedDurationMs) / 1000)
      },

      getExerciseVolume: (instanceId) => {
        const { session } = get()
        if (!session) return 0
        const exercise = session.exercises.find(e => e.instanceId === instanceId)
        if (!exercise) return 0
        return exercise.sets
          .filter(s => s.isComplete && s.weightKg && s.reps)
          .reduce((total, s) => total + (s.weightKg! * s.reps!), 0)
      },

      getTotalVolume: () => {
        const { session } = get()
        if (!session) return 0
        return session.exercises.reduce((total, ex) => {
          return total + ex.sets
            .filter(s => s.isComplete && s.weightKg && s.reps)
            .reduce((exTotal, s) => exTotal + (s.weightKg! * s.reps!), 0)
        }, 0)
      },

      getTrainedMuscles: () => {
        const { session } = get()
        if (!session) return []

        const primarySet = new Set<MuscleGroup>()
        const secondarySet = new Set<MuscleGroup>()

        session.exercises.forEach(ex => {
          if (ex.sets.some(s => s.isComplete)) {
            primarySet.add(ex.primaryMuscle)
            ex.secondaryMuscles.forEach(m => secondarySet.add(m))
          }
        })

        const result: { muscle: MuscleGroup; isPrimary: boolean }[] = []
        primarySet.forEach(muscle => result.push({ muscle, isPrimary: true }))
        // Only add secondary if not already counted as primary
        secondarySet.forEach(muscle => {
          if (!primarySet.has(muscle)) result.push({ muscle, isPrimary: false })
        })

        return result
      },
    }),
    {
      name: 'forme-workout-session',
      // Only persist the session data and isActive flag.
      // Wake lock state is module-level and not serialisable.
      // restTimer intentionally excluded — stale timers must not resume.
      partialize: (state) => ({
        session: state.session,
        isActive: state.isActive,
      }),
    }
  )
)
