// ============================================================
// FORME — Water & Streak Store
// Tracks daily water intake and habit streaks
// ============================================================

import { create } from 'zustand'

// Local storage keys
const WATER_KEY = 'forme_water_'
const STREAK_KEY = 'forme_streak'

interface StreakData {
  currentStreak: number
  longestStreak: number
  lastLoggedDate: string | null
}

interface WaterState {
  // Water (cups/day)
  waterToday: number
  waterGoal: number

  // Streaks
  streak: StreakData

  // Actions
  addWater: (cups?: number) => void
  removeWater: () => void
  setWaterGoal: (cups: number) => void
  loadWater: () => void
  recordActivity: () => void
  loadStreak: () => void
}

function todayKey() {
  return WATER_KEY + new Date().toISOString().split('T')[0]
}

function getToday() {
  return new Date().toISOString().split('T')[0]
}

function daysBetween(d1: string, d2: string): number {
  const t1 = new Date(d1).getTime()
  const t2 = new Date(d2).getTime()
  return Math.round(Math.abs(t1 - t2) / (1000 * 60 * 60 * 24))
}

export const useWaterStreakStore = create<WaterState>((set, get) => ({
  waterToday: 0,
  waterGoal: 8,
  streak: {
    currentStreak: 0,
    longestStreak: 0,
    lastLoggedDate: null,
  },

  loadWater: () => {
    const stored = localStorage.getItem(todayKey())
    const goal = parseInt(localStorage.getItem('forme_water_goal') || '8', 10)
    set({ waterToday: stored ? parseInt(stored, 10) : 0, waterGoal: goal })
  },

  loadStreak: () => {
    const stored = localStorage.getItem(STREAK_KEY)
    if (stored) {
      try {
        const data: StreakData = JSON.parse(stored)
        const today = getToday()
        // If last logged was > 1 day ago, reset streak
        if (data.lastLoggedDate && daysBetween(data.lastLoggedDate, today) > 1) {
          const reset: StreakData = { ...data, currentStreak: 0 }
          set({ streak: reset })
        } else {
          set({ streak: data })
        }
      } catch {
        // ignore
      }
    }
  },

  addWater: (cups = 1) => {
    const { waterToday } = get()
    const newVal = waterToday + cups
    set({ waterToday: newVal })
    localStorage.setItem(todayKey(), String(newVal))
  },

  removeWater: () => {
    const { waterToday } = get()
    const newVal = Math.max(0, waterToday - 1)
    set({ waterToday: newVal })
    localStorage.setItem(todayKey(), String(newVal))
  },

  setWaterGoal: (cups) => {
    set({ waterGoal: cups })
    localStorage.setItem('forme_water_goal', String(cups))
  },

  recordActivity: () => {
    const { streak } = get()
    const today = getToday()

    if (streak.lastLoggedDate === today) return // already counted today

    let newStreak = 1
    if (streak.lastLoggedDate && daysBetween(streak.lastLoggedDate, today) === 1) {
      newStreak = streak.currentStreak + 1
    }

    const updated: StreakData = {
      currentStreak: newStreak,
      longestStreak: Math.max(streak.longestStreak, newStreak),
      lastLoggedDate: today,
    }
    set({ streak: updated })
    localStorage.setItem(STREAK_KEY, JSON.stringify(updated))
  },
}))
