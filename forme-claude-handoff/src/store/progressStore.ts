// ============================================================
// FORME — Progress & Workout Store
// ============================================================

import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type {
  WorkoutPlan, WorkoutLogEntry, WeightEntry, WaistEntry,
  DailyDietPlan
} from '@/types'
import {
  saveWorkoutLog, getWorkoutLogs, saveWeightEntry, getWeightHistory,
  saveWaistEntry, getWaistHistory, saveWorkoutPlan, getWorkoutPlan,
  saveDietPlan, getDietPlan
} from '@/lib/firebase/dataService'

interface ProgressState {
  workoutPlan: WorkoutPlan | null
  dietPlan: DailyDietPlan | null
  workoutLogs: WorkoutLogEntry[]
  weightHistory: WeightEntry[]
  waistHistory: WaistEntry[]
  isLoading: boolean

  // Actions
  loadAll: (uid: string) => Promise<void>
  saveWorkoutPlan: (uid: string, plan: WorkoutPlan) => Promise<void>
  saveDietPlan: (uid: string, plan: DailyDietPlan) => Promise<void>
  logWorkout: (uid: string, entry: Omit<WorkoutLogEntry, 'id' | 'createdAt'>) => Promise<void>
  addWeightEntry: (uid: string, weightKg: number, notes?: string) => Promise<void>
  addWaistEntry: (uid: string, waistCm: number, notes?: string, extra?: { chestCm?: number; armsCm?: number; thighsCm?: number; hipsCm?: number }) => Promise<void>
  getLatestWeight: () => number | null
  getLatestWaist: () => number | null
  getWeightTrend: () => 'up' | 'down' | 'stable' | null
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  workoutPlan: null,
  dietPlan: null,
  workoutLogs: [],
  weightHistory: [],
  waistHistory: [],
  isLoading: false,

  loadAll: async (uid: string) => {
    set({ isLoading: true })
    try {
      const [plan, dietPlan, logs, weights, waists] = await Promise.all([
        getWorkoutPlan(uid),
        getDietPlan(uid),
        getWorkoutLogs(uid),
        getWeightHistory(uid),
        getWaistHistory(uid),
      ])
      set({
        workoutPlan: plan,
        dietPlan: dietPlan,
        workoutLogs: logs,
        weightHistory: weights,
        waistHistory: waists,
      })
    } finally {
      set({ isLoading: false })
    }
  },

  saveWorkoutPlan: async (uid: string, plan: WorkoutPlan) => {
    set({ workoutPlan: plan })
    await saveWorkoutPlan(uid, plan)
  },

  saveDietPlan: async (uid: string, plan: DailyDietPlan) => {
    set({ dietPlan: plan })
    await saveDietPlan(uid, plan)
  },

  logWorkout: async (uid: string, entry) => {
    const full: WorkoutLogEntry = {
      ...entry,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    }
    set(s => ({ workoutLogs: [full, ...s.workoutLogs] }))
    await saveWorkoutLog(uid, full)
  },

  addWeightEntry: async (uid: string, weightKg: number, notes?: string) => {
    const entry: WeightEntry = {
      id: uuidv4(),
      userId: uid,
      date: new Date().toISOString().split('T')[0],
      weightKg,
      notes,
    }
    set(s => ({ weightHistory: [entry, ...s.weightHistory] }))
    await saveWeightEntry(uid, entry)
  },

  addWaistEntry: async (uid: string, waistCm: number, notes?: string, extra?: { chestCm?: number; armsCm?: number; thighsCm?: number; hipsCm?: number }) => {
    const entry: WaistEntry = {
      id: uuidv4(),
      userId: uid,
      date: new Date().toISOString().split('T')[0],
      waistCm,
      notes,
      ...extra,
    }
    set(s => ({ waistHistory: [entry, ...s.waistHistory] }))
    await saveWaistEntry(uid, entry)
  },

  getLatestWeight: () => {
    const { weightHistory } = get()
    return weightHistory.length > 0 ? weightHistory[0].weightKg : null
  },

  getLatestWaist: () => {
    const { waistHistory } = get()
    return waistHistory.length > 0 ? waistHistory[0].waistCm : null
  },

  getWeightTrend: () => {
    const { weightHistory } = get()
    if (weightHistory.length < 4) return null
    const recent = weightHistory.slice(0, 4).map(e => e.weightKg)
    const avg1 = (recent[0] + recent[1]) / 2
    const avg2 = (recent[2] + recent[3]) / 2
    const diff = avg1 - avg2
    if (Math.abs(diff) < 0.3) return 'stable'
    return diff > 0 ? 'up' : 'down'
  },
}))
