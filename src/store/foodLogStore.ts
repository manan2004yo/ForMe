// ============================================================
// FORME — Food Log Store
// ============================================================

import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { FoodLogEntry, LoggedFoodItem, MealSlot, NutritionInfo } from '@/types'
import { saveFoodLog, getFoodLogsByDate, getRecentFoodLogs, deleteFoodLog } from '@/lib/firebase/dataService'
import { format } from 'date-fns'

const today = () => format(new Date(), 'yyyy-MM-dd')

const emptyNutrition = (): NutritionInfo => ({
  calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0
})

function sumNutrition(items: LoggedFoodItem[]): NutritionInfo {
  return items.reduce((acc, item) => ({
    calories: Math.round(acc.calories + item.nutrition.calories),
    protein: parseFloat((acc.protein + item.nutrition.protein).toFixed(1)),
    carbs: parseFloat((acc.carbs + item.nutrition.carbs).toFixed(1)),
    fat: parseFloat((acc.fat + item.nutrition.fat).toFixed(1)),
    fiber: parseFloat((acc.fiber + item.nutrition.fiber).toFixed(1)),
  }), emptyNutrition())
}

interface FoodLogState {
  entries: FoodLogEntry[]
  selectedDate: string
  isLoading: boolean

  // Derived
  todayTotals: () => NutritionInfo
  entriesForDate: (date: string) => FoodLogEntry[]
  entriesForMeal: (date: string, meal: MealSlot) => FoodLogEntry[]

  // Actions
  loadLogs: (uid: string, date?: string) => Promise<void>
  loadRecentLogs: (uid: string, days?: number) => Promise<void>
  addFoodEntry: (uid: string, meal: MealSlot, items: LoggedFoodItem[]) => Promise<void>
  updateEntry: (uid: string, entryId: string, updatedEntry: FoodLogEntry) => Promise<void>
  removeEntry: (uid: string, entryId: string) => Promise<void>
  setDate: (date: string) => void
}

export const useFoodLogStore = create<FoodLogState>((set, get) => ({
  entries: [],
  selectedDate: today(),
  isLoading: false,

  todayTotals: () => {
    const { entries, selectedDate } = get()
    const dayEntries = entries.filter(e => e.date === selectedDate)
    const allItems = dayEntries.flatMap(e => e.foods)
    return sumNutrition(allItems)
  },

  entriesForDate: (date: string) => {
    return get().entries.filter(e => e.date === date)
  },

  entriesForMeal: (date: string, meal: MealSlot) => {
    return get().entries.filter(e => e.date === date && e.meal === meal)
  },

  loadLogs: async (uid: string, date?: string) => {
    const d = date || today()
    set({ isLoading: true, selectedDate: d })
    try {
      const logs = await getFoodLogsByDate(uid, d)
      set(state => ({
        entries: [
          ...state.entries.filter(e => e.date !== d),
          ...logs,
        ]
      }))
    } finally {
      set({ isLoading: false })
    }
  },

  loadRecentLogs: async (uid: string, days = 30) => {
    set({ isLoading: true })
    try {
      const logs = await getRecentFoodLogs(uid, days)
      set(state => {
        // Merge without duplicates
        const existingIds = new Set(state.entries.map(e => e.id))
        const newLogs = logs.filter(l => !existingIds.has(l.id))
        return { entries: [...state.entries, ...newLogs] }
      })
    } finally {
      set({ isLoading: false })
    }
  },

  addFoodEntry: async (uid: string, meal: MealSlot, items: LoggedFoodItem[]) => {
    const { selectedDate } = get()
    const entry: FoodLogEntry = {
      id: uuidv4(),
      userId: uid,
      date: selectedDate,
      meal,
      foods: items,
      totals: sumNutrition(items),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    set(state => ({ entries: [...state.entries, entry] }))
    await saveFoodLog(uid, entry)
  },

  updateEntry: async (uid: string, entryId: string, updatedEntry: FoodLogEntry) => {
    set(state => ({
      entries: state.entries.map(e => e.id === entryId ? updatedEntry : e)
    }))
    await saveFoodLog(uid, updatedEntry)
  },

  removeEntry: async (uid: string, entryId: string) => {
    set(state => ({ entries: state.entries.filter(e => e.id !== entryId) }))
    await deleteFoodLog(uid, entryId)
  },

  setDate: (date: string) => {
    set({ selectedDate: date })
  },
}))
