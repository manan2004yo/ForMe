// ============================================================
// FORME — Contextual Insight Card
// ============================================================
// Connects dots between sleep/fatigue check-ins, workout volume,
// and nutrition data to surface meaningful cross-system insights.
// Does NOT make medical claims. Purely observational correlations.
// ============================================================

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Moon, Zap, Utensils } from 'lucide-react'
import { useCnsStore } from '@/store/cnsStore'
import { useFoodLogStore } from '@/store/foodLogStore'
import { useUserStore } from '@/store/userStore'
import { getWorkoutLogs } from '@/lib/firebase/dataService'
import { useAuthStore } from '@/store/authStore'
import { useEffect, useState } from 'react'
import type { WorkoutLogEntry } from '@/types'

interface Insight {
  id: string
  icon: 'sleep' | 'energy' | 'nutrition'
  title: string
  body: string
  sentiment: 'positive' | 'warning' | 'neutral'
}

export function ContextualInsightCard() {
  const { logs: cnsLogs } = useCnsStore()
  const { entries: recentLogs, loadRecentLogs } = useFoodLogStore()
  const { metrics } = useUserStore()
  const { user } = useAuthStore()
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogEntry[]>([])
  const [insights, setInsights] = useState<Insight[]>([])

  useEffect(() => {
    if (!user?.uid) return
    getWorkoutLogs(user.uid, 7).then(setWorkoutLogs)
    loadRecentLogs(user.uid, 7)
  }, [user?.uid, loadRecentLogs])

  useEffect(() => {
    if (!metrics) return
    const generated = generateInsights(Object.values(cnsLogs), recentLogs, workoutLogs, metrics)
    setInsights(generated)
  }, [cnsLogs, recentLogs, workoutLogs, metrics])

  if (insights.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-white/30 uppercase tracking-wider">
        Patterns & Insights
      </h3>
      {insights.map((insight, index) => (
        <motion.div
          key={insight.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
          className={`px-4 py-3 rounded-2xl border ${
            insight.sentiment === 'positive'
              ? 'bg-green-500/5 border-green-500/15'
              : insight.sentiment === 'warning'
              ? 'bg-amber-500/5 border-amber-500/15'
              : 'bg-white/3 border-white/5'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 shrink-0 ${
              insight.sentiment === 'positive' ? 'text-green-400' :
              insight.sentiment === 'warning' ? 'text-amber-400' :
              'text-white/30'
            }`}>
              {insight.icon === 'sleep' && <Moon size={15} />}
              {insight.icon === 'energy' && <Zap size={15} />}
              {insight.icon === 'nutrition' && <Utensils size={15} />}
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-0.5">{insight.title}</p>
              <p className="text-xs text-white/50 leading-relaxed">{insight.body}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Pure insight generation logic ────────────────────────────
// No medical claims. Purely observational pattern detection.

function generateInsights(
  cnsLogs: any[],
  foodLogs: any[],
  workoutLogs: WorkoutLogEntry[],
  metrics: any
): Insight[] {
  const insights: Insight[] = []
  // Sort descending by date
  const sortedCns = [...cnsLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const recentCns = sortedCns.slice(0, 7)
  const recentFood = foodLogs.slice(0, 7)

  // Insight 1 — Low sleep + low workout volume correlation
  if (recentCns.length >= 3) {
    const avgSleep = recentCns.reduce((sum: number, l: any) => sum + (l.sleepHours ?? 7), 0) / recentCns.length
    const recentWorkoutCount = workoutLogs.filter(w => {
      const diff = Date.now() - new Date(w.date).getTime()
      return diff < 7 * 24 * 60 * 60 * 1000
    }).length

    if (avgSleep < 6.5 && recentWorkoutCount < 2) {
      insights.push({
        id: 'sleep_volume',
        icon: 'sleep',
        title: 'Low sleep may be affecting training',
        body: `Your average sleep this week is ${avgSleep.toFixed(1)}h. You have also completed fewer workouts than usual. Prioritising sleep tends to correlate with better training consistency.`,
        sentiment: 'warning',
      })
    } else if (avgSleep >= 7.5 && recentWorkoutCount >= 3) {
      insights.push({
        id: 'sleep_volume_positive',
        icon: 'sleep',
        title: 'Good sleep supporting consistent training',
        body: `${avgSleep.toFixed(1)}h average sleep and ${recentWorkoutCount} workouts this week. Your recovery and training are aligned well.`,
        sentiment: 'positive',
      })
    }
  }

  // Insight 2 — Protein consistency
  if (recentFood.length >= 3 && metrics?.proteinTarget) {
    const daysHitProtein = recentFood.filter(
      (log: any) => log.totals?.protein >= metrics.proteinTarget * 0.9
    ).length
    const ratio = daysHitProtein / recentFood.length

    if (ratio >= 0.7) {
      insights.push({
        id: 'protein_consistent',
        icon: 'nutrition',
        title: 'Strong protein consistency',
        body: `You hit your protein target on ${daysHitProtein} of ${recentFood.length} logged days this week. This is optimal for your goal.`,
        sentiment: 'positive',
      })
    } else if (ratio < 0.4 && recentFood.length >= 4) {
      insights.push({
        id: 'protein_low',
        icon: 'nutrition',
        title: 'Protein consistency needs attention',
        body: `You hit your protein target on only ${daysHitProtein} of ${recentFood.length} logged days. Try adding a high-protein snack like curd, eggs, or soya chunks.`,
        sentiment: 'warning',
      })
    }
  }

  // Insight 3 — High fatigue + high calorie deficit
  if (recentCns.length >= 2 && recentFood.length >= 2 && metrics?.caloricTarget) {
    const avgFatigue = recentCns.reduce((sum: number, l: any) => sum + (l.fatigueLevel ?? 3), 0) / recentCns.length
    const avgCalories = recentFood.reduce((sum: number, l: any) => sum + (l.totals?.calories ?? 0), 0) / recentFood.length
    const deficit = metrics.caloricTarget - avgCalories

    if (avgFatigue >= 4 && deficit > 400) {
      insights.push({
        id: 'fatigue_deficit',
        icon: 'energy',
        title: 'Large deficit may be contributing to fatigue',
        body: `Your average intake is ${Math.round(deficit)} kcal below target while fatigue is elevated. Consider a diet break day at maintenance calories.`,
        sentiment: 'warning',
      })
    }
  }

  // Return maximum 3 insights to avoid overwhelming the screen
  return insights.slice(0, 3)
}
