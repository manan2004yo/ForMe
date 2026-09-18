// ============================================================
// FORME - Premium Home Dashboard
// ============================================================

import { PageTransition } from '@/components/layout/PageTransition'
import { AnimatedNumber, ProgressBar } from '@/components/shared'
import { useAuthStore } from '@/store/authStore'
import { useFoodLogStore } from '@/store/foodLogStore'
import { useUserStore } from '@/store/userStore'
import { useWaterStreakStore } from '@/store/waterStreakStore'
import { clsx } from 'clsx'
import { Activity, ArrowRight, Droplet, Flame, Plus, TrendingUp, User } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function MacroBar({ label, consumed, target, colorClass }: { label: string; consumed: number; target: number; colorClass: string }) {
  return (
    <div className="flex-1 flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-white/50 uppercase tracking-wider">{label}</span>
        <div className="flex items-baseline gap-1">
          <AnimatedNumber value={consumed} className="font-heading font-bold text-white tabular-nums text-lg" />
          <span className="text-xs text-white/40">/ {target}g</span>
        </div>
      </div>
      <ProgressBar value={consumed} max={target} colorClass={colorClass} heightClass="h-1.5" className="bg-white/5" />
    </div>
  )
}

function WaterTracker() {
  const { waterToday, waterGoal, addWater, removeWater, loadWater } = useWaterStreakStore()

  useEffect(() => {
    loadWater()
  }, [loadWater])

  const cups = Array.from({ length: waterGoal }, (_, i) => i < waterToday)

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Droplet size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-white font-medium">Hydration</h2>
            <div className="text-sm text-white/40 mt-0.5">Daily Goal: {waterGoal} cups</div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-baseline gap-1 justify-end">
            <AnimatedNumber value={waterToday} className="text-2xl font-bold text-white font-heading" />
            <span className="text-white/40">cups</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {cups.map((filled, i) => (
          <button
            key={i}
            onClick={() => filled && removeWater()}
            disabled={!filled}
            className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-accent',
              filled ? 'bg-blue-500/20 shadow-inner border border-blue-500/30 hover:bg-red-500/20 hover:border-red-500/30 group active:scale-95 cursor-pointer' : 'bg-white/5 border border-white/5 opacity-50 cursor-default'
            )}
            title={filled ? "Click to remove water" : ""}
          >
            <Droplet size={16} className={filled ? 'text-blue-400 group-hover:text-red-400' : 'text-white/20'} fill={filled ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>

      <button 
        onClick={() => addWater(1)} 
        disabled={waterToday >= waterGoal} 
        className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors flex items-center justify-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus size={18} /> Add Water
      </button>
    </div>
  )
}





export function HomeDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { profile, metrics, loadProfile } = useUserStore()
  const { todayTotals, loadLogs } = useFoodLogStore()

  useEffect(() => {
    if (user) {
      loadProfile(user.uid)
      loadLogs(user.uid)
    }
  }, [user, loadProfile, loadLogs])

  if (!profile || !metrics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-3 w-20 bg-white/10 rounded-full mb-2" />
            <div className="h-8 w-40 bg-white/10 rounded-xl" />
          </div>
          <div className="w-10 h-10 bg-white/10 rounded-full" />
        </div>
        <div className="h-56 bg-white/5 rounded-3xl w-full" />
        <div className="h-48 bg-white/5 rounded-2xl w-full" />
        <div className="h-40 bg-white/5 rounded-2xl w-full" />
      </div>
    )
  }

  const totals = todayTotals()
  const calPercent = Math.min(100, Math.round((totals.calories / metrics.caloricTarget) * 100))

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* HEADER */}
        <header className="flex items-center justify-between">
          <div>
            <p className="text-white/50 text-sm font-medium tracking-wider uppercase mb-1">Overview</p>
            <div className="flex items-center gap-3">
              <h1 className="font-heading font-bold text-3xl text-white">
                Hi, {profile.name.split(' ')[0]}
              </h1>
            </div>
          </div>
          <button 
            onClick={() => navigate('/eat')}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent hover:bg-white/10 active:scale-95"
            title="Log Food"
          >
            <Plus size={18} />
          </button>
        </header>

        {/* Nutrition Summary */}
        <section className="glass-panel-intense p-6 md:p-8 mb-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Flame size={20} className="text-accent" />
              Today's Nutrition
            </h2>
            <button 
              onClick={() => navigate('/eat')}
              className="text-sm font-medium text-accent hover:text-white transition-colors flex items-center gap-1 outline-none rounded-md px-2 py-1 focus-visible:ring-2 focus-visible:ring-accent"
            >
              Log Food <ArrowRight size={16} />
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Calorie Ring */}
            <div className="relative w-40 h-40 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="currentColor" 
                  className="text-accent drop-shadow-[0_0_8px_rgba(255,100,0,0.5)] transition-all duration-1000 ease-out" 
                  strokeWidth="6" 
                  strokeLinecap="round"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * calPercent) / 100}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <AnimatedNumber value={totals.calories} className="text-3xl font-heading font-bold text-white tracking-tighter" />
                <span className="text-xs text-white/40 uppercase tracking-widest mt-1">/ {metrics.caloricTarget} kcal</span>
              </div>
            </div>

            {/* Macros */}
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
              <MacroBar label="Protein" consumed={totals.protein} target={metrics.proteinTarget} colorClass="bg-emerald-400" />
              <MacroBar label="Carbs" consumed={totals.carbs} target={metrics.carbTarget} colorClass="bg-blue-400" />
              <MacroBar label="Fats" consumed={totals.fat} target={metrics.fatTarget} colorClass="bg-purple-400" />
            </div>
          </div>
        </section>

        {/* Quick Actions & Hydration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex flex-col gap-6">
            <WaterTracker />
          </div>

          <div className="glass-panel p-6 flex flex-col hover:shadow-card-hover transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Activity size={20} className="text-orange-400" />
              </div>
              <div>
                <h2 className="text-white font-medium">Training</h2>
                <div className="text-sm text-white/40 mt-0.5">Stay consistent</div>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-end gap-3">
              <button 
                onClick={() => navigate('/train')}
                className="w-full py-4 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-all flex items-center justify-between px-6 shadow-lg shadow-accent/20 outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95"
              >
                <span>Log Workout</span>
                <ArrowRight size={20} />
              </button>
              <button 
                onClick={() => navigate('/plan')}
                className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors flex items-center justify-between px-6 outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-95"
              >
                <span>View Diet Plan</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Explore More */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            onClick={() => navigate('/progress')}
            className="glass-panel p-6 flex items-center justify-between hover:shadow-card-hover transition-all duration-300 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-95 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <TrendingUp size={20} />
              </div>
              <div>
                <h2 className="text-white font-medium">View Progress</h2>
                <div className="text-sm text-white/40 mt-0.5">Weight & body metrics</div>
              </div>
            </div>
            <ArrowRight size={20} className="text-white/20 group-hover:text-accent transition-colors group-hover:translate-x-1" />
          </button>

          <button 
            onClick={() => navigate('/profile')}
            className="glass-panel p-6 flex items-center justify-between hover:shadow-card-hover transition-all duration-300 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-95 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-white font-medium">Profile & Goals</h2>
                <div className="text-sm text-white/40 mt-0.5">Manage your settings</div>
              </div>
            </div>
            <ArrowRight size={20} className="text-white/20 group-hover:text-accent transition-colors group-hover:translate-x-1" />
          </button>
        </div>

      </div>
    </PageTransition>
  )
}
