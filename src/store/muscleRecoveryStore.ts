// ============================================================
// FORME — Muscle Recovery Store
// ============================================================
// Driven purely by workout log timestamps. No manual check-ins.
// Recovery state is calculated at read-time, not stored — this
// means it is always accurate regardless of when the app is opened.
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getWorkoutLogs } from '@/lib/firebase/dataService'
import type { MuscleGroup } from '@/types'

// ─── Recovery state thresholds ────────────────────────────────
// Based on standard sports science recovery windows:
// < 24h  → Fatigued (RED)   — muscle is still acutely stressed
// 24-48h → Recovering (ORANGE) — protein synthesis peak window
// 48-72h → Fresh (GREEN)    — ready for full stimulus again
// > 72h  → Untrained (GREY) — no recent data

export type RecoveryStatus = 'fatigued' | 'recovering' | 'fresh' | 'untrained'

export interface MuscleRecoveryData {
  muscle: MuscleGroup
  status: RecoveryStatus
  /** Unix timestamp of the last set logged for this muscle */
  lastTrainedAt: number | null
  /** Hours since last trained, null if never */
  hoursSinceTrained: number | null
  /** 0-100, where 100 = fully fresh */
  recoveryPercent: number
  /** Estimated Unix timestamp when muscle will be fully fresh */
  estimatedReadyAt: number | null
  /** Total volume (kg) from the last session this muscle appeared in */
  lastSessionVolume: number
  /** Whether this muscle was primary or secondary in last session */
  wasPrimary: boolean
}

export interface MuscleTrainingRecord {
  muscle: MuscleGroup
  trainedAt: number // Unix timestamp
  volume: number    // kg
  isPrimary: boolean
}

interface MuscleRecoveryState {
  /** Raw training records, keyed by muscle. Only the most recent per muscle is kept. */
  records: Partial<Record<MuscleGroup, MuscleTrainingRecord>>
  isLoading: boolean
  lastSyncedAt: number | null

  // ── Actions ──
  /** Called by workoutSessionStore.endSession() — records training timestamps */
  recordSession: (muscles: { muscle: MuscleGroup; isPrimary: boolean }[], volume: number, timestamp: number) => void
  /** Syncs records from the last 7 days of Firestore workout logs */
  syncFromLogs: (uid: string) => Promise<void>

  // ── Derived getters (computed at read-time) ──
  getRecoveryData: (muscle: MuscleGroup) => MuscleRecoveryData
  getAllRecoveryData: () => MuscleRecoveryData[]
  getMuscleStatus: (muscle: MuscleGroup) => RecoveryStatus
}

// ─── Pure recovery calculation ────────────────────────────────

function calculateRecovery(record: MuscleTrainingRecord | undefined): Omit<MuscleRecoveryData, 'muscle'> {
  if (!record) {
    return {
      status: 'untrained',
      lastTrainedAt: null,
      hoursSinceTrained: null,
      recoveryPercent: 100,
      estimatedReadyAt: null,
      lastSessionVolume: 0,
      wasPrimary: false,
    }
  }

  const now = Date.now()
  const hoursSinceTrained = (now - record.trainedAt) / (1000 * 60 * 60)

  // Primary muscles take longer to recover than secondary
  const fullRecoveryHours = record.isPrimary ? 72 : 48

  const recoveryPercent = Math.min(100, Math.round((hoursSinceTrained / fullRecoveryHours) * 100))

  let status: RecoveryStatus
  if (hoursSinceTrained < 24) {
    status = 'fatigued'
  } else if (hoursSinceTrained < 48) {
    status = 'recovering'
  } else {
    status = 'fresh'
  }

  const estimatedReadyAt = record.trainedAt + fullRecoveryHours * 60 * 60 * 1000

  return {
    status,
    lastTrainedAt: record.trainedAt,
    hoursSinceTrained,
    recoveryPercent,
    estimatedReadyAt,
    lastSessionVolume: record.volume,
    wasPrimary: record.isPrimary,
  }
}

// All 15 muscle groups in display order
export const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'shoulders', 'biceps', 'triceps', 'forearms',
  'traps', 'lats', 'rear_delts', 'back',
  'core', 'quads', 'hamstrings', 'glutes', 'calves', 'full_body',
]

export const MUSCLE_DISPLAY_NAMES: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  core: 'Core',
  full_body: 'Full Body',
  forearms: 'Forearms',
  traps: 'Traps',
  lats: 'Lats',
  rear_delts: 'Rear Delts',
}

export const RECOVERY_COLORS: Record<RecoveryStatus, string> = {
  fatigued: '#EF4444',
  recovering: '#F97316',
  fresh: '#10B981',
  untrained: '#374151',
}

export const RECOVERY_GLOW_COLORS: Record<RecoveryStatus, string> = {
  fatigued: 'rgba(239, 68, 68, 0.6)',
  recovering: 'rgba(249, 115, 22, 0.6)',
  fresh: 'rgba(16, 185, 129, 0.6)',
  untrained: 'rgba(55, 65, 81, 0.2)',
}

// ─── Store implementation ─────────────────────────────────────

export const useMuscleRecoveryStore = create<MuscleRecoveryState>()(
  persist(
    (set, get) => ({
      records: {},
      isLoading: false,
      lastSyncedAt: null,

      recordSession: (muscles, volume, timestamp) => {
        const { records } = get()
        const updated = { ...records }

        muscles.forEach(({ muscle, isPrimary }) => {
          const existing = updated[muscle]
          // Only update if this session is more recent
          if (!existing || timestamp > existing.trainedAt) {
            updated[muscle] = {
              muscle,
              trainedAt: timestamp,
              volume,
              isPrimary,
            }
          }
        })

        set({ records: updated })
      },

      syncFromLogs: async (uid) => {
        set({ isLoading: true })
        try {
          const logs = await getWorkoutLogs(uid, 7)
          const { records } = get()
          const updated = { ...records }

          // Walk logs newest-first, update records only if newer
          for (const log of logs) {
            const logTimestamp = new Date(log.createdAt).getTime()

            for (const exercise of log.exercises) {
              const volume = exercise.sets.reduce(
                (sum, s) => sum + ((s.weight ?? 0) * s.reps), 0
              )

              // Primary muscle
              const primary = exercise.muscleGroup
              if (!updated[primary] || logTimestamp > updated[primary]!.trainedAt) {
                updated[primary] = {
                  muscle: primary,
                  trainedAt: logTimestamp,
                  volume,
                  isPrimary: true,
                }
              }
            }
          }

          set({ records: updated, lastSyncedAt: Date.now() })
        } catch (err) {
          console.warn('muscleRecoveryStore: sync failed', err)
        } finally {
          set({ isLoading: false })
        }
      },

      getRecoveryData: (muscle) => {
        const record = get().records[muscle]
        return { muscle, ...calculateRecovery(record) }
      },

      getAllRecoveryData: () => {
        return ALL_MUSCLE_GROUPS.map(muscle => {
          const record = get().records[muscle]
          return { muscle, ...calculateRecovery(record) }
        })
      },

      getMuscleStatus: (muscle) => {
        const record = get().records[muscle]
        return calculateRecovery(record).status
      },
    }),
    {
      name: 'forme-muscle-recovery',
      partialize: (state) => ({ records: state.records }),
    }
  )
)
