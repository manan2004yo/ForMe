// ============================================================
// FORME — Food Log Store
// ============================================================

import { deleteFoodLog, getFoodLogsByDate, getRecentFoodLogs, saveFoodLog } from '@/lib/firebase/dataService'
import { useToastStore } from '@/store/toastStore'
import { useAuthStore } from '@/store/authStore'
import { recordPortionUsage } from '@/lib/services/portionMemoryService'
import type { ScannedProduct } from '@/lib/services/barcodeProductService'
import type { FoodLogEntry, LoggedFoodItem, MealSlot, NutritionInfo } from '@/types'
import { format } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import { create } from 'zustand'

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

  // Barcode scan cache — holds the last scanned product until logged or dismissed
  lastScannedProduct: ScannedProduct | null
  setScannedProduct: (product: ScannedProduct | null) => void

  // Actions
  loadLogs: (uid: string, date?: string) => Promise<void>
  loadRecentLogs: (uid: string, days?: number) => Promise<void>
  addFoodEntry: (uid: string, meal: MealSlot, items: LoggedFoodItem[], foodId?: string, unit?: string, quantity?: number) => Promise<void>
  updateEntry: (uid: string, entryId: string, updatedEntry: FoodLogEntry) => Promise<void>
  removeEntry: (uid: string, entryId: string) => Promise<void>
  setDate: (date: string) => void
}

export const useFoodLogStore = create<FoodLogState>((set, get) => ({
  entries: [],
  selectedDate: today(),
  isLoading: false,
  lastScannedProduct: null,

  setScannedProduct: (product) => set({ lastScannedProduct: product }),

  todayTotals: () => {
    const { entries, selectedDate } = get()
    const dayEntries = entries.filter(e => e.date === selectedDate)
    return dayEntries.reduce((acc, e) => {
      const t = e.totals || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
      return {
        calories: acc.calories + t.calories,
        protein: parseFloat((acc.protein + t.protein).toFixed(1)),
        carbs: parseFloat((acc.carbs + t.carbs).toFixed(1)),
        fat: parseFloat((acc.fat + t.fat).toFixed(1)),
        fiber: parseFloat((acc.fiber + t.fiber).toFixed(1)),
      }
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })
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

  addFoodEntry: async (uid: string, meal: MealSlot, items: LoggedFoodItem[], foodId?: string, unit?: string, quantity?: number) => {
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

    // Record portion memory so user's preferred unit is remembered
    const authUid = useAuthStore.getState().user?.uid
    if (authUid && foodId && unit && quantity) {
      recordPortionUsage(authUid, foodId, unit, quantity)
    }

    try {
      await saveFoodLog(uid, entry)
    } catch {
      useToastStore.getState().error('Your data is saved on this device. Cloud sync will retry automatically.')
    }
  },

  updateEntry: async (uid: string, entryId: string, updatedEntry: FoodLogEntry) => {
    set(state => ({
      entries: state.entries.map(e => e.id === entryId ? updatedEntry : e)
    }))
    try {
      await saveFoodLog(uid, updatedEntry)
    } catch {
      useToastStore.getState().error('Your data is saved on this device. Cloud sync will retry automatically.')
    }
  },

  removeEntry: async (uid: string, entryId: string) => {
    set(state => ({ entries: state.entries.filter(e => e.id !== entryId) }))
    try {
      await deleteFoodLog(uid, entryId)
    } catch {
      useToastStore.getState().error('Data deleted on this device. Cloud sync will retry automatically.')
    }
  },

  setDate: (date: string) => {
    set({ selectedDate: date })
  },
}))
