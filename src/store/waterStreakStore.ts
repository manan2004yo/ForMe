// ============================================================
// FORME — Water & Streak Store
// Tracks daily water intake and habit streaks
// ============================================================

import { create } from 'zustand'

import { getTodayDateString } from '@/lib/dateUtils'

// Local storage keys
const WATER_KEY = 'forme_water_v2_'
const STREAK_KEY = 'forme_streak_v2'

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
  return WATER_KEY + getTodayDateString()
}

function getToday() {
  return getTodayDateString()
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
    let stored = localStorage.getItem(STREAK_KEY)
    
    if (!stored) {
      const legacyStored = localStorage.getItem('forme_streak')
      if (legacyStored) {
        try {
          const legacyData: StreakData = JSON.parse(legacyStored)
          const newData: StreakData = {
            currentStreak: legacyData.currentStreak,
            longestStreak: legacyData.longestStreak,
            lastLoggedDate: legacyData.lastLoggedDate
          }
          stored = JSON.stringify(newData)
          localStorage.setItem(STREAK_KEY, stored)
        } catch {
          // ignore
        }
      }
    }

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
