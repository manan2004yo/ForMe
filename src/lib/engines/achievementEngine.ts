import type { BodyMetrics, FoodLogEntry, UserProfile, WorkoutLogEntry } from '@/types'

export interface AchievementDef {
  id: string
  title: string
  description: string
  icon: string // emoji or identifier
  color: string // tailwind class for glowing bg
  evaluate: (context: EvaluationContext) => boolean
}

export interface EvaluationContext {
  foodLogs: FoodLogEntry[]
  workoutLogs: WorkoutLogEntry[]
  profile: UserProfile
  metrics: BodyMetrics
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_log',
    title: 'First Step',
    description: 'Log your first meal.',
    icon: '🥗',
    color: 'from-green-400 to-emerald-500',
    evaluate: (ctx) => ctx.foodLogs.length > 0
  },
  {
    id: 'protein_master_1',
    title: 'Protein Master',
    description: 'Hit your protein goal.',
    icon: '🥩',
    color: 'from-rose-400 to-red-500',
    evaluate: (ctx) => {
      const target = ctx.metrics.proteinTarget
      return ctx.foodLogs.some(log => log.totals.protein >= target * 0.95) // within 5%
    }
  },
  {
    id: 'streak_3_days',
    title: 'On Fire',
    description: 'Log food for 3 consecutive days.',
    icon: '🔥',
    color: 'from-orange-400 to-red-500',
    evaluate: (ctx) => {
      const uniqueDates = new Set(ctx.foodLogs.map(l => l.date))
      const sortedDates = Array.from(uniqueDates).sort()

      for (let i = 2; i < sortedDates.length; i++) {
        const first = new Date(`${sortedDates[i - 2]}T00:00:00`)
        const second = new Date(`${sortedDates[i - 1]}T00:00:00`)
        const third = new Date(`${sortedDates[i]}T00:00:00`)

        const oneDay = 24 * 60 * 60 * 1000
        if (
          second.getTime() - first.getTime() === oneDay &&
          third.getTime() - second.getTime() === oneDay
        ) {
          return true
        }
      }

      return false
    }
  },
  {
    id: 'first_workout',
    title: 'Iron Pumper',
    description: 'Log your first workout.',
    icon: '💪',
    color: 'from-blue-400 to-indigo-500',
    evaluate: (ctx) => ctx.workoutLogs.length > 0
  },
  {
    id: 'workout_warrior',
    title: 'Workout Warrior',
    description: 'Complete 5 workouts.',
    icon: '🏋️',
    color: 'from-purple-400 to-fuchsia-500',
    evaluate: (ctx) => ctx.workoutLogs.length >= 5
  },

]
