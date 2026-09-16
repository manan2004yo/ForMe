import type { FoodLogEntry, WorkoutLogEntry, UserProfile, BodyMetrics } from '@/types'

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
      // Very basic streak logic: just check if they have at least 3 unique days logged
      const uniqueDates = new Set(ctx.foodLogs.map(l => l.date))
      return uniqueDates.size >= 3
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
  {
    id: 'hydration_hero',
    title: 'Hydration Hero',
    description: 'Connect an integration or log enough data.',
    icon: '💧',
    color: 'from-cyan-400 to-blue-500',
    evaluate: (ctx) => ctx.foodLogs.length >= 10 // placeholder logic for now
  }
]
