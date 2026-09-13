import type { UserProfile, BodyMetrics, FoodLogEntry, WorkoutLogEntry, WeightEntry } from '@/types'

export interface Insight {
  id: string
  type: 'positive' | 'warning' | 'info'
  title: string
  description: string
}

export function generateInsights(
  profile: UserProfile,
  metrics: BodyMetrics,
  foodLogs: FoodLogEntry[],
  workoutLogs: WorkoutLogEntry[],
  weightHistory: WeightEntry[]
): Insight[] {
  const insights: Insight[] = []

  // 1. Protein Adherence
  if (foodLogs.length > 0) {
    const recentLogs = foodLogs.slice(-7) // Last 7 days
    let daysHitProtein = 0
    recentLogs.forEach(log => {
      if (log.totals.protein >= metrics.proteinTarget * 0.9) {
        daysHitProtein++
      }
    })

    if (daysHitProtein >= 5) {
      insights.push({
        id: 'protein_streak',
        type: 'positive',
        title: 'Protein Master',
        description: `You hit your protein goal on ${daysHitProtein} of the last ${recentLogs.length} days! This is optimal for muscle retention.`,
      })
    } else if (daysHitProtein <= 2 && recentLogs.length >= 3) {
      insights.push({
        id: 'protein_low',
        type: 'warning',
        title: 'Protein is Low',
        description: `You missed your protein goal on ${recentLogs.length - daysHitProtein} recent days. Try adding a protein shake or lean meats.`,
      })
    }
  }

  // 2. Workout Consistency
  if (workoutLogs.length > 0) {
    const last7DaysWorkouts = workoutLogs.filter(w => {
      const diff = new Date().getTime() - new Date(w.date).getTime()
      return diff < 7 * 24 * 60 * 60 * 1000
    })

    if (last7DaysWorkouts.length >= profile.trainingDays.length) {
      insights.push({
        id: 'workout_consistent',
        type: 'positive',
        title: 'Consistency is Key',
        description: `You completed all ${last7DaysWorkouts.length} planned workouts this week. Great job staying disciplined!`,
      })
    }
  }

  // 3. Weight Trend Analysis
  if (weightHistory.length >= 4) {
    const recent = weightHistory.slice(0, 4).map(e => e.weightKg)
    const avg1 = (recent[0] + recent[1]) / 2 // Latest 2
    const avg2 = (recent[2] + recent[3]) / 2 // Previous 2
    const diff = avg1 - avg2

    if (metrics.caloricStrategy === 'deficit' && diff < -0.2) {
      insights.push({
        id: 'weight_cutting',
        type: 'positive',
        title: 'On Track for Fat Loss',
        description: `Your weight is trending down by ${Math.abs(diff).toFixed(1)}kg. Your current calorie deficit is working perfectly.`,
      })
    } else if (metrics.caloricStrategy === 'surplus' && diff > 0.2) {
      insights.push({
        id: 'weight_bulking',
        type: 'positive',
        title: 'On Track for Muscle Gain',
        description: `Your weight is trending up by ${diff.toFixed(1)}kg. You are successfully in a caloric surplus.`,
      })
    } else if (metrics.caloricStrategy === 'deficit' && diff > 0.3) {
      insights.push({
        id: 'weight_plateau',
        type: 'warning',
        title: 'Weight Spike Detected',
        description: `Your weight trended up recently despite cutting. Ensure you are accurately tracking sauces and cooking oils.`,
      })
    }
  }

  // Fallback if no insights generated yet
  if (insights.length === 0) {
    insights.push({
      id: 'keep_logging',
      type: 'info',
      title: 'Keep Logging Data',
      description: 'Log your food, weight, and workouts consistently for a few days to unlock smart AI insights about your progress.',
    })
  }

  return insights
}
