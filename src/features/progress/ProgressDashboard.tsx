// ============================================================
// FORME - Premium Progress Dashboard
// ============================================================

import { PageTransition } from '@/components/layout/PageTransition'
import { AnimatedNumber } from '@/components/shared'
import { useAuthStore } from '@/store/authStore'
import { useFoodLogStore } from '@/store/foodLogStore'
import { useProgressStore } from '@/store/progressStore'
import { useToastStore } from '@/store/toastStore'
import { useUserStore } from '@/store/userStore'
import { clsx } from 'clsx'
import { format, subDays } from 'date-fns'
import { Activity, BookOpen, Dumbbell, Plus, Save, TrendingDown, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CinematicProgressMorph } from './CinematicProgressMorph'

export function ProgressDashboard() {
  const { user } = useAuthStore()
  const { profile, metrics, loadProfile } = useUserStore()
  const { loadLogs, entriesForDate } = useFoodLogStore()
  const { loadAll, weightHistory, waistHistory, addWeightEntry, addWaistEntry, workoutLogs } = useProgressStore()
  const toast = useToastStore()

  const [logWeight, setLogWeight] = useState('')
  const [logWaist, setLogWaist] = useState('')
  const [isLogging, setIsLogging] = useState(false)
  const [activeTab, setActiveTab] = useState<'weight' | 'measurements'>('weight')
  const [showMorph, setShowMorph] = useState(false)

  useEffect(() => {
    if (user) {
      loadProfile(user.uid)
      loadLogs(user.uid)
      loadAll(user.uid)
    }
  }, [user, loadProfile, loadLogs, loadAll])

  if (!profile || !metrics) return null

  const sortedWeightHistory = [...weightHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const hasWeightData = sortedWeightHistory.length > 0
  const currentWeight = hasWeightData ? sortedWeightHistory[sortedWeightHistory.length - 1].weightKg : profile.weightKg

  const isLosing = profile.fitnessGoal.includes('lose') || profile.fitnessGoal.includes('lean') || profile.fitnessGoal === 'body_recomposition'
  const progressText = isLosing ? 'lost' : 'gained'
  const totalChange = hasWeightData ? Math.abs(currentWeight - sortedWeightHistory[0].weightKg).toFixed(1) : "0.0"

  const handleLogWeight = async () => {
    const w = parseFloat(logWeight)
    if (isNaN(w) || w <= 20 || w >= 300) return
    setIsLogging(true)
    try {
      if (user) {
        await addWeightEntry(user.uid, w)
      }
      setLogWeight('')
      toast.success('Weight logged successfully!')
    } finally {
      setIsLogging(false)
    }
  }

  const handleLogMeasurement = async () => {
    const w = parseFloat(logWaist)
    if (isNaN(w) || w <= 20 || w >= 300) return
    if (!user || user.uid === 'demo') {
      toast.info('Sign up to save your measurements and track progress over time.')
      return
    }
    setIsLogging(true)
    await addWaistEntry(user.uid, w)
    setLogWaist('')
    toast.success('Measurement logged!')
    setIsLogging(false)
  }

  // Nutrition Adherence Logic (last 7 days)
  const targetCals = metrics.caloricTarget || 2000
  let daysHit = 0
  let daysLogged = 0
  
  for(let i=0; i<7; i++) {
    const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
    const dayEntries = entriesForDate(d)
    if (dayEntries.length > 0) {
      daysLogged++
      const cals = dayEntries.reduce((sum, e) => sum + e.foods.reduce((s, f) => s + f.nutrition.calories, 0), 0)
      if (Math.abs(cals - targetCals) / targetCals <= 0.15) {
        daysHit++
      }
    }
  }
  const adherence = daysLogged > 0 ? Math.round((daysHit / daysLogged) * 100) : 0

  const chartData = sortedWeightHistory.map(entry => ({
    date: format(new Date(entry.date), 'MMM d'),
    weight: entry.weightKg
  }))

  const workoutsThisWeek = workoutLogs.filter(log => {
    const diff = new Date().getTime() - new Date(log.createdAt).getTime()
    return diff <= 7 * 24 * 60 * 60 * 1000
  }).length

  return (
    <>
    <PageTransition>
      <div className="page relative">
        <header className="page-header mb-8">
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight">
            Progress
          </h1>
          <p className="text-sm text-white/50 font-medium tracking-wide mt-2">
            Track your body metrics over time
          </p>
        </header>

        {/* Current Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="glass-panel-intense p-6 relative overflow-hidden">
            <div className="text-xs font-medium text-white/50 uppercase tracking-widest mb-2">Current Weight</div>
            <div className="flex items-baseline gap-1 relative z-10">
              <AnimatedNumber value={currentWeight} className="text-3xl font-heading font-bold text-white" />
              <span className="text-white/40">kg</span>
            </div>
            {hasWeightData && (
              <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 w-max px-2 py-1 rounded relative z-10">
                {isLosing ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                {totalChange} kg {progressText}
              </div>
            )}
            <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-x-1/4 translate-y-1/4">
              <Activity size={120} />
            </div>
          </div>
          <button 
            onClick={() => setShowMorph(true)}
            className="glass-panel-intense p-6 relative overflow-hidden group hover:border-accent/30 transition-colors text-left hover:shadow-card-hover"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="text-xs font-medium text-accent uppercase tracking-widest mb-2">Visual Progress</div>
            <div className="text-xl font-heading font-bold text-white leading-tight">
              Cinematic Morph
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-white/50 group-hover:text-accent transition-colors">
              <Plus size={14} className="fill-current" /> Open Viewer
            </div>
          </button>
        </div>

        {/* Action Tabs */}
        <div className="flex gap-2 mb-6 bg-[#121212] p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setActiveTab('weight')}
            className={clsx(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === 'weight' ? "bg-white/10 text-white shadow" : "text-white/50 hover:text-white"
            )}
          >
            Body Weight
          </button>
          <button 
            onClick={() => setActiveTab('measurements')}
            className={clsx(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === 'measurements' ? "bg-white/10 text-white shadow" : "text-white/50 hover:text-white"
            )}
          >
            Measurements
          </button>
        </div>

        {/* Active Tab Content */}
        {activeTab === 'weight' ? (
          <>
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
                className="w-full sm:w-auto px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-all outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {isLogging ? 'Logging...' : 'Log Weight'}
              </button>
            </div>

            <div className="glass-panel-intense p-6 mb-8 min-h-[300px]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-sm font-medium text-white/50 uppercase tracking-widest">Weight Trend</h2>
              </div>
              
              {!hasWeightData ? (
                <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 text-white/20">
                    <TrendingDown size={24} />
                  </div>
                  <h3 className="text-white font-medium mb-1">No weight data yet</h3>
                  <p className="text-sm text-white/40 max-w-xs">Log your first weigh-in above to start tracking your weight trend over time.</p>
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff6b00" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ff6b00" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                        itemStyle={{ color: '#ff6b00', fontWeight: 600 }}
                        labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}
                      />
                      <Area type="monotone" dataKey="weight" stroke="#ff6b00" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" activeDot={{ r: 6, fill: '#ff6b00', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 mb-8">
              <input
                type="number"
                placeholder="Log waist size (cm)"
                value={logWaist}
                onChange={(e) => setLogWaist(e.target.value)}
                className="w-full sm:flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                onClick={handleLogMeasurement}
                disabled={isLogging || !logWaist}
                className="w-full sm:w-auto px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-all outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {isLogging ? 'Logging...' : 'Log Measurement'}
              </button>
            </div>
            
            <div className="glass-panel-intense p-6 mb-8 min-h-[300px]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-sm font-medium text-white/50 uppercase tracking-widest">Waist Trend</h2>
              </div>
              
              {waistHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 text-white/20">
                    <Activity size={24} />
                  </div>
                  <h3 className="text-white font-medium mb-1">No measurements yet</h3>
                  <p className="text-sm text-white/40 max-w-xs">Log your waist measurement above to track changes in your body composition.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {waistHistory.map(entry => (
                    <div key={entry.id} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-white font-medium">{format(new Date(entry.date), 'MMM d, yyyy')}</span>
                      <span className="text-accent font-bold">{entry.waistCm} cm</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Consistency & Adherence */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="glass-panel-intense p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                <Dumbbell size={18} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Workout Consistency</h3>
                <p className="text-xs text-white/40 mt-0.5">Last 7 days</p>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-bold text-white">{workoutsThisWeek}</span>
              <span className="text-white/50 text-sm">workouts completed</span>
            </div>
          </div>
          
          <div className="glass-panel-intense p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                <BookOpen size={18} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Nutrition Adherence</h3>
                <p className="text-xs text-white/40 mt-0.5">Macro targets hit</p>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-bold text-white">{adherence}%</span>
              <span className={clsx("text-sm font-medium", adherence >= 80 ? "text-emerald-400" : "text-amber-400")}>
                {daysHit}/{daysLogged || 7} days on target
              </span>
            </div>
          </div>
        </div>



      </div>
    </PageTransition>
      {showMorph && <CinematicProgressMorph onClose={() => setShowMorph(false)} />}
    </>
  )
}
