import { create } from 'zustand'
import { saveAchievements, getAchievements } from '@/lib/firebase/dataService'

export interface UnlockedAchievement {
  id: string
  unlockedAt: string // ISO date string
}

interface AchievementState {
  unlockedAchievements: UnlockedAchievement[]
  unlockAchievement: (uid: string | undefined, id: string) => boolean // returns true if newly unlocked
  loadAchievements: (uid: string) => Promise<void>
}

export const useAchievementStore = create<AchievementState>()((set, get) => ({
  unlockedAchievements: [],

  loadAchievements: async (uid: string) => {
    if (!uid || uid === 'demo') return
    const data = await getAchievements(uid)
    set({ unlockedAchievements: data })
  },

  unlockAchievement: (uid, id) => {
    const { unlockedAchievements } = get()
    
    if (unlockedAchievements.some(a => a.id === id)) {
      return false // already unlocked
    }

    const newAchievements = [...unlockedAchievements, { id, unlockedAt: new Date().toISOString() }]
    set({ unlockedAchievements: newAchievements })
    
    if (uid && uid !== 'demo') {
      saveAchievements(uid, newAchievements)
    }
    
    return true
  }
}))
