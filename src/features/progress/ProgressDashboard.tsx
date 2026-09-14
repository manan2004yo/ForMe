// ============================================================
// FORME - Premium Progress Dashboard
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { useUserStore } from '@/store/userStore'
import { useAuthStore } from '@/store/authStore'
import { useProgressStore } from '@/store/progressStore'
import { useFoodLogStore } from '@/store/foodLogStore'
import { generateTrajectory } from '@/lib/calculations/bodyMetrics'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { TrendingDown, TrendingUp, Minus, Plus, Check } from 'lucide-react'
import { format, subDays } from 'date-fns'
import { AnimatedNumber } from '@/components/shared'
import { PageTransition } from '@/components/layout/PageTransition'
import { clsx } from 'clsx'

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

export function ProgressDashboard() {
  const { user } = useAuthStore()
  const { profile, metrics, loadProfile } = useUserStore()
  const { loadLogs } = useFoodLogStore()
  const [logWeight, setLogWeight] = useState('')
  const [isLogging, setIsLogging] = useState(false)
  const { addWeightEntry } = useProgressStore()

  useEffect(() => {
    if (user && user.uid !== 'demo') {
      loadProfile(user.uid)
      loadLogs(user.uid)
    }
  }, [user, loadProfile, loadLogs])

  const history = useMemo(() => {
    if (!profile) return []
    return generateDemoHistory(profile.weightKg, profile.fitnessGoal)
  }, [profile])

  const currentWeight = history.length > 0 ? history[history.length - 1].weight : (profile?.weightKg || 0)
  const trajectory = useMemo(() => profile && metrics ? generateTrajectory(profile, metrics) : null, [profile, metrics])

  if (!profile || !metrics) return null

  const isLosing = profile.fitnessGoal.includes('lose') || profile.fitnessGoal.includes('lean') || profile.fitnessGoal === 'body_recomposition'
  const progressText = isLosing ? 'lost' : 'gained'
  const totalChange = Math.abs(currentWeight - history[0].weight).toFixed(1)
  const goalDiff = Math.abs((profile.weightKg - 5) - currentWeight).toFixed(1)

  const handleLogWeight = async () => {
    const w = parseFloat(logWeight)
    if (isNaN(w) || w <= 20 || w >= 300) return
    setIsLogging(true)
    if (user && user.uid !== 'demo') {
      await addWeightEntry(user.uid, w)
    }
    setLogWeight('')
    setIsLogging(false)
  }

  return (
    <PageTransition>
      <div className="page relative">
        <header className="page-header mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-white tracking-tight">
              Progress
            </h1>
            <p className="text-sm text-white/50 font-medium tracking-wide mt-2">
              Track your body metrics over time
            </p>
          </div>
        </header>

        {/* Current Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#121212] border border-white/5 rounded-3xl p-6 shadow-xl">
            <div className="text-xs font-medium text-white/50 uppercase tracking-widest mb-2">Current Weight</div>
            <div className="flex items-baseline gap-1">
              <AnimatedNumber value={currentWeight} className="text-3xl font-heading font-bold text-white" />
              <span className="text-white/40">kg</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 w-max px-2 py-1 rounded">
              {isLosing ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
              {totalChange} kg {progressText}
            </div>
          </div>
          <div className="bg-[#121212] border border-white/5 rounded-3xl p-6 shadow-xl">
            <div className="text-xs font-medium text-white/50 uppercase tracking-widest mb-2">Goal Weight</div>
            <div className="flex items-baseline gap-1">
              <AnimatedNumber value={(profile.weightKg - 5)} className="text-3xl font-heading font-bold text-white" />
              <span className="text-white/40">kg</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-white/40">
              {goalDiff} kg to go
            </div>
          </div>
        </div>

        {/* Log Weight */}
        <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 mb-8">
          <input
            type="number"
            placeholder="Log today's weight (kg)"
            value={logWeight}
            onChange={(e) => setLogWeight(e.target.value)}
            className="w-full sm:flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            onClick={handleLogWeight}
            disabled={isLogging || !logWeight}
            className="w-full sm:w-auto px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-all outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLogging ? 'Logging...' : 'Log Weight'}
          </button>
        </div>

        {/* Weight Chart */}
        <div className="bg-[#121212] border border-white/5 rounded-3xl p-6 shadow-xl mb-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-sm font-medium text-white/50 uppercase tracking-widest">Weight Trend (Demo Data)</h2>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff6b00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ff6b00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => format(new Date(val), 'MMM d')}
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  domain={['dataMin - 2', 'dataMax + 2']} 
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#ff6b00', fontWeight: 'bold' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#ff6b00" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorWeight)" 
                  activeDot={{ r: 6, fill: '#ff6b00', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </PageTransition>
  )
}
