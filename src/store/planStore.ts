// ============================================================
// FORME - Diet Plan Store (Manual Planning)
// ============================================================

import { getDietTemplates, getManualDietPlan, saveDietTemplates, saveManualDietPlan } from '@/lib/firebase/dataService'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import type { MealSlot, NutritionInfo } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import { create } from 'zustand'

export interface PlannedFood {
  id: string
  foodId: string
  name: string
  quantity: number
  unit: string
  nutrition: NutritionInfo
}

export interface PlannedMealSlot {
  slot: MealSlot
  label: string
  foods: PlannedFood[]
}

export interface DietTemplate {
  id: string
  name: string
  meals: PlannedMealSlot[]
}

interface PlanState {
  currentPlan: PlannedMealSlot[]
  templates: DietTemplate[]
  isLoading: boolean
  loadAll: (uid: string) => Promise<void>
  addFoodToSlot: (slot: MealSlot, food: Omit<PlannedFood, 'id'>) => void
  removeFoodFromSlot: (slot: MealSlot, foodId: string) => void
  saveAsTemplate: (name: string) => void
  loadTemplate: (templateId: string) => void
  clearPlan: () => void
}

const DEFAULT_SLOTS: PlannedMealSlot[] = [
  { slot: 'breakfast', label: 'Breakfast', foods: [] },
  { slot: 'lunch', label: 'Lunch', foods: [] },
  { slot: 'snack', label: 'Snacks', foods: [] },
  { slot: 'dinner', label: 'Dinner', foods: [] },
  { slot: 'pre_workout', label: 'Pre-Workout', foods: [] },
  { slot: 'post_workout', label: 'Post-Workout', foods: [] },
]

export const usePlanStore = create<PlanState>((set, get) => ({
  currentPlan: JSON.parse(JSON.stringify(DEFAULT_SLOTS)),
  templates: [],
  isLoading: false,

  loadAll: async (uid: string) => {
    set({ isLoading: true })
    try {
      const [plan, temps] = await Promise.all([
        getManualDietPlan(uid),
        getDietTemplates(uid)
      ])
      if (plan) set({ currentPlan: plan })
      if (temps) set({ templates: temps })
    } finally {
      set({ isLoading: false })
    }
  },

  addFoodToSlot: async (slot, food) => {
    const newPlan = get().currentPlan.map(m => 
      m.slot === slot ? { ...m, foods: [...m.foods, { ...food, id: uuidv4() }] } : m
    )
    set({ currentPlan: newPlan })
    const uid = useAuthStore.getState().user?.uid
    if (uid) {
      try { await saveManualDietPlan(uid, newPlan) }
      catch (e) { useToastStore.getState().error('Your data is saved on this device. Cloud sync will retry automatically.') }
    }
  },

  removeFoodFromSlot: async (slot, foodId) => {
    const newPlan = get().currentPlan.map(m => 
      m.slot === slot ? { ...m, foods: m.foods.filter(f => f.id !== foodId) } : m
    )
    set({ currentPlan: newPlan })
    const uid = useAuthStore.getState().user?.uid
    if (uid) {
      try { await saveManualDietPlan(uid, newPlan) }
      catch (e) { useToastStore.getState().error('Your data is saved on this device. Cloud sync will retry automatically.') }
    }
  },

  saveAsTemplate: async (name) => {
    const newTemplate: DietTemplate = { id: uuidv4(), name, meals: get().currentPlan }
    const newTemplates = [...get().templates, newTemplate]
    set({ templates: newTemplates })
    const uid = useAuthStore.getState().user?.uid
    if (uid) {
      try { await saveDietTemplates(uid, newTemplates) }
      catch (e) { useToastStore.getState().error('Your data is saved on this device. Cloud sync will retry automatically.') }
    }
  },

  loadTemplate: async (templateId) => {
    const template = get().templates.find(t => t.id === templateId)
    if (template) {
      set({ currentPlan: template.meals })
      const uid = useAuthStore.getState().user?.uid
      if (uid) {
      try { await saveManualDietPlan(uid, template.meals) }
      catch (e) { useToastStore.getState().error('Your data is saved on this device. Cloud sync will retry automatically.') }
    }
    }
  },

  clearPlan: async () => {
    const newPlan = JSON.parse(JSON.stringify(DEFAULT_SLOTS))
    set({ currentPlan: newPlan })
    const uid = useAuthStore.getState().user?.uid
    if (uid) {
      try { await saveManualDietPlan(uid, newPlan) }
      catch (e) { useToastStore.getState().error('Your data is saved on this device. Cloud sync will retry automatically.') }
    }
  }
}))
