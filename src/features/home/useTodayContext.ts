import { useAuthStore } from '@/store/authStore'
import { useCnsStore } from '@/store/cnsStore'
import { useFoodLogStore } from '@/store/foodLogStore'
import { useProgressStore } from '@/store/progressStore'
import { useUserStore } from '@/store/userStore'
import { useWaterStreakStore } from '@/store/waterStreakStore'
import { format } from 'date-fns'
import { useEffect, useMemo } from 'react'
import { Activity, Flame, Heart, RefreshCw, TrendingUp, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// --- Context Contract --------------------------------------------------------

export interface TodayContext {
  date: string
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  user: {
    firstName: string
    fitnessGoal: string
  }
  nutrition: {
    isLogged: boolean
    isSubstantiallyComplete: boolean
    caloriesLogged: number
    caloricTarget: number
    caloriesRemaining: number
    macros: {
      protein: { logged: number, target: number }
      carbs: { logged: number, target: number }
      fat: { logged: number, target: number }
    }
  }
  training: {
    isPlanned: boolean
    isCompleted: boolean
    plannedLabel: string | null
    completedLabel: string | null
  }
  recovery: {
    isKnown: boolean
    sleepHours?: number
  }
  hydration: {
    isKnown: boolean
    waterToday: number
    waterGoal: number
    isSubstantiallyComplete: boolean
  }
}

// --- Priority & Action Model -------------------------------------------------

export type PrimaryActionType = 'log_fuel' | 'train' | 'log_recovery' | 'review_day' | 'hydrate'

export interface PrimaryAction {
  type: PrimaryActionType
  headline: string
  greeting: string
  ctaLabel: string
  ctaSub: string
  targetRoute: string
  icon: LucideIcon
  colorClass: string
}

function getGreetingTime(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const h = new Date().getHours()
  if (h < 5)  return 'night'
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  if (h < 21) return 'evening'
  return 'night'
}

// Deterministic Recommendation Engine
function determinePrimaryAction(ctx: TodayContext): PrimaryAction {
  const { nutrition, training, recovery, user, timeOfDay, hydration } = ctx
  const greetingTime = `Good ${timeOfDay}, ${user.firstName}.`

  // 1. Day Complete
  if (nutrition.isSubstantiallyComplete && training.isCompleted) {
    return {
      type: 'review_day',
      greeting: `Target hit, ${user.firstName}.`,
      headline: 'All systems nominal.',
      ctaLabel: 'Review Protocol',
      ctaSub: "Analyze today's performance",
      targetRoute: '/progress',
      icon: TrendingUp,
      colorClass: 'text-emerald-400'
    }
  }

  // 2. Training Completed, Nutrition Incomplete (Recovery Phase)
  if (training.isCompleted && !nutrition.isSubstantiallyComplete) {
    return {
      type: 'log_fuel',
      greeting: `Session complete, ${user.firstName}.`,
      headline: 'Recovery phase.',
      ctaLabel: 'Log Fuel',
      ctaSub: `${Math.round(nutrition.caloriesRemaining).toLocaleString()} kcal required`,
      targetRoute: '/eat',
      icon: Flame,
      colorClass: 'text-amber-500'
    }
  }

  // 3. Missing basic recovery check in the morning
  if (!recovery.isKnown && timeOfDay === 'morning') {
    return {
      type: 'log_recovery',
      greeting: greetingTime,
      headline: 'System check required.',
      ctaLabel: 'Assess Readiness',
      ctaSub: 'Log sleep and fatigue',
      targetRoute: '/profile', // Fallback route since CNS isn't fully separated in UI yet
      icon: Heart,
      colorClass: 'text-blue-400'
    }
  }

  // 4. Training Planned but not completed
  if (training.isPlanned && !training.isCompleted) {
    return {
      type: 'train',
      greeting: greetingTime,
      headline: 'Training queued.',
      ctaLabel: 'Start Session',
      ctaSub: training.plannedLabel || 'Execute protocol',
      targetRoute: '/train',
      icon: Activity,
      colorClass: 'text-teal-400'
    }
  }

  // 5. Default/Fresh state: Prioritize Fuel if empty
  if (!nutrition.isLogged) {
    return {
      type: 'log_fuel',
      greeting: greetingTime,
      headline: 'Awaiting input.',
      ctaLabel: 'Log Fuel',
      ctaSub: 'Start tracking nutrition',
      targetRoute: '/eat',
      icon: Zap,
      colorClass: 'text-teal-400'
    }
  }

  // 6. Substantially fueled, but no training planned/completed
  if (nutrition.isSubstantiallyComplete && !training.isCompleted) {
    return {
      type: 'train',
      greeting: `Fuel nominal, ${user.firstName}.`,
      headline: 'Ready to train?',
      ctaLabel: 'Initiate Session',
      ctaSub: 'Log your daily activity',
      targetRoute: '/train',
      icon: Activity,
      colorClass: 'text-teal-400'
    }
  }

  // 7. General catch-all (Keep fueling)
  return {
    type: 'log_fuel',
    greeting: greetingTime,
    headline: 'System active.',
    ctaLabel: 'Log Fuel',
    ctaSub: `${Math.round(nutrition.caloriesRemaining).toLocaleString()} kcal remaining`,
    targetRoute: '/eat',
    icon: Flame,
    colorClass: 'text-amber-500'
  }
}

// --- Hook --------------------------------------------------------------------

export function useTodayContext() {
  const { user: authUser } = useAuthStore()
  const { profile, metrics, loadProfile, isLoading: profileLoading, error: profileError } = useUserStore()
  const { todayTotals, loadLogs, entries: foodEntries } = useFoodLogStore()
  const { getTodayLog, fetchLogs: loadCnsLogs } = useCnsStore()
  const { workoutLogs, loadAll: loadProgress } = useProgressStore()
  const { waterToday, waterGoal, loadWater } = useWaterStreakStore()

  useEffect(() => {
    if (authUser) {
      loadProfile(authUser.uid)
      loadLogs(authUser.uid)
      loadCnsLogs(authUser.uid)
      loadProgress(authUser.uid)
      loadWater()
    }
  }, [authUser, loadProfile, loadLogs, loadCnsLogs, loadProgress, loadWater])

  const isLoading = profileLoading || (!profile && !profileError)

  const context = useMemo<TodayContext | null>(() => {
    if (!profile || !metrics) return null

    const todayString = format(new Date(), 'yyyy-MM-dd')
    const timeOfDay = getGreetingTime()
    const firstName = profile.name.split(' ')[0].slice(0, 15)

    // Nutrition
    const totals = todayTotals()
    const hasFood = (totals.calories.value ?? 0) > 0
    const calRem = Math.max(0, metrics.caloricTarget - (totals.calories.value ?? 0))
    const isSubstantiallyComplete = metrics.caloricTarget > 0 && (totals.calories.value ?? 0) >= metrics.caloricTarget * 0.85

    // Training
    const todaysWorkouts = workoutLogs.filter(log => log.date === todayString)
    const completedWorkouts = todaysWorkouts.filter(w => w.completed)
    const plannedWorkouts = todaysWorkouts.filter(w => !w.completed)
    
    // Recovery
    const recoveryLog = getTodayLog()

    return {
      date: todayString,
      timeOfDay,
      user: {
        firstName,
        fitnessGoal: profile.fitnessGoal
      },
      nutrition: {
        isLogged: hasFood,
        isSubstantiallyComplete,
        caloriesLogged: totals.calories.value ?? 0,
        caloricTarget: metrics.caloricTarget,
        caloriesRemaining: calRem,
        macros: {
          protein: { logged: totals.protein.value ?? 0, target: metrics.proteinTarget },
          carbs: { logged: totals.carbs.value ?? 0, target: metrics.carbTarget },
          fat: { logged: totals.fat.value ?? 0, target: metrics.fatTarget }
        }
      },
      training: {
        isPlanned: plannedWorkouts.length > 0,
        isCompleted: completedWorkouts.length > 0,
        plannedLabel: plannedWorkouts[0]?.planDayLabel || null,
        completedLabel: completedWorkouts[0]?.planDayLabel || null
      },
      recovery: {
        isKnown: recoveryLog !== null,
        sleepHours: recoveryLog?.sleepHours
      },
      hydration: {
        isKnown: true,
        waterToday,
        waterGoal,
        isSubstantiallyComplete: waterGoal > 0 && waterToday >= waterGoal * 0.8
      }
    }
  }, [profile, metrics, todayTotals, workoutLogs, getTodayLog, waterToday, waterGoal])

  const action = useMemo<PrimaryAction | null>(() => {
    if (!context) return null
    return determinePrimaryAction(context)
  }, [context])

  return {
    context,
    action,
    isLoading,
    error: profileError,
    retry: () => authUser && loadProfile(authUser.uid)
  }
}
