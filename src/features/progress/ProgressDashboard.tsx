// ============================================================
// FORME — Progress Dashboard
// Body metrics, weight/waist history, trajectory chart
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { useUserStore } from '@/store/userStore'
import { useAuthStore } from '@/store/authStore'
import { useProgressStore } from '@/store/progressStore'
import { useFoodLogStore } from '@/store/foodLogStore'
import { generateTrajectory } from '@/lib/calculations/bodyMetrics'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts'
import { TrendingDown, TrendingUp, Minus, Plus, Check, Flame } from 'lucide-react'
import { format, subDays } from 'date-fns'

interface WeightLogEntry {
  date: string
  weight: number
}

// Fallback demo data when no real data exists
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

function StatCard({ label, value, unit, trend, sub }: {
  label: string; value: string | number; unit: string; trend?: 'up' | 'down' | 'flat'; sub?: string
}) {
  const TrendIcon = trend === 'down' ? TrendingDown : trend === 'up' ? TrendingUp : Minus
  const trendColor = trend === 'down' ? 'text-success' : trend === 'up' ? 'text-error' : 'text-text-tertiary'

  return (
    <div className="card p-4">
      <div className="text-xs text-text-tertiary mb-1">{label}</div>
      <div className="flex items-baseline gap-1 mb-1">
        <div className="font-heading font-bold text-2xl text-text-primary tabular-nums">{value}</div>
        <div className="text-sm text-text-secondary">{unit}</div>
      </div>
      {sub && <div className="text-xs text-text-secondary">{sub}</div>}
      {trend && <TrendIcon size={14} className={trendColor} />}
    </div>
  )
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
    <div className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-semibold text-text-primary">Weight Trajectory</h2>
        <div className="flex gap-3">
          <div className="flex items-center gap-1 text-xs text-text-tertiary">
            <div className="w-3 h-0.5 bg-success rounded" />
            Expected
          </div>
          <div className="flex items-center gap-1 text-xs text-text-tertiary">
            <div className="w-3 h-0.5 bg-border-strong rounded" />
            Range
          </div>
        </div>
      </div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="expectedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2D7A4F" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#2D7A4F" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E7E3" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9B9B92' }} />
            <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 10, fill: '#9B9B92' }} />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #E8E7E3', borderRadius: '12px', fontSize: '12px' }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Area type="monotone" dataKey="excellent" fill="transparent" stroke="#D4D3CE" strokeDasharray="4 2" strokeWidth={1} />
            <Area type="monotone" dataKey="expected" fill="url(#expectedGrad)" stroke="#2D7A4F" strokeWidth={2} />
            <Area type="monotone" dataKey="conservative" fill="transparent" stroke="#D4D3CE" strokeDasharray="4 2" strokeWidth={1} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {trajectory.slice(0, 3).map(t => (
          <div key={t.month} className="bg-bg-surface2 rounded-xl p-2">
            <div className="text-xs text-text-tertiary">{t.month} months</div>
            <div className="font-medium text-sm text-text-primary">{t.expected.weightKg} kg</div>
            <div className="text-[10px] text-text-tertiary">{t.conservative.weightKg}–{t.excellent.weightKg}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function WeightHistoryChart({ entries }: { entries: WeightLogEntry[] }) {
  return (
    <div className="card p-4 mb-4">
      <h2 className="font-heading font-semibold text-text-primary mb-4">Weight History</h2>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={entries} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E7E3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: '#9B9B92' }}
              tickFormatter={(v) => v.slice(5)}
            />
            <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10, fill: '#9B9B92' }} />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #E8E7E3', borderRadius: '12px', fontSize: '12px' }}
              formatter={(v: any) => [`${v} kg`, 'Weight']}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#C17B3F"
              strokeWidth={2}
              dot={{ r: 3, fill: '#C17B3F', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// 30-Day Calorie Adherence Heatmap
function CalorieHeatmap({ calTarget }: { calTarget: number }) {
  const { entries } = useFoodLogStore()

  const days = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayEntries = entries.filter(e => e.date === dateStr)
      const totalCals = dayEntries.flatMap(e => e.foods).reduce((sum, f) => sum + f.nutrition.calories, 0)
      const isToday = i === 29
      let status: 'empty' | 'low' | 'good' | 'over' = 'empty'
      if (totalCals > 0) {
        const pct = totalCals / calTarget
        if (pct >= 0.9 && pct <= 1.1) status = 'good'
        else if (pct < 0.9) status = 'low'
        else status = 'over'
      }
      return { date: dateStr, totalCals, status, isToday, dayNum: date.getDate() }
    })
  }, [entries, calTarget])

  const colors = {
    empty: '#F5F4F0',
    low: '#FDF3E8',
    good: '#E8F5EE',
    over: '#FDECEA',
  }
  const textColors = {
    empty: '#9B9B92',
    low: '#C17B3F',
    good: '#2D7A4F',
    over: '#C0392B',
  }

  const onTarget = days.filter(d => d.status === 'good').length

  return (
    <div className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-accent" />
          <h2 className="font-heading font-semibold text-text-primary">30-Day Adherence</h2>
        </div>
        <span className="badge badge-success text-xs">{onTarget} days on target</span>
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
        {days.map((day, i) => (
          <div
            key={i}
            title={`${day.date}: ${Math.round(day.totalCals)} kcal`}
            className="aspect-square rounded-md flex items-center justify-center text-[9px] font-medium transition-all"
            style={{
              background: colors[day.status],
              color: textColors[day.status],
              outline: day.isToday ? '2px solid #C17B3F' : 'none',
              outlineOffset: '1px',
            }}
          >
            {day.dayNum}
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3">
        {[{ label: 'On target', color: '#E8F5EE', text: '#2D7A4F' }, { label: 'Under', color: '#FDF3E8', text: '#C17B3F' }, { label: 'Over', color: '#FDECEA', text: '#C0392B' }, { label: 'No data', color: '#F5F4F0', text: '#9B9B92' }].map(({ label, color, text }) => (
          <div key={label} className="flex items-center gap-1 text-[10px] text-text-tertiary">
            <div className="w-3 h-3 rounded-sm" style={{ background: color, outline: '1px solid rgba(0,0,0,0.06)' }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProgressDashboard() {
  const { profile, metrics } = useUserStore()
  const { user } = useAuthStore()
  const { addWeightEntry, addWaistEntry, weightHistory, waistHistory, loadAll } = useProgressStore()
  const [logWeight, setLogWeight] = useState('')
  const [logWaist, setLogWaist] = useState('')
  const [showLogger, setShowLogger] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)

  useEffect(() => {
    if (user) loadAll(user.uid)
  }, [user, loadAll])

  if (!profile || !metrics) return null

  // Use real data if available, otherwise fall back to demo
  const history: WeightLogEntry[] = weightHistory.length > 0
    ? weightHistory.slice().reverse().map(e => ({ date: e.date, weight: e.weightKg }))
    : generateDemoHistory(profile.weightKg, profile.fitnessGoal)

  const startWeight = history[0]?.weight || profile.weightKg
  const currentWeight = weightHistory.length > 0 ? weightHistory[0].weightKg : (history[history.length - 1]?.weight || profile.weightKg)
  const totalChange = parseFloat((currentWeight - startWeight).toFixed(1))
  const isLosing = totalChange < 0
  const isUsingRealData = weightHistory.length > 0

  const weeklyGoal = metrics.caloricStrategy === 'deficit' ? -0.4 : metrics.caloricStrategy === 'surplus' ? 0.25 : 0

  return (
    <div className="page animate-fade-in">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-primary">Your Progress 📊</h1>
          <p className="text-text-secondary text-sm mt-1">
            {metrics.caloricStrategy === 'deficit' ? '🔥 Cutting' : metrics.caloricStrategy === 'surplus' ? '📈 Bulking' : '⚖️ Recomping'}
            {' '}· ~{Math.abs(weeklyGoal)} kg/week
          </p>
        </div>
        <button
          onClick={() => setShowLogger(s => !s)}
          className="btn btn-accent btn-sm"
          id="log-measurement"
        >
          <Plus size={16} />
          Log
        </button>
      </div>

      {/* Log measurements modal */}
      {showLogger && (
        <div className="card p-4 mb-4 border-accent/30 animate-slide-up">
          <h3 className="font-medium text-text-primary mb-3">Log Today's Measurements</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Weight (kg)</label>
              <input
                type="number"
                className="input-field text-sm"
                placeholder={profile.weightKg.toString()}
                value={logWeight}
                onChange={e => setLogWeight(e.target.value)}
                step="0.1"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Waist (cm)</label>
              <input
                type="number"
                className="input-field text-sm"
                placeholder={(profile.waistCm || 80).toString()}
                value={logWaist}
                onChange={e => setLogWaist(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={async () => {
              if (!logWeight && !logWaist) { setShowLogger(false); return }
              setSaving(true)
              try {
                if (logWeight && user) {
                  await addWeightEntry(user.uid, parseFloat(logWeight))
                }
                if (logWaist && user) {
                  await addWaistEntry(user.uid, parseFloat(logWaist))
                }
                setSavedOk(true)
                setTimeout(() => setSavedOk(false), 2000)
                setShowLogger(false)
                setLogWeight('')
                setLogWaist('')
              } finally {
                setSaving(false)
              }
            }}
            disabled={saving}
            className="btn btn-accent btn-sm w-full mt-3"
          >
            {savedOk ? <><Check size={14} /> Saved!</> : saving ? 'Saving...' : 'Save Measurement'}
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard
          label="Current Weight"
          value={currentWeight}
          unit="kg"
          sub={`${totalChange >= 0 ? '+' : ''}${totalChange} kg ${isUsingRealData ? 'logged' : 'from start (demo)'}`}
          trend={isLosing ? 'down' : totalChange > 0 ? 'up' : 'flat'}
        />
        <StatCard
          label="BMI"
          value={metrics.bmi}
          unit=""
          sub={metrics.bmiCategory}
          trend="flat"
        />
        <StatCard
          label="TDEE"
          value={metrics.tdee}
          unit="kcal"
          sub="Total daily energy"
        />
        <StatCard
          label="Target"
          value={metrics.caloricTarget}
          unit="kcal"
          sub={`${metrics.deficitOrSurplus} kcal ${metrics.caloricStrategy}`}
        />
      </div>

      {/* Body Composition */}
      {metrics.estimatedFatMassKg && (
        <div className="card p-4 mb-4">
          <h2 className="font-heading font-semibold text-text-primary mb-3">Body Composition (Estimated)</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-text-secondary">Fat Mass</span>
                <span className="font-medium text-text-primary">{metrics.estimatedFatMassKg} kg</span>
              </div>
              <div className="h-2 bg-bg-surface2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-warning rounded-full"
                  style={{ width: `${(metrics.estimatedFatMassKg / profile.weightKg) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-text-secondary">Lean Mass</span>
                <span className="font-medium text-text-primary">{metrics.estimatedLeanMassKg} kg</span>
              </div>
              <div className="h-2 bg-bg-surface2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-success rounded-full"
                  style={{ width: `${(metrics.estimatedLeanMassKg! / profile.weightKg) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-center">
              <div className="font-heading font-bold text-2xl text-text-primary">
                {metrics.bodyFatRange ? `${metrics.bodyFatRange.low}–${metrics.bodyFatRange.high}` : '—'}
              </div>
              <div className="text-xs text-text-secondary">% Body Fat</div>
              <div className="text-[10px] text-text-tertiary mt-0.5">Estimated</div>
            </div>
          </div>
        </div>
      )}

      {/* Weight History */}
      <WeightHistoryChart entries={history} />

      {/* 30-Day Calorie Adherence Heatmap */}
      <CalorieHeatmap calTarget={metrics.caloricTarget} />

      {/* Trajectory */}
      <TrajectoryCard profile={profile} metrics={metrics} />

      {/* Goals */}
      <div className="card p-4 mb-4">
        <h2 className="font-heading font-semibold text-text-primary mb-3">Macro Targets</h2>
        <div className="flex flex-col gap-2">
          {[
            { label: 'Protein', target: metrics.proteinTarget, unit: 'g/day', color: '#7C6AF4', note: `${(metrics.proteinTarget / profile.weightKg).toFixed(1)}g/kg bodyweight` },
            { label: 'Carbohydrates', target: metrics.carbTarget, unit: 'g/day', color: '#F4A26A', note: 'Adjust based on energy' },
            { label: 'Fat', target: metrics.fatTarget, unit: 'g/day', color: '#6ABFF4', note: '25% of calories' },
            { label: 'Fiber', target: metrics.fiberTarget, unit: 'g/day', color: '#6AF4A2', note: 'Daily minimum' },
          ].map(({ label, target, unit, color, note }) => (
            <div key={label} className="flex items-center gap-3 py-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <div className="flex-1">
                <div className="text-sm font-medium text-text-primary">{label}</div>
                <div className="text-xs text-text-tertiary">{note}</div>
              </div>
              <div className="text-right">
                <div className="font-heading font-bold text-text-primary tabular-nums">{target}</div>
                <div className="text-xs text-text-tertiary">{unit}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
