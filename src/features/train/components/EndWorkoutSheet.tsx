import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Trash2, X } from 'lucide-react'
import { getWorkoutLogs } from '@/lib/firebase/dataService'
import { useAuthStore } from '@/store/authStore'
import { useMuscleRecoveryStore, MUSCLE_DISPLAY_NAMES } from '@/store/muscleRecoveryStore'
import { useWorkoutSessionStore } from '@/store/workoutSessionStore'
import { useUserStore, toDisplayWeight } from '@/store/userStore'

import type { WorkoutSummaryData } from './PostWorkoutSummary'

interface EndWorkoutSheetProps {
  isOpen: boolean
  onClose: () => void
  onFinish: (summary: WorkoutSummaryData) => void
}

export function EndWorkoutSheet({ isOpen, onClose, onFinish }: EndWorkoutSheetProps) {
  const { session, endSession, discardSession, getTotalVolume } = useWorkoutSessionStore()
  const { weightUnit } = useUserStore()

  if (!session) return null

  const completedSets = session.exercises.reduce(
    (total, ex) => total + ex.sets.filter(s => s.isComplete).length, 0
  )
  const totalVolume = getTotalVolume()

  async function handleFinish() {
    if (!session) return
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
        if (candidate.weightKg === best.weightKg && candidate.reps > best.reps) {
          return candidate
        }
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

            if (
              previousBestVolumeKg === null ||
              loggedVolume > previousBestVolumeKg
            ) {
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
                previousBestSet = {
                  weight,
                  reps: set.reps,
                }
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
        (previousBestVolumeKg === null ||
          currentVolumeKg > previousBestVolumeKg)

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
              ? {
                  weight: currentBestSet.weightKg,
                  reps: currentBestSet.reps,
                }
              : null,
          }
        }
      }
    })

    const recoveryStore = useMuscleRecoveryStore.getState()

    const musclesTrained = trainedMuscles.map(
      ({ muscle }) => MUSCLE_DISPLAY_NAMES[muscle]
    )

    const recoveryImpact: WorkoutSummaryData['recoveryImpact'] = {
      fatigued: [],
      recovering: [],
      fresh: [],
    }

    trainedMuscles.forEach(({ muscle }) => {
      const recovery = recoveryStore.getRecoveryData(muscle)
      const displayName = MUSCLE_DISPLAY_NAMES[muscle]

      if (recovery.status === 'fatigued') {
        recoveryImpact.fatigued.push(displayName)
      } else if (recovery.status === 'recovering') {
        recoveryImpact.recovering.push(displayName)
      } else if (recovery.status === 'fresh') {
        recoveryImpact.fresh.push(displayName)
      }
    })

    personalRecords.sort((a, b) => {
      if (a.recordType !== b.recordType) {
        return a.recordType === 'weight' ? -1 : 1
      }

      if (a.recordType === 'weight') {
        return (b.currentWeightKg ?? 0) - (a.currentWeightKg ?? 0)
      }

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

    onClose()
    await endSession()
    setTimeout(() => onFinish(summaryData), 300)
  }

  function handleDiscard() {
    discardSession()
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[90] bg-[#111] border-t border-white/10 rounded-t-3xl p-6 pb-10"
          >
            <div className="flex justify-center mb-6">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <h2 className="text-xl font-bold text-white text-center mb-1">Finish Workout?</h2>
            <p className="text-white/40 text-sm text-center mb-6">{session.label}</p>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white/5 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-white tabular-nums">{session.exercises.length}</p>
                <p className="text-xs text-white/40 mt-1">Exercises</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-white tabular-nums">{completedSets}</p>
                <p className="text-xs text-white/40 mt-1">Sets</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-white tabular-nums">
                  {toDisplayWeight(totalVolume, weightUnit).toLocaleString()}
                </p>
                <p className="text-xs text-white/40 mt-1">Volume ({weightUnit})</p>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-accent text-black font-bold text-base mb-3 active:scale-95 transition-all"
            >
              <Trophy size={18} /> Save Workout
            </button>

            <button
              onClick={handleDiscard}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/10 text-red-400 font-semibold text-sm active:scale-95 transition-all"
            >
              <Trash2 size={16} /> Discard Session
            </button>

            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white/30 font-medium text-sm mt-1"
            >
              <X size={14} /> Keep Training
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
