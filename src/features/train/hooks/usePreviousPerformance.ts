import { useEffect, useState } from 'react'
import { getWorkoutLogs } from '@/lib/firebase/dataService'
import { useAuthStore } from '@/store/authStore'
import type { LoggedSet } from '@/types'

export interface PreviousPerformance {
  date: string
  sets: LoggedSet[]
  totalVolume: number
}

export function usePreviousPerformance(exerciseId: string): PreviousPerformance | null | undefined {
  const { user } = useAuthStore()
  const [data, setData] = useState<PreviousPerformance | null | undefined>(null)

  useEffect(() => {
    if (!user?.uid || !exerciseId) return

    let cancelled = false

    async function fetch() {
      try {
        const logs = await getWorkoutLogs(user!.uid, 30)
        if (cancelled) return

        // Find the most recent log that contains this exercise
        for (const log of logs) {
          const match = log.exercises.find(e => e.exerciseId === exerciseId)
          if (match && match.sets.length > 0) {
            const totalVolume = match.sets.reduce(
              (sum, s) => sum + ((s.weight ?? 0) * s.reps),
              0
            )
            setData({ date: log.date, sets: match.sets, totalVolume })
            return
          }
        }
        // No history found
        setData(undefined)
      } catch {
        setData(undefined)
      }
    }

    fetch()
    return () => { cancelled = true }
  }, [user?.uid, exerciseId])

  return data
}
