// ============================================================
// FORME — Home Dashboard
// Daily overview: macros, meals, workout, water, streaks, weekly chart
// ============================================================

import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, subDays } from 'date-fns'
import { useUserStore } from '@/store/userStore'
import { useAuthStore } from '@/store/authStore'
import { useFoodLogStore } from '@/store/foodLogStore'
import { useWaterStreakStore } from '@/store/waterStreakStore'
import { Bell, ChevronRight, Flame, Beef, Wheat, Droplets, Zap, Droplet, Plus, Minus, TrendingUp, Trophy } from 'lucide-react'
import {
  BarChart, Bar, XAxis, ResponsiveContainer, Cell
} from 'recharts'
import { ContextSelector } from './ContextSelector'

function MacroRing({ calories, target }: { calories: number; target: number }) {
  const pct = Math.min(1, calories / target)
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - pct)

  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      <svg className="w-full h-full" viewBox="0 0 120 120">
        {/* Track */}
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#E8E7E3" strokeWidth="10" />
        {/* Progress */}
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke={pct > 1 ? '#C0392B' : '#C17B3F'}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="progress-ring transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-heading font-bold text-xl text-text-primary tabular-nums">{Math.round(calories)}</div>
        <div className="text-xs text-text-tertiary">/ {target} kcal</div>
      </div>
    </div>
  )
}

function MacroBar({ label, consumed, target, color }: { label: string; consumed: number; target: number; color: string }) {
  const pct = Math.min(100, (consumed / Math.max(1, target)) * 100)
  return (
    <div className="flex-1">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className="text-xs font-medium text-text-primary tabular-nums">{Math.round(consumed)}g</span>
      </div>
      <div className="macro-bar-container">
        <div className="macro-bar-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="text-[10px] text-text-tertiary mt-0.5">/ {target}g</div>
    </div>
  )
}

function InsightCard({ insight }: { insight: string }) {
  return (
    <div className="card p-4 gradient-bg-warm border-accent/20">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
          <Zap size={14} className="text-white" />
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">{insight}</p>
      </div>
    </div>
  )
}

function WaterTracker() {
  const { waterToday, waterGoal, addWater, removeWater, loadWater } = useWaterStreakStore()

  useEffect(() => {
    loadWater()
  }, [loadWater])

  const pct = Math.min(100, (waterToday / waterGoal) * 100)
  const cups = Array.from({ length: waterGoal }, (_, i) => i < waterToday)

  return (
    <div className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplet size={16} className="text-[#6ABFF4]" />
          <h2 className="font-heading font-semibold text-text-primary">Water Intake</h2>
        </div>
        <span className="text-sm font-medium text-text-primary tabular-nums">
          {waterToday} / {waterGoal} cups
        </span>
      </div>

      {/* Cup grid */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {cups.map((filled, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
              filled ? 'bg-[#6ABFF4]' : 'bg-bg-surface2'
            }`}
          >
            <Droplet
              size={14}
              className={filled ? 'text-white' : 'text-text-tertiary'}
              fill={filled ? 'white' : 'none'}
            />
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-bg-surface2 rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: '#6ABFF4' }}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={removeWater}
          disabled={waterToday === 0}
          className="btn btn-secondary btn-sm flex-1"
          id="water-remove"
        >
          <Minus size={14} /> Remove
        </button>
        <button
          onClick={() => addWater(1)}
          disabled={waterToday >= waterGoal}
          className="btn btn-sm flex-1"
          style={{ background: '#6ABFF4', color: 'white' }}
          id="water-add"
        >
          <Plus size={14} /> Add Cup
        </button>
      </div>

      {waterToday >= waterGoal && (
        <div className="mt-2 text-center text-xs text-[#6ABFF4] font-medium">
          🎉 Goal reached! Great hydration today!
        </div>
      )}
    </div>
  )
}

function StreakCard() {
  const { streak, loadStreak } = useWaterStreakStore()

  useEffect(() => {
    loadStreak()
  }, [loadStreak])

  const flames = Math.min(5, streak.currentStreak)

  return (
    <div className="card p-4 gradient-bg-warm border-accent/20 mb-4">
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 flex-shrink-0">
          <div className="text-2xl">
            {streak.currentStreak === 0 ? '😴' : streak.currentStreak < 3 ? '🔥' : streak.currentStreak < 7 ? '🔥🔥' : '🔥🔥🔥'}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="font-heading font-bold text-2xl text-text-primary tabular-nums">{streak.currentStreak}</span>
            <span className="text-text-secondary text-sm">day streak</span>
          </div>
          <div className="text-xs text-text-tertiary">
            Best: {streak.longestStreak} days · Log food to grow your streak!
          </div>
          {streak.currentStreak > 0 && (
            <div className="flex gap-1 mt-1.5">
              {Array.from({ length: 7 }, (_, i) => (
                <div
                  key={i}
                  className={`w-5 h-2 rounded-full transition-all ${
                    i < Math.min(7, streak.currentStreak) ? 'bg-accent' : 'bg-bg-surface2'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
        <Trophy size={20} className="text-accent/60 flex-shrink-0" />
      </div>
    </div>
  )
}

function WeeklyCalorieChart({ calTarget }: { calTarget: number }) {
  const { entries } = useFoodLogStore()

  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const today = new Date()
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayEntries = entries.filter(e => e.date === dateStr)
      const totalCals = dayEntries.flatMap(e => e.foods).reduce((sum, f) => sum + f.nutrition.calories, 0)
      return {
        day: days[date.getDay()],
        calories: Math.round(totalCals),
        isToday: i === 6,
      }
    })
  }, [entries])

  const maxCal = Math.max(...chartData.map(d => d.calories), calTarget)

  return (
    <div className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-accent" />
          <h2 className="font-heading font-semibold text-text-primary">7-Day Calories</h2>
        </div>
        <span className="text-xs text-text-tertiary">Target: {calTarget}</span>
      </div>

      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: '#9B9B92' }}
              axisLine={false}
              tickLine={false}
            />
            <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.isToday ? '#C17B3F' : entry.calories >= calTarget ? '#2D7A4F' : '#E8C99A'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-2">
        <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#C17B3F' }} />Today
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#2D7A4F' }} />On target
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#E8C99A' }} />Under
        </div>
      </div>
    </div>
  )
}

export function HomeDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { profile, metrics, isDemoMode } = useUserStore()
  const { todayTotals, loadLogs } = useFoodLogStore()
  const { recordActivity } = useWaterStreakStore()

  useEffect(() => {
    if (user) {
      loadLogs(user.uid)
    }
  }, [user, loadLogs])

  const totals = todayTotals()

  // Record streak activity if food has been logged today
  useEffect(() => {
    if (totals.calories > 0) {
      recordActivity()
    }
  }, [totals.calories, recordActivity])

  if (!profile || !metrics) return null

  const todayDate = format(new Date(), 'EEEE, d MMMM')
  const greeting = getGreeting()
  const calPct = Math.round((totals.calories / metrics.caloricTarget) * 100)

  return (
    <div className="page animate-fade-in">
      {/* Header */}
      <div className="page-header flex items-start justify-between">
        <div>
          {isDemoMode && (
            <div className="badge badge-accent mb-2 text-xs">Demo Mode</div>
          )}
          <div className="text-sm text-text-tertiary mb-1">{todayDate}</div>
          <h1 className="font-heading font-bold text-2xl text-text-primary">
            {greeting}, {profile.name.split(' ')[0]} 👋
          </h1>
        </div>
        <button className="btn btn-ghost p-2 rounded-xl" id="home-notifications">
          <Bell size={20} className="text-text-secondary" />
        </button>
      </div>

      {/* Context Selector */}
      <ContextSelector />

      {/* Daily Calories Card */}
      <div className="card p-5 mb-4">
        <div className="flex items-center gap-5">
          <MacroRing calories={totals.calories} target={metrics.caloricTarget} />
          <div className="flex-1">
            <div className="text-sm font-medium text-text-secondary mb-1">Today's Nutrition</div>
            <div className="flex flex-col gap-2">
              <MacroBar label="Protein" consumed={totals.protein} target={metrics.proteinTarget} color="#7C6AF4" />
              {profile.complexityMode !== 'easy' && (
                <>
                  <MacroBar label="Carbs" consumed={totals.carbs} target={metrics.carbTarget} color="#F4A26A" />
                  <MacroBar label="Fat" consumed={totals.fat} target={metrics.fatTarget} color="#6ABFF4" />
                </>
              )}
              {profile.complexityMode === 'precision' && (
                <MacroBar label="Fiber" consumed={totals.fiber} target={metrics.fiberTarget} color="#6AF4A2" />
              )}
            </div>
          </div>
        </div>

        {calPct === 0 && (
          <div className="mt-4 p-3 bg-accent-light rounded-xl">
            <p className="text-sm text-accent-dark">
              🍽️ Nothing logged yet. Start by adding your breakfast!
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => navigate('/eat')}
          id="home-log-food"
          className="card-pressable p-4 text-left"
        >
          <div className="text-2xl mb-2">🥗</div>
          <div className="font-semibold text-text-primary text-sm">Log Food</div>
          <div className="text-xs text-text-tertiary">Track your meals</div>
        </button>
        <button
          onClick={() => navigate('/train')}
          id="home-log-workout"
          className="card-pressable p-4 text-left"
        >
          <div className="text-2xl mb-2">💪</div>
          <div className="font-semibold text-text-primary text-sm">Workout</div>
          <div className="text-xs text-text-tertiary">Today's training</div>
        </button>
      </div>

      {/* Streak Card */}
      <StreakCard />

      {/* Weekly Calorie Chart */}
      <WeeklyCalorieChart calTarget={metrics.caloricTarget} />

      {/* Water Tracker */}
      <WaterTracker />

      {/* Targets Summary (Hidden in Easy Mode) */}
      {profile.complexityMode !== 'easy' && (
        <div className="card p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-text-primary">Your Targets</h2>
            <span className="text-xs text-text-tertiary capitalize">
              {metrics.caloricStrategy === 'deficit' ? '🔥 Cutting' : metrics.caloricStrategy === 'surplus' ? '📈 Bulking' : '⚖️ Maintaining'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Calories', value: metrics.caloricTarget, unit: 'kcal', icon: Flame, color: 'text-accent' },
              { label: 'Protein', value: metrics.proteinTarget, unit: 'g/day', icon: Beef, color: 'macro-protein' },
              { label: 'Carbs', value: metrics.carbTarget, unit: 'g/day', icon: Wheat, color: 'macro-carbs' },
              { label: 'Fat', value: metrics.fatTarget, unit: 'g/day', icon: Droplets, color: 'macro-fat' },
            ].map(({ label, value, unit, icon: Icon, color }) => (
              <div key={label} className="bg-bg-surface2 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon size={12} className={color} />
                  <span className="text-xs text-text-tertiary">{label}</span>
                </div>
                <div className="font-heading font-bold text-lg text-text-primary tabular-nums">{value}</div>
                <div className="text-xs text-text-tertiary">{unit}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Body Stats (Precision Mode / Smart Mode only) */}
      {profile.complexityMode !== 'easy' && (
        <div className="card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-text-primary">Body Stats</h2>
            <button onClick={() => navigate('/progress')} className="text-xs text-accent font-medium">
              View all
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="font-heading font-bold text-xl text-text-primary">{profile.weightKg}</div>
              <div className="text-xs text-text-tertiary">kg</div>
            </div>
            <div className="text-center">
              <div className="font-heading font-bold text-xl text-text-primary">{metrics.bmi}</div>
              <div className="text-xs text-text-tertiary">BMI</div>
            </div>
            {profile.complexityMode === 'precision' && (
              <div className="text-center">
                <div className="font-heading font-bold text-xl text-text-primary">{metrics.tdee}</div>
                <div className="text-xs text-text-tertiary">TDEE</div>
              </div>
            )}
          </div>
          {metrics.bodyFatRange && profile.complexityMode === 'precision' && (
            <div className="mt-3 px-3 py-2 bg-bg-surface2 rounded-xl">
              <div className="text-xs text-text-tertiary">
                Estimated Body Fat: <span className="font-medium text-text-primary">
                  {metrics.bodyFatRange.low}–{metrics.bodyFatRange.high}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Smart Insight */}
      <InsightCard insight={generateInsight(profile, metrics, totals)} />

      {/* Plan shortcuts */}
      <div className="mt-4 flex flex-col gap-2">
        {[
          { label: "View Today's Diet Plan", path: '/plan', emoji: '📋' },
          { label: 'See Workout Plan', path: '/train', emoji: '🏋️' },
          { label: 'Progress & Charts', path: '/progress', emoji: '📊' },
        ].map(({ label, path, emoji }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="card-pressable flex items-center gap-3 p-4"
          >
            <span className="text-xl">{emoji}</span>
            <span className="flex-1 text-sm font-medium text-text-primary text-left">{label}</span>
            <ChevronRight size={16} className="text-text-tertiary" />
          </button>
        ))}
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function generateInsight(profile: any, metrics: any, totals: any): string {
  const calRemaining = metrics.caloricTarget - totals.calories
  const proteinLeft = metrics.proteinTarget - totals.protein

  if (totals.calories === 0) {
    return `Your calorie target is ${metrics.caloricTarget} kcal today. Protein goal: ${metrics.proteinTarget}g. Start with a protein-rich breakfast!`
  }

  if (proteinLeft > 30) {
    return `You're ${Math.round(proteinLeft)}g short of your protein target. Try adding dahi, eggs, or dal to your next meal.`
  }

  if (calRemaining > 400) {
    return `You have ${Math.round(calRemaining)} kcal remaining. A balanced meal of roti + dal + sabzi would fit perfectly.`
  }

  if (calRemaining < -100) {
    return `You've slightly exceeded your target today. That's okay occasionally — stay consistent this week!`
  }

  return `Great work! You're on track for your ${profile.fitnessGoal?.replace(/_/g, ' ')} goal. Keep it up!`
}
