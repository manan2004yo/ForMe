import { motion } from 'framer-motion'
import { AnimatedCounter } from '@/components/ui'

interface HeroVisualProps {
  score: number
  totalCalories: number
  calorieTarget: number
  protein: number
}

export function HeroVisual({ score, totalCalories, calorieTarget, protein }: HeroVisualProps) {
  const percentage = Math.min(100, Math.round((totalCalories / calorieTarget) * 100)) || 0
  const circumference = 2 * Math.PI * 110
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative w-full h-[360px] flex items-center justify-center overflow-hidden rounded-[40px] bg-bg-surface-elevated shadow-card border border-border mb-6 group">
      
      {/* Animated Ambient Background */}
      <div className="absolute inset-0 ambient-bg opacity-40 mix-blend-overlay" />
      
      {/* Floating 3D-like objects */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: [-10, 10, -10], opacity: 0.6 }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        className="absolute top-10 left-10 w-24 h-24 bg-macro-protein-start blur-[40px] rounded-full mix-blend-screen"
      />
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: [10, -10, 10], opacity: 0.5 }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-10 right-10 w-32 h-32 bg-accent blur-[50px] rounded-full mix-blend-screen"
      />

      {/* Main SVG Visualization */}
      <div className="relative z-10 w-[260px] h-[260px] flex items-center justify-center">
        
        {/* Decorative rotating dashed ring */}
        <motion.svg 
          width="260" height="260" 
          viewBox="0 0 260 260" 
          className="absolute inset-0 opacity-20 pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
        >
          <circle cx="130" cy="130" r="126" stroke="var(--color-border-strong)" strokeWidth="2" strokeDasharray="4 8" fill="none" />
        </motion.svg>

        {/* Core Progress Ring */}
        <svg width="240" height="240" viewBox="0 0 240 240" className="rotate-[-90deg]">
          {/* Track */}
          <circle 
            cx="120" cy="120" r="110" 
            stroke="var(--color-bg-surface2)" 
            strokeWidth="12" fill="none" 
          />
          {/* Progress */}
          <motion.circle 
            cx="120" cy="120" r="110" 
            stroke="url(#hero-gradient)" 
            strokeWidth="12" fill="none" 
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            style={{ strokeDasharray: circumference }}
          />
          <defs>
            <linearGradient id="hero-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-accent-light)" />
              <stop offset="100%" stopColor="var(--color-accent)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="text-label text-text-tertiary tracking-widest uppercase mb-1"
          >
            Today
          </motion.span>
          <div className="flex items-baseline">
            <AnimatedCounter 
              value={score} 
              className="font-heading font-black text-6xl text-text-primary tabular-nums tracking-tighter" 
            />
          </div>
          <span className="text-micro text-text-secondary mt-1">FORME SCORE</span>
        </div>
      </div>

      {/* Floating Data Panels */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.8, type: "spring" }}
        className="absolute bottom-8 left-6 glass-panel px-4 py-2 rounded-xl flex flex-col"
      >
        <span className="text-micro text-text-tertiary">Calories</span>
        <div className="flex items-baseline gap-1">
          <AnimatedCounter value={totalCalories} className="text-label font-bold text-text-primary" />
          <span className="text-[10px] text-text-secondary">/ {calorieTarget}</span>
        </div>
      </motion.div>

      <motion.div 
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1, type: "spring" }}
        className="absolute top-8 right-6 glass-panel px-4 py-2 rounded-xl flex flex-col"
      >
        <span className="text-micro text-text-tertiary">Protein</span>
        <div className="flex items-baseline gap-1">
          <AnimatedCounter value={protein} className="text-label font-bold text-text-primary" />
          <span className="text-[10px] text-text-secondary">g</span>
        </div>
      </motion.div>

    </div>
  )
}
