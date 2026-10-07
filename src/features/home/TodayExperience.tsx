// ============================================================
// FORME 2050 - Premium TODAY Experience
// Gate 1B Visual Transformation - Revision 2
// ============================================================

import { PageTransition } from '@/components/layout/PageTransition'
import { useAuthStore } from '@/store/authStore'
import { useCnsStore } from '@/store/cnsStore'
import { useFoodLogStore } from '@/store/foodLogStore'
import { useProgressStore } from '@/store/progressStore'
import { useUserStore } from '@/store/userStore'
import { useWaterStreakStore } from '@/store/waterStreakStore'
import { useTodayContext } from './useTodayContext'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Battery,
  CheckCircle2,
  Droplets,
  Flame,
  TrendingUp,
  Zap,
} from 'lucide-react'

// --- Helpers ------------------------------------------------

function getGreetingTime(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const h = new Date().getHours()
  if (h < 5)  return 'night'
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  if (h < 21) return 'evening'
  return 'night'
}

// --- Energy Nexus Visualization -----------------------------
// Replaces the generic progress ring with a floating, organic energy core.

function EnergyNexus({ value, max }: { value: number; max: number }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t) }, [])

  const pct = max > 0 ? Math.min(1, value / max) : 0
  const complete = pct >= 1

  return (
    <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center shrink-0">
      {/* Outer ambient field */}
      <div 
        className="absolute inset-0 rounded-full transition-all duration-1000 ease-out mix-blend-screen"
        style={{
          background: complete 
            ? 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 70%)',
          transform: mounted ? 'scale(1)' : 'scale(0.8)',
          opacity: mounted ? 1 : 0
        }}
      />
      
      {/* Dynamic Core */}
      <div className="relative w-3/4 h-3/4 flex items-center justify-center">
        {/* Particle/Wave ring 1 */}
        <div 
          className="absolute inset-0 rounded-full border-t border-r border-teal-500/20 mix-blend-screen"
          style={{
            animation: 'spin 12s linear infinite',
            opacity: pct > 0 ? 1 : 0.2
          }}
        />
        {/* Particle/Wave ring 2 (Active energy) */}
        <div 
          className="absolute inset-2 rounded-full border-b border-l border-teal-400/40 mix-blend-screen"
          style={{
            animation: 'spin 8s linear infinite reverse',
            opacity: mounted ? pct * 0.8 + 0.2 : 0,
            borderColor: complete ? 'rgba(52,211,153,0.5)' : 'rgba(45,212,191,0.5)'
          }}
        />
        {/* Core Mass (grows based on pct) */}
        <div 
          className="absolute rounded-full transition-all duration-1000 ease-out mix-blend-screen"
          style={{
            width: mounted ? `${(pct * 60) + 40}%` : '40%',
            height: mounted ? `${(pct * 60) + 40}%` : '40%',
            background: complete
              ? 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 60%)'
              : 'radial-gradient(circle, rgba(20,184,166,0.2) 0%, transparent 60%)',
            boxShadow: complete
              ? '0 0 40px rgba(16,185,129,0.2)'
              : '0 0 30px rgba(20,184,166,0.2)',
          }}
        />

        {/* Data Readout */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <span className="font-heading font-extrabold tabular-nums tracking-tighter text-white drop-shadow-md" style={{ fontSize: '2.5rem', lineHeight: 1 }}>
            {value > 0 ? Math.round(value).toLocaleString() : '0'}
          </span>
          <span className="font-sans font-medium text-white/40 text-[0.65rem] tracking-widest uppercase mt-1">
            / {max > 0 ? max.toLocaleString() : '0'} kcal
          </span>
        </div>
      </div>
    </div>
  )
}

// --- Macro Lines (Borderless) -------------------------------

function MacroLine({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 300); return () => clearTimeout(t) }, [])
  const pct = max > 0 ? Math.min(1, value / max) : 0

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/40">{label}</span>
        <span className="text-[10px] tabular-nums font-semibold text-white/60">{value > 0 ? `${Math.round(value)}g` : '-'}</span>
      </div>
      <div className="h-0.5 w-full bg-white/5 overflow-hidden">
        <div
          className="h-full"
          style={{
            width: mounted ? `${pct * 100}%` : '0%',
            background: color,
            transition: 'width 1s cubic-bezier(0.16,1,0.3,1) 0.3s',
          }}
        />
      </div>
    </div>
  )
}

// --- Hydration Dots (Borderless) ----------------------------

function HydrationNodes() {
  const { waterToday, waterGoal, addWater, removeWater, loadWater } = useWaterStreakStore()
  useEffect(() => { loadWater() }, [loadWater])

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {Array.from({ length: waterGoal }, (_, i) => {
        const filled = i < waterToday
        const isNext = i === waterToday
        return (
          <button
            key={i}
            onClick={() => filled ? removeWater() : isNext ? addWater(1) : undefined}
            disabled={!filled && !isNext}
            className={clsx(
              'w-2 h-2 rounded-full transition-all duration-300',
              filled ? 'bg-teal-400 cursor-pointer shadow-[0_0_8px_rgba(45,212,191,0.5)]' : 
              isNext ? 'bg-white/20 hover:bg-teal-400/50 cursor-pointer' : 
              'bg-white/10 opacity-30 cursor-default'
            )}
            aria-label="Hydration Node"
          />
        )
      })}
      <span className="text-[10px] text-white/30 font-medium ml-2 tabular-nums tracking-widest">
        {waterToday}/{waterGoal}
      </span>
    </div>
  )
}

// --- Typographic CTA (No Box) -------------------------------

function TypographicCTA({ label, sub, onClick, Icon, colorClass }: { label: string; sub: string; onClick: () => void; Icon: any; colorClass: string }) {
  return (
    <button 
      onClick={onClick}
      className="group text-left flex flex-col gap-2 focus-visible:outline-none"
    >
      <div className={clsx("flex items-center gap-3 transition-transform duration-300 group-hover:translate-x-2", colorClass)}>
        <Icon size={28} className="shrink-0" />
        <h2 className="font-heading font-bold text-3xl md:text-4xl tracking-tight leading-none drop-shadow-sm">
          {label}
        </h2>
        <ArrowRight size={28} className="shrink-0 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
      </div>
      <p className="text-sm font-medium text-white/40 tracking-wide pl-10">
        {sub}
      </p>
    </button>
  )
}

// --- Loading & Error States ---------------------------------

function SkeletonEnv() {
  return (
    <div className="animate-pulse min-h-[70vh] p-6 flex flex-col lg:flex-row lg:items-center w-full max-w-7xl mx-auto gap-16 lg:gap-24">
      <div className="flex-1">
        <div className="h-6 w-32 bg-white/5 rounded mb-4" />
        <div className="h-10 w-64 bg-white/5 rounded mb-16" />
        <div className="h-12 w-48 bg-white/5 rounded mb-20" />
      </div>
      <div className="flex-1 flex justify-center"><div className="w-48 h-48 rounded-full bg-white/5" /></div>
    </div>
  )
}

function ErrorEnv({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 gap-4">
      <Zap size={32} className="text-red-500/50" />
      <p className="text-white/60 font-medium">System fault.</p>
      <p className="text-white/30 text-xs">{message}</p>
      {retry && <button onClick={retry} className="mt-4 text-xs font-bold text-teal-400 tracking-widest uppercase">Restart</button>}
    </div>
  )
}

// --- Main Environment ---------------------------------------

export function TodayExperience() {
  const navigate = useNavigate()
  const { context, action, isLoading, error, retry } = useTodayContext()

  if (isLoading) return <PageTransition><SkeletonEnv /></PageTransition>
  if (error || !context || !action) return <PageTransition><ErrorEnv message={error || 'Profile load failed'} retry={retry} /></PageTransition>

  const { nutrition, training, recovery, hydration } = context
  const { ctaLabel, ctaSub, targetRoute, icon: CtaIcon, colorClass, headline, greeting } = action
  const ctaAction = () => navigate(targetRoute)

  return (
    <PageTransition>
      {/* 
        Desktop Composition: 
        A true spatial layout. Left column for narrative/action (Context + CTA). 
        Right column for telemetry (Nexus + Macros + Signals).
        Fills the space naturally, eliminating the "centered mobile view" feel.
      */}
      <div className="flex flex-col lg:flex-row lg:items-center min-h-[calc(100vh-80px)] w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 lg:py-0 gap-16 lg:gap-24">
        
        {/* LEFT PANE: Narrative & Action */}
        <div className="flex-1 flex flex-col justify-center gap-12 lg:gap-20">
          
          <header className="flex flex-col gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
              {greeting}
            </p>
            <h1 className="font-heading font-extrabold text-4xl md:text-5xl lg:text-6xl text-white tracking-tighter leading-[1.1] drop-shadow-sm">
              {headline}
            </h1>
          </header>

          <div className="pt-2">
            <TypographicCTA 
              label={ctaLabel}
              sub={ctaSub}
              onClick={ctaAction}
              Icon={CtaIcon}
              colorClass={colorClass}
            />
          </div>

          {/* Borderless Training Status */}
          <div className="pt-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 mb-4">Training Status</p>
            {training.isCompleted ? (
              <div className="flex items-start gap-4">
                <CheckCircle2 size={20} className="text-emerald-500/70 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white/80">{training.completedLabel || 'Session'} Complete</p>
                  <p className="text-xs text-white/40 mt-1">Data synchronized.</p>
                </div>
              </div>
            ) : training.isPlanned ? (
              <div className="flex items-start gap-4">
                <Activity size={20} className="text-teal-500/70 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white/80">{training.plannedLabel || 'Session'} Queued</p>
                  <button onClick={() => navigate('/train')} className="text-xs font-bold uppercase tracking-widest text-teal-400 mt-2 hover:text-teal-300 transition-colors">Engage</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <Activity size={20} className="text-white/20 shrink-0" />
                <p className="text-sm font-medium text-white/30">No protocols scheduled.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: Telemetry */}
        <div className="flex-1 flex flex-col items-center lg:items-end justify-center gap-12 lg:gap-16 w-full">
          
          {/* Energy Nexus */}
          <EnergyNexus value={nutrition.caloriesLogged} max={nutrition.caloricTarget} />

          {/* Macro Traces */}
          <div className="w-full max-w-sm flex flex-col gap-5">
            {nutrition.isLogged ? (
              <>
                <MacroLine label="Pro" value={nutrition.macros.protein.logged} max={nutrition.macros.protein.target} color="#8b5cf6" />
                <MacroLine label="Carb" value={nutrition.macros.carbs.logged} max={nutrition.macros.carbs.target} color="#14b8a6" />
                <MacroLine label="Fat" value={nutrition.macros.fat.logged} max={nutrition.macros.fat.target} color="#06b6d4" />
              </>
            ) : (
              <>
                <MacroLine label="Pro" value={0} max={nutrition.macros.protein.target} color="rgba(139,92,246,0.2)" />
                <MacroLine label="Carb" value={0} max={nutrition.macros.carbs.target} color="rgba(20,184,166,0.2)" />
                <MacroLine label="Fat" value={0} max={nutrition.macros.fat.target} color="rgba(6,182,212,0.2)" />
              </>
            )}
          </div>

          {/* System Signals (Recovery & Hydration) */}
          <div className="w-full max-w-sm flex flex-col gap-6 pt-4 border-t border-white/5">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Battery size={14} className="text-indigo-400/70" />
                <span className="text-xs font-medium text-white/50">Readiness</span>
              </div>
              {recovery.isKnown ? (
                <div className="flex gap-4 text-xs font-semibold">
                  <span className="text-white/70">{recovery.sleepHours}h</span>
                </div>
              ) : (
                <button onClick={() => navigate('/progress')} className="text-[10px] uppercase tracking-widest font-bold text-indigo-400 hover:text-indigo-300">
                  Calibrate
                </button>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Droplets size={14} className="text-teal-400/70" />
                <span className="text-xs font-medium text-white/50">Hydration</span>
              </div>
              <HydrationNodes />
            </div>

          </div>

        </div>
      </div>
    </PageTransition>
  )
}
