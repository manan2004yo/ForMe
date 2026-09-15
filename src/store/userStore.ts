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
  isIncognito: boolean

  // Actions
  loadProfile: (uid: string) => Promise<void>
  saveProfile: (updates: Partial<UserProfile>) => Promise<void>
  setProfile: (profile: UserProfile) => void
  clearProfile: () => void
  loadDemoProfile: () => void
  recalculateMetrics: () => void
  setContext: (context: ActiveContext) => void
  toggleIncognito: () => void
}

import { persist } from 'zustand/middleware'

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      metrics: null,
      isLoading: false,
      isDemoMode: false,
      error: null,
      activeContext: 'normal',
      isIncognito: false,

  toggleIncognito: () => set(state => ({ isIncognito: !state.isIncognito })),

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
        set({ profile, metrics, isDemoMode: false, error: null })
      } else {
        // Create an initial user profile shell for new authenticated users
        const defaultProfile: UserProfile = {
          id: uid,
          email: '',
          name: 'FORME User',
          age: 25,
          gender: 'male',
          heightCm: 175,
          weightKg: 70,
          activityLevel: 'moderately_active',
          lifestyle: 'student',
          dietType: 'vegetarian',
          eatsEggs: true,
          eatsMeat: false,
          eatsFish: false,
          eatsDairy: true,
          allergies: '',
          monthlyFoodBudget: 5000,
          cookingAbility: 'basic',
          eatingEnvironment: 'home',
          foodAvailability: [],
          fitnessGoal: 'fat_loss_muscle_gain',
          trainingExperience: 'beginner',
          trainingLocation: 'gym',
          availableEquipment: [],
          trainingDays: [1, 3, 5],
          gymClosedDays: [],
          workoutDuration: '45-60',
          physicalLimitations: '',
          complexityMode: 'smart',
          mealFrequency: 3,
          preferredKatoriGrams: 150,
          onboardingComplete: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        await saveUserProfile(uid, defaultProfile)
        const metrics = calculateBodyMetrics(defaultProfile, get().activeContext)
        set({ profile: defaultProfile, metrics, isDemoMode: false, error: null })
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to load profile. Check network connection or Firestore rules.' })
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
      const targetId = profile.id || updates.id || (profile as any).uid
      if (targetId) await saveUserProfile(targetId, updates)
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
}), { name: 'forme-user-storage' }))
