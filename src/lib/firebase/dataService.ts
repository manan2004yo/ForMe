// ============================================================
// FORME — Firestore Data Service
// All cloud persistence operations go through this service
// Falls back to localStorage for offline support
// ============================================================

import {
  doc, getDoc, setDoc, updateDoc, collection,
  query, where, orderBy, getDocs, addDoc, deleteDoc,
  limit, serverTimestamp, Timestamp
} from 'firebase/firestore'
import { db } from './config'
import type {
  UserProfile, FoodLogEntry, WorkoutLogEntry, WorkoutPlan,
  DailyDietPlan, WeightEntry, WaistEntry, SavedMeal,
  BodyCompositionEntry, WeeklyReport
} from '@/types'

// ─── User Profile ─────────────────────────────────────────────

export async function saveUserProfile(uid: string, profile: Partial<UserProfile>): Promise<void> {
  const ref = doc(db, 'users', uid)
  await setDoc(ref, {
    ...profile,
    updatedAt: serverTimestamp(),
  }, { merge: true })
  
  // Also save to localStorage as offline backup
  const existing = getLocalProfile(uid)
  localStorage.setItem(`forme_profile_${uid}`, JSON.stringify({ ...existing, ...profile, updatedAt: new Date().toISOString() }))
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const ref = doc(db, 'users', uid)
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const data = snap.data() as UserProfile
      localStorage.setItem(`forme_profile_${uid}`, JSON.stringify(data))
      return data
    }
    return getLocalProfile(uid)
  } catch {
    return getLocalProfile(uid)
  }
}

function getLocalProfile(uid: string): UserProfile | null {
  const raw = localStorage.getItem(`forme_profile_${uid}`)
  return raw ? JSON.parse(raw) : null
}

// ─── Food Logs ────────────────────────────────────────────────

export async function saveFoodLog(uid: string, entry: FoodLogEntry): Promise<void> {
  const ref = doc(db, 'users', uid, 'foodLogs', entry.id)
  await setDoc(ref, { ...entry, updatedAt: serverTimestamp() })
  saveLocalFoodLog(uid, entry)
}

export async function getFoodLogsByDate(uid: string, date: string): Promise<FoodLogEntry[]> {
  try {
    const ref = collection(db, 'users', uid, 'foodLogs')
    const q = query(ref, where('date', '==', date), orderBy('createdAt'))
    const snap = await getDocs(q)
    const entries = snap.docs.map(d => d.data() as FoodLogEntry)
    saveLocalFoodLogs(uid, entries, date)
    return entries
  } catch {
    return getLocalFoodLogs(uid, date)
  }
}

export async function deleteFoodLog(uid: string, entryId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'foodLogs', entryId))
  deleteLocalFoodLog(uid, entryId)
}

function saveLocalFoodLog(uid: string, entry: FoodLogEntry) {
  const key = `forme_foodlog_${uid}_${entry.date}`
  const existing = getLocalFoodLogs(uid, entry.date)
  const updated = existing.filter(e => e.id !== entry.id)
  updated.push(entry)
  localStorage.setItem(key, JSON.stringify(updated))
}

function saveLocalFoodLogs(uid: string, entries: FoodLogEntry[], date: string) {
  localStorage.setItem(`forme_foodlog_${uid}_${date}`, JSON.stringify(entries))
}

function getLocalFoodLogs(uid: string, date: string): FoodLogEntry[] {
  const raw = localStorage.getItem(`forme_foodlog_${uid}_${date}`)
  return raw ? JSON.parse(raw) : []
}

function deleteLocalFoodLog(uid: string, entryId: string) {
  const allKeys = Object.keys(localStorage).filter(k => k.startsWith(`forme_foodlog_${uid}_`))
  allKeys.forEach(key => {
    const entries = JSON.parse(localStorage.getItem(key) || '[]') as FoodLogEntry[]
    const filtered = entries.filter(e => e.id !== entryId)
    localStorage.setItem(key, JSON.stringify(filtered))
  })
}

// ─── Weight Entries ───────────────────────────────────────────

export async function saveWeightEntry(uid: string, entry: WeightEntry): Promise<void> {
  const ref = doc(db, 'users', uid, 'weightHistory', entry.id)
  await setDoc(ref, entry)
  const local = getLocalWeightHistory(uid)
  const updated = local.filter(e => e.id !== entry.id)
  updated.push(entry)
  localStorage.setItem(`forme_weight_${uid}`, JSON.stringify(updated))
}

export async function getWeightHistory(uid: string): Promise<WeightEntry[]> {
  try {
    const ref = collection(db, 'users', uid, 'weightHistory')
    const q = query(ref, orderBy('date', 'desc'), limit(90))
    const snap = await getDocs(q)
    const entries = snap.docs.map(d => d.data() as WeightEntry)
    localStorage.setItem(`forme_weight_${uid}`, JSON.stringify(entries))
    return entries
  } catch {
    return getLocalWeightHistory(uid)
  }
}

function getLocalWeightHistory(uid: string): WeightEntry[] {
  const raw = localStorage.getItem(`forme_weight_${uid}`)
  return raw ? JSON.parse(raw) : []
}

// ─── Waist Entries ────────────────────────────────────────────

export async function saveWaistEntry(uid: string, entry: WaistEntry): Promise<void> {
  const ref = doc(db, 'users', uid, 'waistHistory', entry.id)
  await setDoc(ref, entry)
  const local = getLocalWaistHistory(uid)
  const updated = local.filter(e => e.id !== entry.id)
  updated.push(entry)
  localStorage.setItem(`forme_waist_${uid}`, JSON.stringify(updated))
}

export async function getWaistHistory(uid: string): Promise<WaistEntry[]> {
  try {
    const ref = collection(db, 'users', uid, 'waistHistory')
    const q = query(ref, orderBy('date', 'desc'), limit(90))
    const snap = await getDocs(q)
    return snap.docs.map(d => d.data() as WaistEntry)
  } catch {
    return getLocalWaistHistory(uid)
  }
}

function getLocalWaistHistory(uid: string): WaistEntry[] {
  const raw = localStorage.getItem(`forme_waist_${uid}`)
  return raw ? JSON.parse(raw) : []
}

// ─── Workout Logs ─────────────────────────────────────────────

export async function saveWorkoutLog(uid: string, entry: WorkoutLogEntry): Promise<void> {
  const ref = doc(db, 'users', uid, 'workoutLogs', entry.id)
  await setDoc(ref, entry)
  const local = getLocalWorkoutLogs(uid)
  const updated = local.filter(e => e.id !== entry.id)
  updated.push(entry)
  localStorage.setItem(`forme_workouts_${uid}`, JSON.stringify(updated))
}

export async function getWorkoutLogs(uid: string, limitCount = 30): Promise<WorkoutLogEntry[]> {
  try {
    const ref = collection(db, 'users', uid, 'workoutLogs')
    const q = query(ref, orderBy('date', 'desc'), limit(limitCount))
    const snap = await getDocs(q)
    const entries = snap.docs.map(d => d.data() as WorkoutLogEntry)
    localStorage.setItem(`forme_workouts_${uid}`, JSON.stringify(entries))
    return entries
  } catch {
    return getLocalWorkoutLogs(uid)
  }
}

function getLocalWorkoutLogs(uid: string): WorkoutLogEntry[] {
  const raw = localStorage.getItem(`forme_workouts_${uid}`)
  return raw ? JSON.parse(raw) : []
}

// ─── Saved Meals ──────────────────────────────────────────────

export async function saveMeal(uid: string, meal: SavedMeal): Promise<void> {
  const ref = doc(db, 'users', uid, 'savedMeals', meal.id)
  await setDoc(ref, meal)
  const local = getLocalSavedMeals(uid)
  const updated = local.filter(m => m.id !== meal.id)
  updated.push(meal)
  localStorage.setItem(`forme_savedmeals_${uid}`, JSON.stringify(updated))
}

export async function getSavedMeals(uid: string): Promise<SavedMeal[]> {
  try {
    const ref = collection(db, 'users', uid, 'savedMeals')
    const snap = await getDocs(ref)
    return snap.docs.map(d => d.data() as SavedMeal)
  } catch {
    return getLocalSavedMeals(uid)
  }
}

function getLocalSavedMeals(uid: string): SavedMeal[] {
  const raw = localStorage.getItem(`forme_savedmeals_${uid}`)
  return raw ? JSON.parse(raw) : []
}

// ─── Workout Plan ─────────────────────────────────────────────

export async function saveWorkoutPlan(uid: string, plan: WorkoutPlan): Promise<void> {
  const ref = doc(db, 'users', uid, 'workoutPlan', 'current')
  await setDoc(ref, plan)
  localStorage.setItem(`forme_workoutplan_${uid}`, JSON.stringify(plan))
}

export async function getWorkoutPlan(uid: string): Promise<WorkoutPlan | null> {
  try {
    const ref = doc(db, 'users', uid, 'workoutPlan', 'current')
    const snap = await getDoc(ref)
    return snap.exists() ? (snap.data() as WorkoutPlan) : getLocalWorkoutPlan(uid)
  } catch {
    return getLocalWorkoutPlan(uid)
  }
}

function getLocalWorkoutPlan(uid: string): WorkoutPlan | null {
  const raw = localStorage.getItem(`forme_workoutplan_${uid}`)
  return raw ? JSON.parse(raw) : null
}

// ─── Diet Plan ────────────────────────────────────────────────

export async function saveDietPlan(uid: string, plan: DailyDietPlan): Promise<void> {
  const ref = doc(db, 'users', uid, 'dietPlan', 'current')
  await setDoc(ref, plan)
  localStorage.setItem(`forme_dietplan_${uid}`, JSON.stringify(plan))
}

export async function getDietPlan(uid: string): Promise<DailyDietPlan | null> {
  try {
    const ref = doc(db, 'users', uid, 'dietPlan', 'current')
    const snap = await getDoc(ref)
    return snap.exists() ? (snap.data() as DailyDietPlan) : getLocalDietPlan(uid)
  } catch {
    return getLocalDietPlan(uid)
  }
}

function getLocalDietPlan(uid: string): DailyDietPlan | null {
  const raw = localStorage.getItem(`forme_dietplan_${uid}`)
  return raw ? JSON.parse(raw) : null
}
