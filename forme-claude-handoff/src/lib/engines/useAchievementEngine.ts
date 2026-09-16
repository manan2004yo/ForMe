import { useEffect, useRef } from 'react'
import { useFoodLogStore } from '@/store/foodLogStore'
import { useProgressStore } from '@/store/progressStore'
import { useUserStore } from '@/store/userStore'
import { useAchievementStore } from '@/store/achievementStore'
import { useToastStore } from '@/store/toastStore'
import { ACHIEVEMENTS, type EvaluationContext } from './achievementEngine'

export function useAchievementEngine() {
  const { entries: foodLogs } = useFoodLogStore()
  const { workoutLogs } = useProgressStore()
  const { profile, metrics } = useUserStore()
  const { unlockAchievement, unlockedAchievements } = useAchievementStore()
  const addToast = useToastStore(s => s.addToast)

  // Use a ref to prevent spamming evaluations during rapid renders
  const isEvaluating = useRef(false)

  useEffect(() => {
    if (!profile || !metrics) return
    if (isEvaluating.current) return

    const evaluate = async () => {
      isEvaluating.current = true
      
      const context: EvaluationContext = {
        foodLogs,
        workoutLogs,
        profile,
        metrics
      }

      for (const badge of ACHIEVEMENTS) {
        // Skip if already unlocked
        if (unlockedAchievements.some(a => a.id === badge.id)) {
          continue
        }

        try {
          if (badge.evaluate(context)) {
            const newlyUnlocked = unlockAchievement(badge.id)
            if (newlyUnlocked) {
              addToast(`Achievement Unlocked: ${badge.title} ${badge.icon}`, 'success')
            }
          }
        } catch (e) {
          console.error(`Error evaluating badge ${badge.id}:`, e)
        }
      }

      isEvaluating.current = false
    }

    // Debounce slightly to allow stores to settle
    const timeout = setTimeout(evaluate, 1000)
    return () => clearTimeout(timeout)
  }, [foodLogs, workoutLogs, profile, metrics, unlockedAchievements, unlockAchievement, addToast])
}
