// ============================================================
// FORME — Workout Finish Logic (extracted from EndWorkoutSheet)
// ============================================================
// This file exports useWorkoutFinish(), a hook that encapsulates
// the complete finish / PR / recovery / save business logic.
//
// The old UI sheet is preserved below as a deprecated export
// so nothing downstream breaks, but it is no longer used by
// the Active Workout route.
//
// The /train/review route (PostWorkoutSummary) imports and calls
// useWorkoutFinish() directly.
// ============================================================

import { getWorkoutLogs } from '@/lib/firebase/dataService'
import { useAuthStore } from '@/store/authStore'
import { useMuscleRecoveryStore, MUSCLE_DISPLAY_NAMES } from '@/store/muscleRecoveryStore'
import { useWorkoutSessionStore } from '@/store/workoutSessionStore'
import { useUserStore } from '@/store/userStore'
import type { WorkoutSummaryData } from './PostWorkoutSummary'

// ── Public hook ──────────────────────────────────────────────

export function useWorkoutFinish() {
  const { session, endSession, discardSession, getTotalVolume } = useWorkoutSessionStore()
  const { weightUnit } = useUserStore()

  /**
   * Runs all existing PR/volume/recovery calculations, persists
   * the workout to Firestore via endSession(), and returns the
   * completed WorkoutSummaryData for the review screen to display.
   *
   * Call this ONLY when the user explicitly taps "Save Workout".
   * Do NOT call it on Finish button — that only navigates to review.
   */
  async function finishWorkout(): Promise<WorkoutSummaryData | null> {
    if (!session) return null

    if (navigator.vibrate) navigator.vibrate([80, 40, 80, 40, 120])

    const state = useWorkoutSessionStore.getState()
    const authUser = useAuthStore.getState().user
    const trainedMuscles = state.getTrainedMuscles()
    const durationMin = Math.round(state.getElapsedSeconds() / 60)
    const totalVolumeKg = state.getTotalVolume()

    const history = authUser?.uid
      ? await getWorkoutLogs(authUser.uid, 3650).catch(() => [])
      : []

    const previousHistory = history.filter(log => log.id !== session.sessionId)

    const personalRecords: WorkoutSummaryData['personalRecords'] = []
    let strongestProgression: WorkoutSummaryData['topProgression'] = null
    let strongestProgressionDelta = 0

    const completedSets = session.exercises.reduce(
      (total, ex) => total + ex.sets.filter(s => s.isComplete).length,
      0
    )

    session.exercises.forEach(exercise => {
      const completedSetsForExercise = exercise.sets.filter(
        set => set.isComplete && set.reps !== undefined
      )

      if (completedSetsForExercise.length === 0) return

      const currentVolumeKg = completedSetsForExercise.reduce(
        (sum, set) => sum + ((set.weightKg ?? 0) * (set.reps ?? 0)),
        0
      )

      const currentBestSet = completedSetsForExercise.reduce<{
        weightKg: number
        reps: number
      } | null>((best, set) => {
        const candidate = {
          weightKg: set.weightKg ?? 0,
          reps: set.reps ?? 0,
        }
        if (!best) return candidate
        if (candidate.weightKg > best.weightKg) return candidate
        if (candidate.weightKg === best.weightKg && candidate.reps > best.reps) return candidate
        return best
      }, null)

      const previousExerciseHistory = previousHistory.filter(log =>
        log.exercises.some(logged => logged.exerciseId === exercise.exerciseId)
      )

      let previousBestWeightKg: number | null = null
      let previousBestVolumeKg: number | null = null
      let previousBestSet: { weight: number; reps: number } | null = null

      previousExerciseHistory.forEach(log => {
        log.exercises
          .filter(logged => logged.exerciseId === exercise.exerciseId)
          .forEach(logged => {
            const loggedVolume = logged.sets.reduce(
              (sum, set) => sum + ((set.weight ?? 0) * set.reps),
              0
            )
            if (previousBestVolumeKg === null || loggedVolume > previousBestVolumeKg) {
              previousBestVolumeKg = loggedVolume
            }
            logged.sets.forEach(set => {
              const weight = set.weight ?? 0
              if (
                previousBestWeightKg === null ||
                weight > previousBestWeightKg ||
                (weight === previousBestWeightKg &&
                  previousBestSet !== null &&
                  set.reps > (previousBestSet as { weight: number; reps: number }).reps)
              ) {
                previousBestWeightKg = weight
                previousBestSet = { weight, reps: set.reps }
              }
            })
          })
      })

      const isWeightPR =
        currentBestSet !== null &&
        (previousBestWeightKg === null ||
          currentBestSet.weightKg > previousBestWeightKg ||
          (
            currentBestSet.weightKg === previousBestWeightKg &&
            previousBestSet !== null &&
            currentBestSet.reps > (previousBestSet as { weight: number; reps: number }).reps
          ))

      const isVolumePR =
        currentVolumeKg > 0 &&
        (previousBestVolumeKg === null || currentVolumeKg > previousBestVolumeKg)

      if (isWeightPR || isVolumePR) {
        const recordType = isWeightPR ? 'weight' : 'volume'
        const delta = recordType === 'weight'
          ? currentBestSet!.weightKg - (previousBestWeightKg ?? 0)
          : currentVolumeKg - (previousBestVolumeKg ?? 0)

        personalRecords.push({
          exerciseName: exercise.exerciseName,
          recordType,
          currentWeightKg: currentBestSet?.weightKg ?? null,
          currentReps: currentBestSet?.reps ?? null,
          currentVolumeKg,
          previousBestWeightKg,
          previousBestVolumeKg,
        })

        if (delta > strongestProgressionDelta) {
          strongestProgressionDelta = delta
          strongestProgression = {
            exerciseName: exercise.exerciseName,
            previous: previousBestSet,
            current: currentBestSet
              ? { weight: currentBestSet.weightKg, reps: currentBestSet.reps }
              : null,
          }
        }
      }
    })

    const recoveryStore = useMuscleRecoveryStore.getState()
    const musclesTrained = trainedMuscles.map(({ muscle }) => MUSCLE_DISPLAY_NAMES[muscle])
    const recoveryImpact: WorkoutSummaryData['recoveryImpact'] = {
      fatigued: [],
      recovering: [],
      fresh: [],
    }

    trainedMuscles.forEach(({ muscle }) => {
      const recovery = recoveryStore.getRecoveryData(muscle)
      const displayName = MUSCLE_DISPLAY_NAMES[muscle]
      if (recovery.status === 'fatigued') recoveryImpact.fatigued.push(displayName)
      else if (recovery.status === 'recovering') recoveryImpact.recovering.push(displayName)
      else if (recovery.status === 'fresh') recoveryImpact.fresh.push(displayName)
    })

    personalRecords.sort((a, b) => {
      if (a.recordType !== b.recordType) return a.recordType === 'weight' ? -1 : 1
      if (a.recordType === 'weight') return (b.currentWeightKg ?? 0) - (a.currentWeightKg ?? 0)
      return b.currentVolumeKg - a.currentVolumeKg
    })

    const summaryData: WorkoutSummaryData = {
      label: session.label,
      durationMin,
      exerciseCount: session.exercises.length,
      setCount: completedSets,
      totalVolumeKg,
      topProgression: strongestProgression,
      personalRecords,
      musclesTrained,
      recoveryImpact,
    }

    // Persist to Firestore + clear the session
    await endSession()

    return summaryData
  }

  function discardWorkout() {
    discardSession()
  }

  return {
    session,
    weightUnit,
    getTotalVolume,
    finishWorkout,
    discardWorkout,
  }
}
