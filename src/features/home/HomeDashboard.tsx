// ============================================================
// FORME — Home Dashboard
// Premium Redesign
// ============================================================

import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, subDays } from 'date-fns'
import { useUserStore } from '@/store/userStore'
import { useAuthStore } from '@/store/authStore'
import { useFoodLogStore } from '@/store/foodLogStore'
import { useWaterStreakStore } from '@/store/waterStreakStore'
import { Bell, ChevronRight, Flame, Beef, Wheat, Droplets, Zap, Droplet, Plus, Minus, TrendingUp, Trophy } from 'lucide-react'
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts'
import { ContextSelector } from './ContextSelector'
import { AnimatedProgressRing, ProgressBar, StatCard, AnimatedNumber } from '@/components/shared'
import { Button } from '@/components/ui'
import { clsx } from 'clsx'
import { useIntegrationStore } from '@/store/integrationStore'

function MacroBar({ label, consumed, target, colorClass }: { label: string; consumed: number; target: number; colorClass: string }) {
  return (
    <div className="flex-1 flex flex-col gap-1.5 animate-slide-up" style={{ animationFillMode: 'both' }}>
      <div className="flex items-baseline justify-between">
        <span className="text-label text-text-secondary">{label}</span>
        <div className="flex items-baseline gap-1">
          <AnimatedNumber value={consumed} className="font-heading font-bold text-text-primary tabular-nums" />
          <span className="text-micro text-text-tertiary">/ {target}g</span>
        </div>
      </div>
      <ProgressBar value={consumed} max={target} colorClass={colorClass} heightClass="h-1.5" />
    </div>
  )
}

function InsightCard({ insight }: { insight: string }) {
  return (
    <StatCard variant="insight" className="gradient-bg-warm mb-4 border-accent/20 animate-slide-up" style={{ animationDelay: '100ms' }}>
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0 shadow-accent">
          <Zap size={18} className="text-white" />
        </div>
        <p className="text-body text-text-primary font-medium leading-relaxed">{insight}</p>
      </div>
    </StatCard>
  )
}

function WaterTracker() {
  const { waterToday, waterGoal, addWater, removeWater, loadWater } = useWaterStreakStore()

  useEffect(() => {
    loadWater()
  }, [loadWater])

  const cups = Array.from({ length: waterGoal }, (_, i) => i < waterToday)

  return (
    <StatCard className="mb-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#E7F4FE] flex items-center justify-center">
            <Droplet size={16} className="text-[#4CBAF2]" />
          </div>
          <h2 className="text-section text-text-primary">Hydration</h2>
        </div>
        <span className="text-label text-text-secondary">
          <AnimatedNumber value={waterToday} className="text-text-primary font-bold" /> / {waterGoal} cups
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {cups.map((filled, i) => (
          <div
            key={i}
            className={clsx(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300',
              filled ? 'bg-[#4CBAF2] shadow-soft scale-100' : 'bg-bg-surface2 scale-95'
            )}
          >
            <Droplet size={14} className={filled ? 'text-white' : 'text-border-strong'} fill={filled ? 'white' : 'none'} />
          </div>
        ))}
      </div>

      <ProgressBar value={waterToday} max={waterGoal} colorClass="bg-[#4CBAF2]" className="mb-4" />

      <div className="flex gap-2">
        <Button onClick={removeWater} disabled={waterToday === 0} variant="secondary" size="sm" className="flex-1">
          <Minus size={14} /> Remove
        </Button>
        <Button onClick={() => addWater(1)} disabled={waterToday >= waterGoal} size="sm" className="flex-1 bg-[#4CBAF2] hover:bg-[#3FA0D4] text-white border-none shadow-soft">
          <Plus size={14} /> Add Cup
        </Button>
      </div>
    </StatCard>
  )
}

function StreakCard() {
  const { streak, loadStreak } = useWaterStreakStore()

  useEffect(() => {
    loadStreak()
  }, [loadStreak])

  return (
    <StatCard variant="insight" className="gradient-bg-warm mb-4 border-accent/20 animate-slide-up" style={{ animationDelay: '150ms' }}>
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-soft flex-shrink-0">
          <div className="text-2xl animate-pulse">
            {streak.currentStreak === 0 ? '😴' : streak.currentStreak < 3 ? '🔥' : streak.currentStreak < 7 ? '🔥🔥' : '🔥🔥🔥'}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1">
            <AnimatedNumber value={streak.currentStreak} className="text-display text-text-primary" />
            <span className="text-label text-text-secondary">day streak</span>
          </div>
          <div className="text-caption">
            Best: {streak.longestStreak} days · Log food to grow!
          </div>
          {streak.currentStreak > 0 && (
            <div className="flex gap-1.5 mt-2">
              {Array.from({ length: 7 }, (_, i) => (
                <div
                  key={i}
                  className={clsx(
                    'w-6 h-1.5 rounded-full transition-all duration-500',
                    i < Math.min(7, streak.currentStreak) ? 'bg-accent shadow-sm' : 'bg-bg-surface2'
                  )}
                />
              ))}
            </div>
          )}
        </div>
        <Trophy size={24} className="text-accent/40" />
      </div>
    </StatCard>
  )
}

function DailyActivityCard() {
  const { connectedPlatforms, dailyActivity } = useIntegrationStore()

  if (connectedPlatforms.length === 0 || !dailyActivity) return null

  return (
    <StatCard className="mb-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Flame size={16} className="text-orange-500" />
          </div>
          <h2 className="text-section text-text-primary">Daily Activity</h2>
        </div>
        <span className="px-2 py-1 bg-bg-surface2 rounded-md text-micro font-medium text-text-secondary border border-border">
          Synced {format(new Date(dailyActivity.lastSynced), 'HH:mm')}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-bg-surface2 rounded-xl p-3">
          <div className="text-caption text-text-tertiary mb-1">Steps</div>
          <div className="flex items-baseline gap-1">
            <AnimatedNumber value={dailyActivity.steps} className="font-heading font-bold text-text-primary text-xl" />
            <span className="text-micro text-text-tertiary">/ 10k</span>
          </div>
          <ProgressBar value={dailyActivity.steps} max={10000} colorClass="bg-orange-500" heightClass="h-1.5" className="mt-2" />
        </div>
        
        <div className="bg-bg-surface2 rounded-xl p-3">
          <div className="text-caption text-text-tertiary mb-1">Active Cals</div>
          <div className="flex items-baseline gap-1">
            <AnimatedNumber value={dailyActivity.activeCalories} className="font-heading font-bold text-text-primary text-xl" />
            <span className="text-micro text-text-tertiary">kcal</span>
          </div>
          <ProgressBar value={dailyActivity.activeCalories} max={500} colorClass="bg-rose-500" heightClass="h-1.5" className="mt-2" />
        </div>
      </div>
    </StatCard>
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

  return (
    <StatCard className="mb-4 animate-slide-up" style={{ animationDelay: '250ms' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent-light flex items-center justify-center text-accent">
            <TrendingUp size={16} />
          </div>
          <h2 className="text-section text-text-primary">7-Day Trend</h2>
        </div>
        <span className="text-caption">Target: {calTarget}</span>
      </div>

      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-tertiary)', fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
            <Bar dataKey="calories" radius={[6, 6, 0, 0]} maxBarSize={40}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.isToday ? 'var(--accent)' : entry.calories >= calTarget ? 'var(--status-good)' : 'var(--accent-muted)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </StatCard>
  )
}

export function HomeDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { profile, metrics, isDemoMode } = useUserStore()
  const { todayTotals, loadLogs } = useFoodLogStore()
  const { recordActivity } = useWaterStreakStore()

  useEffect(() => {
    if (user) loadLogs(user.uid)
  }, [user, loadLogs])

  const totals = todayTotals()

  useEffect(() => {
    if (totals.calories > 0) recordActivity()
  }, [totals.calories, recordActivity])

  if (!profile || !metrics) return null

  const todayDate = format(new Date(), 'EEEE, d MMMM')
  const greeting = getGreeting()

  return (
    <div className="page bg-bg">
      <div className="page-header flex items-start justify-between mb-6 animate-fade-in">
        <div>
          {isDemoMode && <div className="badge badge-accent mb-2 text-micro">Demo Mode</div>}
          <div className="text-label text-text-tertiary mb-1 uppercase tracking-wider">{todayDate}</div>
          <h1 className="text-display text-text-primary">
            {greeting}, <br/><span className="text-accent">{profile.name.split(' ')[0]}</span> 👋
          </h1>
        </div>
        <button className="w-10 h-10 rounded-full bg-bg-surface border border-border flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors shadow-sm active:scale-95">
          <Bell size={20} />
        </button>
      </div>

      <ContextSelector />

      {/* ONE MOMENT HERO: The Calorie Ring */}
      <StatCard variant="hero" padding="lg" className="mb-4">
        <div className="flex flex-col items-center mb-8 mt-4">
          <AnimatedProgressRing 
            value={totals.calories} 
            max={metrics.caloricTarget}
            size={220}
            strokeWidth={16}
            colorClass="text-accent"
            glow={true}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 w-full">
          <MacroBar label="Protein" consumed={totals.protein} target={metrics.proteinTarget} colorClass="bg-macro-protein" />
          {profile.complexityMode !== 'easy' && (
            <>
              <MacroBar label="Carbs" consumed={totals.carbs} target={metrics.carbTarget} colorClass="bg-macro-carbs" />
              <MacroBar label="Fat" consumed={totals.fat} target={metrics.fatTarget} colorClass="bg-macro-fat" />
            </>
          )}
          {profile.complexityMode === 'precision' && (
            <MacroBar label="Fiber" consumed={totals.fiber} target={metrics.fiberTarget} colorClass="bg-macro-fiber" />
          )}
        </div>
      </StatCard>

      <div className="grid grid-cols-2 gap-3 mb-4 animate-slide-up" style={{ animationDelay: '50ms' }}>
        <StatCard variant="interactive" onClick={() => navigate('/eat')} padding="md">
          <div className="w-10 h-10 rounded-xl bg-[#E8F5EE] flex items-center justify-center mb-3">
            <span className="text-2xl">🥗</span>
          </div>
          <div className="text-label text-text-primary">Log Food</div>
          <div className="text-caption">Track your meals</div>
        </StatCard>
        <StatCard variant="interactive" onClick={() => navigate('/train')} padding="md">
          <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center mb-3">
            <span className="text-2xl">💪</span>
          </div>
          <div className="text-label text-text-primary">Workout</div>
          <div className="text-caption">Today's training</div>
        </StatCard>
      </div>

      <DailyActivityCard />
      <StreakCard />
      <WeeklyCalorieChart calTarget={metrics.caloricTarget} />
      <WaterTracker />
      
      {/* Smart Insight */}
      <InsightCard insight={generateInsight(profile, metrics, totals)} />

      {/* Plan shortcuts */}
      <div className="mt-4 flex flex-col gap-3 pb-8 animate-slide-up" style={{ animationDelay: '300ms' }}>
        {[
          { label: "View Today's Diet Plan", path: '/plan', emoji: '📋' },
          { label: 'See Workout Plan', path: '/train', emoji: '🏋️' },
          { label: 'Progress & Charts', path: '/progress', emoji: '📊' },
        ].map(({ label, path, emoji }) => (
          <StatCard key={path} variant="interactive" onClick={() => navigate(path)} padding="md" className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-bg-surface2 flex items-center justify-center text-xl shadow-sm border border-border">
              {emoji}
            </div>
            <span className="flex-1 text-label text-text-primary">{label}</span>
            <ChevronRight size={18} className="text-text-tertiary" />
          </StatCard>
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

  if (totals.calories === 0) return `Your calorie target is ${metrics.caloricTarget} kcal today. Protein goal: ${metrics.proteinTarget}g. Start with a protein-rich breakfast!`
  if (proteinLeft > 30) return `You're ${Math.round(proteinLeft)}g short of your protein target. Try adding dahi, eggs, or dal to your next meal.`
  if (calRemaining > 400) return `You have ${Math.round(calRemaining)} kcal remaining. A balanced meal of roti + dal + sabzi would fit perfectly.`
  if (calRemaining < -100) return `You've slightly exceeded your target today. That's okay occasionally — stay consistent this week!`
  return `Great work! You're on track for your ${profile.fitnessGoal?.replace(/_/g, ' ')} goal. Keep it up!`
}
