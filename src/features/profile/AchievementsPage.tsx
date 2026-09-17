import { PageTransition } from '@/components/layout/PageTransition'
import { ACHIEVEMENTS } from '@/lib/engines/achievementEngine'
import { useAchievementStore } from '@/store/achievementStore'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'
import { ArrowLeft, Lock, Trophy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function AchievementsPage() {
  const navigate = useNavigate()
  const { unlockedAchievements } = useAchievementStore()

  const earnedCount = unlockedAchievements.length
  const totalCount = ACHIEVEMENTS.length
  const progress = Math.round((earnedCount / totalCount) * 100) || 0

  return (
    <PageTransition>
      <div className="page pb-24">
        <header className="page-header mb-8 flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => navigate('/profile')} 
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-95"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-heading font-bold text-white tracking-tight">
              Achievements
            </h1>
          </div>
          
          <div className="glass-panel p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Trophy size={24} className="text-accent" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Your Progress</h2>
                  <p className="text-white/50 text-sm">You've unlocked {earnedCount} of {totalCount} badges</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-heading font-bold text-white">{progress}%</span>
              </div>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-accent rounded-full shadow-[0_0_10px_rgba(255,100,0,0.5)]" 
              />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4">
          {ACHIEVEMENTS.map((badge, idx) => {
            const unlockedData = unlockedAchievements.find(a => a.id === badge.id)
            const isUnlocked = !!unlockedData

            return (
              <motion.div 
                key={badge.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={clsx(
                  "glass-panel p-5 flex flex-col items-center text-center transition-all duration-500 relative overflow-hidden",
                  isUnlocked ? "border-accent/30 shadow-[0_4px_24px_rgba(255,100,0,0.1)]" : "opacity-60"
                )}
              >
                {isUnlocked && (
                  <div className={clsx("absolute inset-0 opacity-10 bg-gradient-to-br", badge.color)} />
                )}
                
                <div className={clsx(
                  "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 relative z-10 transition-transform duration-500",
                  isUnlocked ? `bg-gradient-to-br shadow-lg scale-110 ${badge.color}` : "bg-white/5 border border-white/10 grayscale"
                )}>
                  {isUnlocked ? badge.icon : <Lock size={20} className="text-white/30" />}
                  
                  {isUnlocked && (
                    <motion.div 
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-2xl bg-white mix-blend-overlay" 
                    />
                  )}
                </div>
                
                <h3 className="text-sm font-bold text-white mb-1 relative z-10">{badge.title}</h3>
                <p className="text-xs text-white/50 leading-relaxed flex-1 flex items-center relative z-10">
                  {isUnlocked ? badge.description : "Keep tracking to unlock this badge"}
                </p>

                {isUnlocked && (
                  <div className="text-[10px] font-medium tracking-wider text-accent mt-4 pt-3 border-t border-white/10 w-full relative z-10 uppercase">
                    Unlocked {new Date(unlockedData.unlockedAt).toLocaleDateString()}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </PageTransition>
  )
}
