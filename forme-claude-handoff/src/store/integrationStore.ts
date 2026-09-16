import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Platform = 'apple_health' | 'google_fit' | 'oura' | 'fitbit' | 'garmin'

export interface DailyActivity {
  steps: number
  activeCalories: number
  sleepScore?: number
  lastSynced: string
}

interface IntegrationState {
  connectedPlatforms: Platform[]
  isSyncing: boolean
  dailyActivity: DailyActivity | null

  // Actions
  connectPlatform: (platform: Platform) => Promise<void>
  disconnectPlatform: (platform: Platform) => void
  syncData: () => Promise<void>
}

// Generate realistic mock data based on time of day
function generateMockActivity(): DailyActivity {
  const now = new Date()
  const hoursSinceWake = Math.max(0, now.getHours() - 7) // Assume wake up at 7 AM
  const baseStepsPerHour = 800
  const randomVariance = Math.random() * 0.4 + 0.8 // 0.8 to 1.2
  
  const steps = Math.min(15000, Math.floor(hoursSinceWake * baseStepsPerHour * randomVariance))
  const activeCalories = Math.floor(steps * 0.04) // roughly 40 kcals per 1000 steps

  return {
    steps: steps < 500 ? 500 : steps,
    activeCalories: activeCalories < 20 ? 20 : activeCalories,
    sleepScore: Math.floor(Math.random() * 20) + 70, // 70 to 90
    lastSynced: new Date().toISOString(),
  }
}

export const useIntegrationStore = create<IntegrationState>()(
  persist(
    (set, get) => ({
      connectedPlatforms: [],
      isSyncing: false,
      dailyActivity: null,

      connectPlatform: async (platform) => {
        set({ isSyncing: true })
        // Simulate OAuth / API connection delay
        await new Promise(resolve => setTimeout(resolve, 2000))
        set(state => {
          const isConnected = state.connectedPlatforms.includes(platform)
          const newPlatforms = isConnected 
            ? state.connectedPlatforms 
            : [...state.connectedPlatforms, platform]
          
          return {
            connectedPlatforms: newPlatforms,
            isSyncing: false,
            // Generate initial mock data on first connection
            dailyActivity: state.dailyActivity || generateMockActivity()
          }
        })
      },

      disconnectPlatform: (platform) => {
        set(state => {
          const newPlatforms = state.connectedPlatforms.filter(p => p !== platform)
          return {
            connectedPlatforms: newPlatforms,
            // Clear activity data if no platforms remain
            dailyActivity: newPlatforms.length === 0 ? null : state.dailyActivity
          }
        })
      },

      syncData: async () => {
        const { connectedPlatforms } = get()
        if (connectedPlatforms.length === 0) return

        set({ isSyncing: true })
        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        set({
          isSyncing: false,
          dailyActivity: generateMockActivity()
        })
      }
    }),
    {
      name: 'forme-integrations',
    }
  )
)
