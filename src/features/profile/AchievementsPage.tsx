import { useAchievementStore } from '@/store/achievementStore'
import { ACHIEVEMENTS } from '@/lib/engines/achievementEngine'
import { ArrowLeft, Lock } from 'lucide-react'
import { useNavigate } from 'react-router'
import { clsx } from 'clsx'

export function AchievementsPage() {
  const navigate = useNavigate()
  const { unlockedAchievements } = useAchievementStore()

  const earnedCount = unlockedAchievements.length
  const totalCount = ACHIEVEMENTS.length

  return (
    <div className="page bg-bg min-h-screen">
      <header className="page-header flex flex-col mb-8 animate-fade-in">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full bg-bg-surface2 flex items-center justify-center text-text-primary hover:bg-bg-surface transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-display text-text-primary">Achievements</h1>
        </div>
        <p className="text-body text-text-secondary">
          You've unlocked {earnedCount} out of {totalCount} badges. Keep going!
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 animate-slide-up">
        {ACHIEVEMENTS.map((badge) => {
          const unlockedData = unlockedAchievements.find(a => a.id === badge.id)
          const isUnlocked = !!unlockedData

          return (
            <div 
              key={badge.id} 
              className={clsx(
                "bg-bg-surface2 border border-border rounded-2xl p-4 flex flex-col items-center text-center transition-all duration-300",
                isUnlocked ? "shadow-soft border-accent/30" : "opacity-60 grayscale"
              )}
            >
              <div className={clsx(
                "w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3 shadow-inner relative",
                isUnlocked ? `bg-gradient-to-br ${badge.color}` : "bg-bg-surface border-2 border-dashed border-border"
              )}>
                {isUnlocked ? badge.icon : <Lock size={20} className="text-text-tertiary" />}
                
                {isUnlocked && (
                  <div className="absolute inset-0 rounded-full animate-pulse opacity-50 bg-white mix-blend-overlay" style={{ animationDuration: '3s' }} />
                )}
              </div>
              
              <h3 className="text-label font-bold text-text-primary mb-1">{badge.title}</h3>
              <p className="text-micro text-text-secondary leading-tight flex-1 flex items-center">
                {isUnlocked && badge.description}
                {!isUnlocked && "Keep tracking to unlock this badge"}
              </p>

              {isUnlocked && (
                <div className="text-[10px] text-text-tertiary mt-3 pt-2 border-t border-border w-full">
                  Unlocked {new Date(unlockedData.unlockedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
