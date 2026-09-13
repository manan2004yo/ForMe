// ============================================================
// FORME — Progress Dashboard
// Premium Redesign
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { useUserStore } from '@/store/userStore'
import { useAuthStore } from '@/store/authStore'
import { useProgressStore } from '@/store/progressStore'
import { useFoodLogStore } from '@/store/foodLogStore'
import { generateTrajectory } from '@/lib/calculations/bodyMetrics'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { TrendingDown, TrendingUp, Minus, Plus, Check, Flame } from 'lucide-react'
import { format, subDays } from 'date-fns'
import { StatCard, AnimatedNumber, ProgressBar } from '@/components/shared'
import { Button } from '@/components/ui'
import { MeasurementsChart } from './MeasurementsChart'
import { MacroTrendsChart } from './MacroTrendsChart'
import { VolumeChart } from './VolumeChart'
import { generateInsights } from '@/lib/engines/insightsEngine'
import { Sparkles, AlertCircle, Info } from 'lucide-react'

interface WeightLogEntry {
  date: string
  weight: number
}

function generateDemoHistory(startWeight: number, goal: string, weeks = 8): WeightLogEntry[] {
  const entries: WeightLogEntry[] = []
  const now = new Date()
  const weeklyChange = goal.includes('lose') || goal.includes('lean') || goal === 'body_recomposition' ? -0.3 : 0.2

  for (let i = weeks; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i * 7)
    const noise = (Math.random() - 0.5) * 0.6
    const weight = Math.max(40, startWeight + weeklyChange * (weeks - i) + noise)
    entries.push({
      date: date.toISOString().split('T')[0],
      weight: parseFloat(weight.toFixed(1)),
    })
  }
  return entries
}

function TrajectoryCard({ profile, metrics }: { profile: any; metrics: any }) {
  const trajectory = generateTrajectory(profile, metrics, [3, 6, 12, 18, 24])
  const chartData = [
    { month: 'Now', weight: profile.weightKg, expected: profile.weightKg, conservative: profile.weightKg, excellent: profile.weightKg },
    ...trajectory.map(t => ({
      month: `${t.month}m`,
      expected: t.expected.weightKg,
      conservative: t.conservative.weightKg,
      excellent: t.excellent.weightKg,
    }))
  ]

  return (
    <StatCard className="mb-4 " style={{ animationDelay: '100ms' }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-section text-text-primary">Weight Trajectory</h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 text-caption">
            <div className="w-3 h-1 bg-status-good rounded" /> Expected
          </div>
          <div className="flex items-center gap-1.5 text-caption">
            <div className="w-3 h-1 bg-border-strong rounded" /> Range
          </div>
        </div>
      </div>
      <div className="h-48 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="expectedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--status-good)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--status-good)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-tertiary)', fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
            <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px', boxShadow: 'var(--shadow-floating)' }} labelStyle={{ fontWeight: 600, color: 'var(--text-primary)' }} />
            <Area type="monotone" dataKey="excellent" fill="transparent" stroke="var(--border-strong)" strokeDasharray="4 4" strokeWidth={1.5} />
            <Area type="monotone" dataKey="expected" fill="url(#expectedGrad)" stroke="var(--status-good)" strokeWidth={3} />
            <Area type="monotone" dataKey="conservative" fill="transparent" stroke="var(--border-strong)" strokeDasharray="4 4" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        {trajectory.slice(0, 3).map(t => (
          <div key={t.month} className="bg-bg-surface2 rounded-xl p-3 border border-border">
            <div className="text-micro text-text-tertiary mb-1">{t.month} months</div>
            <div className="text-body font-bold text-text-primary">{t.expected.weightKg} kg</div>
            <div className="text-caption text-text-tertiary">{t.conservative.weightKg}–{t.excellent.weightKg}</div>
          </div>
        ))}
      </div>
    </StatCard>
  )
}

function WeightHistoryChart({ entries }: { entries: WeightLogEntry[] }) {
  return (
    <StatCard className="mb-4 " style={{ animationDelay: '50ms' }}>
      <h2 className="text-section text-text-primary mb-6">Weight History</h2>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={entries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)', fontWeight: 500 }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} dy={10} />
            <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '13px', boxShadow: 'var(--shadow-floating)', fontWeight: 600, color: 'var(--text-primary)' }} formatter={(v: any) => [`${v} kg`, 'Weight']} />
            <Line type="monotone" dataKey="weight" stroke="var(--accent)" strokeWidth={4} activeDot={{ r: 6, fill: 'var(--accent)', stroke: 'var(--bg-surface)', strokeWidth: 3 }} dot={{ r: 4, fill: 'var(--accent)', stroke: 'var(--bg-surface)', strokeWidth: 2 }} style={{ filter: 'drop-shadow(0 4px 6px rgba(193,123,63,0.3))' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </StatCard>
  )
}

function CalorieHeatmap({ calTarget }: { calTarget: number }) {
  const { entries } = useFoodLogStore()
  const days = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const totalCals = entries.filter(e => e.date === dateStr).flatMap(e => e.foods).reduce((sum, f) => sum + f.nutrition.calories, 0)
      let status: 'empty' | 'low' | 'good' | 'over' = 'empty'
      if (totalCals > 0) {
        const pct = totalCals / calTarget
        if (pct >= 0.9 && pct <= 1.1) status = 'good'
        else if (pct < 0.9) status = 'low'
        else status = 'over'
      }
      return { date: dateStr, totalCals, status, isToday: i === 29, dayNum: date.getDate() }
    })
  }, [entries, calTarget])

  const colors = { empty: 'var(--border)', low: 'var(--accent-muted)', good: 'var(--status-good)', over: 'var(--status-warning)' }
  const onTarget = days.filter(d => d.status === 'good').length

  return (
    <StatCard className="mb-4 " style={{ animationDelay: '150ms' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame size={20} className="text-accent" />
          <h2 className="text-section text-text-primary">30-Day Adherence</h2>
        </div>
        <span className="px-3 py-1 bg-status-good/10 text-status-good rounded-pill text-xs font-semibold">{onTarget} days on target</span>
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
        {days.map((day, i) => (
          <div key={i} title={`${day.date}: ${Math.round(day.totalCals)} kcal`} className="aspect-square rounded-[6px] flex items-center justify-center text-[10px] font-bold text-white transition-all shadow-sm" style={{ background: colors[day.status], opacity: day.status === 'empty' ? 0.3 : 1, transform: day.isToday ? 'scale(1.1)' : 'scale(1)' }}>
            {day.dayNum}
          </div>
        ))}
      </div>
    </StatCard>
  )
}

export function ProgressDashboard() {
  const { profile, metrics } = useUserStore()
  const { user } = useAuthStore()
  const { addWeightEntry, addWaistEntry, weightHistory, waistHistory, loadAll } = useProgressStore()
  const [logWeight, setLogWeight] = useState('')
  const [logWaist, setLogWaist] = useState('')
  const [logChest, setLogChest] = useState('')
  const [logArms, setLogArms] = useState('')
  const [logThighs, setLogThighs] = useState('')
  const [logHips, setLogHips] = useState('')
  const [showLogger, setShowLogger] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)

  const { loadRecentLogs } = useFoodLogStore()
  useEffect(() => { 
    if (user) {
      loadAll(user.uid)
      loadRecentLogs(user.uid, 30)
    }
  }, [user, loadAll, loadRecentLogs])
  if (!profile || !metrics) return null

  const history: WeightLogEntry[] = weightHistory.length > 0 ? weightHistory.slice().reverse().map(e => ({ date: e.date, weight: e.weightKg })) : generateDemoHistory(profile.weightKg, profile.fitnessGoal)
  const startWeight = history[0]?.weight || profile.weightKg
  const currentWeight = weightHistory.length > 0 ? weightHistory[0].weightKg : (history[history.length - 1]?.weight || profile.weightKg)
  const totalChange = parseFloat((currentWeight - startWeight).toFixed(1))
  const isLosing = totalChange < 0
  const isUsingRealData = weightHistory.length > 0
  const weeklyGoal = metrics.caloricStrategy === 'deficit' ? -0.4 : metrics.caloricStrategy === 'surplus' ? 0.25 : 0

  const { entries: foodLogs } = useFoodLogStore()
  const { workoutLogs } = useProgressStore()
  const insights = useMemo(() => generateInsights(profile, metrics, foodLogs, workoutLogs, weightHistory), [profile, metrics, foodLogs, workoutLogs, weightHistory])

  return (
    <div className="page bg-bg">
      <div className="page-header flex flex-col mb-6">
        <h1 className="text-display text-text-primary">Your Progress <span className="drop-shadow-sm">📊</span></h1>
        <div className="flex items-center justify-between mt-2">
          <p className="text-label text-text-secondary">
            {metrics.caloricStrategy === 'deficit' ? '🔥 Cutting' : metrics.caloricStrategy === 'surplus' ? '📈 Bulking' : '⚖️ Recomping'} · ~{Math.abs(weeklyGoal)} kg/week
          </p>
          <Button onClick={() => setShowLogger(s => !s)} variant="accent" size="sm" className="rounded-pill shadow-soft">
            <Plus size={16} /> Log
          </Button>
        </div>
      </div>

      {showLogger && (
        <StatCard className="mb-6  border-accent">
          <h3 className="text-body font-semibold text-text-primary mb-4">Log Today's Measurements</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-caption text-text-secondary block mb-1">Weight (kg)</label>
              <input type="number" className="w-full bg-bg-surface2 border border-border rounded-xl px-4 py-2.5 text-text-primary outline-none focus:border-accent" placeholder={profile.weightKg.toString()} value={logWeight} onChange={e => setLogWeight(e.target.value)} step="0.1" />
            </div>
            <div>
              <label className="text-caption text-text-secondary block mb-1">Waist (cm)</label>
              <input type="number" className="w-full bg-bg-surface2 border border-border rounded-xl px-4 py-2.5 text-text-primary outline-none focus:border-accent" placeholder={(profile.waistCm || 80).toString()} value={logWaist} onChange={e => setLogWaist(e.target.value)} />
            </div>
            <div>
              <label className="text-caption text-text-secondary block mb-1">Chest (cm)</label>
              <input type="number" className="w-full bg-bg-surface2 border border-border rounded-xl px-4 py-2.5 text-text-primary outline-none focus:border-accent" placeholder="-" value={logChest} onChange={e => setLogChest(e.target.value)} />
            </div>
            <div>
              <label className="text-caption text-text-secondary block mb-1">Arms (cm)</label>
              <input type="number" className="w-full bg-bg-surface2 border border-border rounded-xl px-4 py-2.5 text-text-primary outline-none focus:border-accent" placeholder="-" value={logArms} onChange={e => setLogArms(e.target.value)} />
            </div>
            <div>
              <label className="text-caption text-text-secondary block mb-1">Thighs (cm)</label>
              <input type="number" className="w-full bg-bg-surface2 border border-border rounded-xl px-4 py-2.5 text-text-primary outline-none focus:border-accent" placeholder="-" value={logThighs} onChange={e => setLogThighs(e.target.value)} />
            </div>
            <div>
              <label className="text-caption text-text-secondary block mb-1">Hips (cm)</label>
              <input type="number" className="w-full bg-bg-surface2 border border-border rounded-xl px-4 py-2.5 text-text-primary outline-none focus:border-accent" placeholder="-" value={logHips} onChange={e => setLogHips(e.target.value)} />
            </div>
          </div>
          <Button onClick={async () => {
              const hasData = logWeight || logWaist || logChest || logArms || logThighs || logHips
              if (!hasData) return setShowLogger(false)
              setSaving(true)
              try {
                if (logWeight && user) await addWeightEntry(user.uid, parseFloat(logWeight))
                if ((logWaist || logChest || logArms || logThighs || logHips) && user) {
                  await addWaistEntry(user.uid, parseFloat(logWaist || '0'), undefined, {
                    chestCm: logChest ? parseFloat(logChest) : undefined,
                    armsCm: logArms ? parseFloat(logArms) : undefined,
                    thighsCm: logThighs ? parseFloat(logThighs) : undefined,
                    hipsCm: logHips ? parseFloat(logHips) : undefined
                  })
                }
                setSavedOk(true)
                setTimeout(() => setSavedOk(false), 2000)
                setShowLogger(false); setLogWeight(''); setLogWaist('')
                setLogChest(''); setLogArms(''); setLogThighs(''); setLogHips('');
              } finally { setSaving(false) }
            }} disabled={saving} variant="primary" fullWidth>
            {savedOk ? <><Check size={16} /> Saved!</> : saving ? 'Saving...' : 'Save Measurement'}
          </Button>
        </StatCard>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6 animate-fade-in">
        <StatCard padding="sm" className="flex flex-col justify-center border-l-4 border-l-accent">
          <div className="text-caption text-text-tertiary mb-1">Current Weight</div>
          <div className="flex items-baseline gap-1 mb-1">
            <AnimatedNumber value={currentWeight} className="text-section font-bold text-text-primary" />
            <span className="text-label text-text-secondary">kg</span>
          </div>
          <div className="flex items-center gap-1 text-micro font-medium text-text-secondary">
            {isLosing ? <TrendingDown size={12} className="text-status-good" /> : totalChange > 0 ? <TrendingUp size={12} className="text-status-warning" /> : <Minus size={12} />}
            {`${totalChange >= 0 ? '+' : ''}${totalChange} kg ${isUsingRealData ? 'logged' : ''}`}
          </div>
        </StatCard>
        <StatCard padding="sm" className="flex flex-col justify-center">
          <div className="text-caption text-text-tertiary mb-1">Target</div>
          <div className="flex items-baseline gap-1 mb-1">
            <AnimatedNumber value={metrics.caloricTarget} className="text-section font-bold text-text-primary" />
            <span className="text-label text-text-secondary">kcal</span>
          </div>
          <div className="text-micro font-medium text-text-secondary">{metrics.deficitOrSurplus} kcal {metrics.caloricStrategy}</div>
        </StatCard>
      </div>

      <div className="mb-6 space-y-3">
        {insights.map(insight => (
          <StatCard key={insight.id} variant="insight" padding="md" className="flex items-start gap-3 border-l-4" style={{ 
            borderLeftColor: insight.type === 'positive' ? 'var(--status-good)' : insight.type === 'warning' ? 'var(--status-warning)' : 'var(--accent)' 
          }}>
            <div className="mt-0.5">
              {insight.type === 'positive' && <Sparkles size={18} className="text-status-good" />}
              {insight.type === 'warning' && <AlertCircle size={18} className="text-status-warning" />}
              {insight.type === 'info' && <Info size={18} className="text-accent" />}
            </div>
            <div>
              <h4 className="text-body font-bold text-text-primary mb-1">{insight.title}</h4>
              <p className="text-caption text-text-secondary leading-relaxed">{insight.description}</p>
            </div>
          </StatCard>
        ))}
      </div>

      <WeightHistoryChart entries={history} />
      <MeasurementsChart entries={waistHistory} />
      <MacroTrendsChart calTarget={metrics.caloricTarget} />
      <CalorieHeatmap calTarget={metrics.caloricTarget} />
      <VolumeChart />
      <TrajectoryCard profile={profile} metrics={metrics} />
    </div>
  )
}
