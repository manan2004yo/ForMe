// ============================================================
// FORME - Diet Plan Store (Manual Planning)
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MealSlot, NutritionInfo } from '@/types'
import { v4 as uuidv4 } from 'uuid'

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

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      currentPlan: JSON.parse(JSON.stringify(DEFAULT_SLOTS)),
      templates: [],
      addFoodToSlot: (slot, food) => {
        set(state => ({
          currentPlan: state.currentPlan.map(m => 
            m.slot === slot ? { ...m, foods: [...m.foods, { ...food, id: uuidv4() }] } : m
          )
        }))
      },
      removeFoodFromSlot: (slot, foodId) => {
        set(state => ({
          currentPlan: state.currentPlan.map(m => 
            m.slot === slot ? { ...m, foods: m.foods.filter(f => f.id !== foodId) } : m
          )
        }))
      },
      saveAsTemplate: (name) => {
        set(state => ({
          templates: [...state.templates, { id: uuidv4(), name, meals: JSON.parse(JSON.stringify(state.currentPlan)) }]
        }))
      },
      loadTemplate: (templateId) => {
        const template = get().templates.find(t => t.id === templateId)
        if (template) {
          set({ currentPlan: JSON.parse(JSON.stringify(template.meals)) })
        }
      },
      clearPlan: () => {
        set({ currentPlan: JSON.parse(JSON.stringify(DEFAULT_SLOTS)) })
      }
    }),
    { name: 'forme-plan-store' }
  )
)
