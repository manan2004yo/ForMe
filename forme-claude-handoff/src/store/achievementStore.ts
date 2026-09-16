import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UnlockedAchievement {
  id: string
  unlockedAt: string // ISO date string
}

interface AchievementState {
  unlockedAchievements: UnlockedAchievement[]
  unlockAchievement: (id: string) => boolean // returns true if newly unlocked
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      unlockedAchievements: [],

      unlockAchievement: (id) => {
        const { unlockedAchievements } = get()
        
        if (unlockedAchievements.some(a => a.id === id)) {
          return false // already unlocked
        }

        set({
          unlockedAchievements: [...unlockedAchievements, { id, unlockedAt: new Date().toISOString() }]
        })
        
        return true
      }
    }),
    {
      name: 'forme-achievements',
    }
  )
)
