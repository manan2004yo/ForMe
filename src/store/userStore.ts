// ============================================================
// FORME — User Profile Store
// ============================================================

import { create } from 'zustand'
import type { UserProfile, BodyMetrics } from '@/types'
import { calculateBodyMetrics } from '@/lib/calculations/bodyMetrics'
import { saveUserProfile, getUserProfile } from '@/lib/firebase/dataService'

// Demo profile for exploration
export const DEMO_PROFILE: UserProfile = {
  id: 'demo',
  email: 'demo@forme.app',
  name: 'Arjun (Demo)',
  age: 26,
  gender: 'male',
  heightCm: 176,
  weightKg: 70,
  activityLevel: 'moderately_active',
  lifestyle: 'student',
  dietType: 'vegetarian',
  eatsEggs: true,
  eatsMeat: false,
  eatsFish: false,
  eatsDairy: true,
  allergies: '',
  monthlyFoodBudget: 3000,
  cookingAbility: 'basic',
  eatingEnvironment: 'hostel',
  foodAvailability: ['eggs', 'dahi', 'roti', 'dal', 'rice', 'banana', 'peanuts'],
  fitnessGoal: 'body_recomposition',
  trainingExperience: 'beginner',
  trainingLocation: 'gym',
  availableEquipment: [],
  trainingDays: [1, 2, 4, 5, 6], // Mon Tue Thu Fri Sat
  gymClosedDays: [0],
  workoutDuration: '45-60',
  physicalLimitations: '',
  complexityMode: 'smart',
  mealFrequency: 3,
  preferredKatoriGrams: 150,
  waistCm: 82,
  onboardingComplete: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export type ActiveContext = 'normal' | 'travel' | 'restaurant' | 'family_dinner' | 'recovery'

interface UserState {
  profile: UserProfile | null
  metrics: BodyMetrics | null
  isLoading: boolean
  isDemoMode: boolean
  error: string | null
  activeContext: ActiveContext

  // Actions
  loadProfile: (uid: string) => Promise<void>
  saveProfile: (updates: Partial<UserProfile>) => Promise<void>
  setProfile: (profile: UserProfile) => void
  clearProfile: () => void
  loadDemoProfile: () => void
  recalculateMetrics: () => void
  setContext: (context: ActiveContext) => void
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  metrics: null,
  isLoading: false,
  isDemoMode: false,
  error: null,
  activeContext: 'normal',

  setContext: (context) => {
    const { profile } = get()
    if (!profile) return
    const metrics = calculateBodyMetrics(profile, context)
    set({ activeContext: context, metrics })
  },

  loadProfile: async (uid: string) => {
    set({ isLoading: true, error: null })
    try {
      const profile = await getUserProfile(uid)
      if (profile) {
        const metrics = calculateBodyMetrics(profile, get().activeContext)
        set({ profile, metrics, isDemoMode: false })
      } else {
        set({ error: 'Profile not found. Please check your Firestore Database rules and ensure it is created.' })
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to load profile.' })
    } finally {
      set({ isLoading: false })
    }
  },

  saveProfile: async (updates: Partial<UserProfile>) => {
    const { profile, activeContext, isDemoMode } = get()
    if (!profile) return

    const updated = { ...profile, ...updates, updatedAt: new Date().toISOString() } as UserProfile
    const metrics = calculateBodyMetrics(updated, activeContext)
    set({ profile: updated, metrics })

    if (!isDemoMode) {
      await saveUserProfile(profile.id, updates)
    }
  },

  setProfile: (profile: UserProfile) => {
    const metrics = calculateBodyMetrics(profile, get().activeContext)
    set({ profile, metrics })
  },

  clearProfile: () => set({ profile: null, metrics: null, isDemoMode: false }),

  loadDemoProfile: () => {
    const metrics = calculateBodyMetrics(DEMO_PROFILE, get().activeContext)
    set({ profile: DEMO_PROFILE, metrics, isDemoMode: true, error: null })
  },

  recalculateMetrics: () => {
    const { profile, activeContext } = get()
    if (profile) {
      set({ metrics: calculateBodyMetrics(profile, activeContext) })
    }
  },
}))
