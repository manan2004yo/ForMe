// ============================================================
// FORME — Firestore Data Service
// All cloud persistence operations go through this service
// Falls back to localStorage for offline support
// ============================================================

import type { DietTemplate, PlannedMealSlot } from '@/store/planStore'
import type { WorkoutTemplate } from '@/store/trainStore'
import type {
  DailyDietPlan,
  FoodLogEntry,
  SavedMeal,
  UserProfile,
  WaistEntry,
  WeightEntry,
  WorkoutLogEntry, WorkoutPlan, WorkoutDay as ManualWorkoutDay
} from '@/types'
import {
  collection,
  deleteDoc,
  doc, getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'firebase/firestore'
import { db } from './config'

// Helper to remove undefined properties before sending to Firestore
function sanitizeForFirestore(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  const result: any = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      result[key] = sanitizeForFirestore(obj[key]);
    }
  }
  return result;
}

// ─── User Profile ─────────────────────────────────────────────

export async function saveUserProfile(uid: string, profile: Partial<UserProfile>): Promise<void> {
  const ref = doc(db, 'users', uid)
  // Save to localStorage as offline backup FIRST
  const existing = getLocalProfile(uid)
  localStorage.setItem(`forme_profile_${uid}`, JSON.stringify({ ...existing, ...profile, updatedAt: new Date().toISOString() }))

  if (!navigator.onLine) throw new Error('offline')
  try {
    await setDoc(ref, sanitizeForFirestore({
      ...profile,
      updatedAt: serverTimestamp(),
    }), { merge: true })
  } catch (error) {
    console.warn('Firestore write error (saveUserProfile):', error)
    throw error
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const ref = doc(db, 'users', uid)
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const data = snap.data() as UserProfile
      if (!data.id) data.id = uid
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
  saveLocalFoodLog(uid, entry)
  if (!navigator.onLine) throw new Error('offline')
  try {
    await setDoc(ref, { ...entry, updatedAt: serverTimestamp() })
  } catch (error) {
    console.warn('Firestore write error (saveFoodLog):', error)
    throw error
  }
}

export async function getFoodLogsByDate(uid: string, date: string): Promise<FoodLogEntry[]> {
  try {
    const ref = collection(db, 'users', uid, 'foodLogs')
    const q = query(ref, where('date', '==', date), orderBy('createdAt'))
    const snap = await getDocs(q)
    const cloudEntries = snap.docs.map(d => d.data() as FoodLogEntry)
    const localEntries = getLocalFoodLogs(uid, date)
    const cloudIds = new Set(cloudEntries.map(e => e.id))
    const unsyncedLocal = localEntries.filter(e => !cloudIds.has(e.id))
    const merged = [...cloudEntries, ...unsyncedLocal]
    saveLocalFoodLogs(uid, merged, date)
    return merged
  } catch {
    return getLocalFoodLogs(uid, date)
  }
}

export async function deleteFoodLog(uid: string, entryId: string): Promise<void> {
  deleteLocalFoodLog(uid, entryId)
  if (!navigator.onLine) throw new Error('offline')
  try {
    await deleteDoc(doc(db, 'users', uid, 'foodLogs', entryId))
  } catch (error) {
    console.warn('Firestore write error (deleteFoodLog):', error)
    throw error
  }
}

export async function getRecentFoodLogs(uid: string, days = 30): Promise<FoodLogEntry[]> {
  try {
    const ref = collection(db, 'users', uid, 'foodLogs')
    const d = new Date()
    d.setDate(d.getDate() - days)
    const q = query(ref, where('date', '>=', d.toISOString().split('T')[0]), orderBy('date', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => d.data() as FoodLogEntry)
  } catch {
    // Basic fallback: just return all local logs we have for recent dates
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith(`forme_foodlog_${uid}_`))
    let localEntries: FoodLogEntry[] = []
    allKeys.forEach(k => {
      const entries = JSON.parse(localStorage.getItem(k) || '[]')
      localEntries = [...localEntries, ...entries]
    })
    return localEntries
  }
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
  
  const local = getLocalWeightHistory(uid)
  const updated = local.filter(e => e.id !== entry.id)
  updated.push(entry)
  localStorage.setItem(`forme_weight_${uid}`, JSON.stringify(updated))

  if (!navigator.onLine) throw new Error('offline')
  try {
    await setDoc(ref, sanitizeForFirestore(entry))
  } catch (error) {
    console.warn('Firestore write error (saveWeightEntry):', error)
    throw error
  }
}

export async function getWeightHistory(uid: string): Promise<WeightEntry[]> {
  try {
    const ref = collection(db, 'users', uid, 'weightHistory')
    const q = query(ref, orderBy('date', 'desc'), limit(90))
    const snap = await getDocs(q)
    const cloudEntries = snap.docs.map(d => d.data() as WeightEntry)
    const localEntries = getLocalWeightHistory(uid)
    const cloudIds = new Set(cloudEntries.map(e => e.id))
    const unsyncedLocal = localEntries.filter(e => !cloudIds.has(e.id))
    const merged = [...cloudEntries, ...unsyncedLocal]
    merged.sort((a, b) => b.date.localeCompare(a.date))
    localStorage.setItem(`forme_weight_${uid}`, JSON.stringify(merged))
    return merged
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
  
  const local = getLocalWaistHistory(uid)
  const updated = local.filter(e => e.id !== entry.id)
  updated.push(entry)
  localStorage.setItem(`forme_waist_${uid}`, JSON.stringify(updated))

  if (!navigator.onLine) throw new Error('offline')
  try {
    await setDoc(ref, sanitizeForFirestore(entry))
  } catch (error) {
    console.warn('Firestore write error (saveWaistEntry):', error)
    throw error
  }
}

export async function getWaistHistory(uid: string): Promise<WaistEntry[]> {
  try {
    const ref = collection(db, 'users', uid, 'waistHistory')
    const q = query(ref, orderBy('date', 'desc'), limit(90))
    const snap = await getDocs(q)
    const cloudEntries = snap.docs.map(d => d.data() as WaistEntry)
    const localEntries = getLocalWaistHistory(uid)
    const cloudIds = new Set(cloudEntries.map(e => e.id))
    const unsyncedLocal = localEntries.filter(e => !cloudIds.has(e.id))
    const merged = [...cloudEntries, ...unsyncedLocal]
    merged.sort((a, b) => b.date.localeCompare(a.date))
    localStorage.setItem(`forme_waist_${uid}`, JSON.stringify(merged))
    return merged
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
  const local = getLocalWorkoutLogs(uid)
  const updated = local.filter(e => e.id !== entry.id)
  updated.push(entry)
  localStorage.setItem(`forme_workouts_${uid}`, JSON.stringify(updated))

  if (!navigator.onLine) throw new Error('offline')
  try {
    await setDoc(ref, sanitizeForFirestore(entry))
  } catch (error) {
    console.warn('Firestore write error (saveWorkoutLog):', error)
    throw error
  }
}

export async function getWorkoutLogs(uid: string, limitCount = 30): Promise<WorkoutLogEntry[]> {
  try {
    const ref = collection(db, 'users', uid, 'workoutLogs')
    const q = query(ref, orderBy('date', 'desc'), limit(limitCount))
    const snap = await getDocs(q)
    const cloudEntries = snap.docs.map(d => d.data() as WorkoutLogEntry)
    const localEntries = getLocalWorkoutLogs(uid)
    const cloudIds = new Set(cloudEntries.map(e => e.id))
    const unsyncedLocal = localEntries.filter(e => !cloudIds.has(e.id))
    const merged = [...cloudEntries, ...unsyncedLocal]
    merged.sort((a, b) => b.date.localeCompare(a.date))
    localStorage.setItem(`forme_workouts_${uid}`, JSON.stringify(merged))
    return merged
  } catch {
    return getLocalWorkoutLogs(uid)
  }
}

function getLocalWorkoutLogs(uid: string): WorkoutLogEntry[] {
  const raw = localStorage.getItem(`forme_workouts_${uid}`)
  return raw ? JSON.parse(raw) : []
}

// ─── Saved Meals & Recipes ──────────────────────────────────────

export async function saveSavedMeal(uid: string, meal: SavedMeal): Promise<void> {
  const ref = doc(db, 'users', uid, 'savedMeals', meal.id)

  const local = getLocalSavedMeals(uid)
  const updated = local.filter(e => e.id !== meal.id)
  updated.push(meal)
  localStorage.setItem(`forme_savedmeals_${uid}`, JSON.stringify(updated))

  if (!navigator.onLine) throw new Error('offline')
  try {
    await setDoc(ref, sanitizeForFirestore(meal))
  } catch (error) {
    console.warn('Firestore write error (saveSavedMeal):', error)
    throw error
  }
}

export async function getSavedMeals(uid: string): Promise<SavedMeal[]> {
  try {
    const ref = collection(db, 'users', uid, 'savedMeals')
    const snap = await getDocs(ref)
    const cloudEntries = snap.docs.map(d => d.data() as SavedMeal)
    const localEntries = getLocalSavedMeals(uid)
    const cloudIds = new Set(cloudEntries.map(e => e.id))
    const unsyncedLocal = localEntries.filter(e => !cloudIds.has(e.id))
    const merged = [...cloudEntries, ...unsyncedLocal]
    localStorage.setItem(`forme_savedmeals_${uid}`, JSON.stringify(merged))
    return merged
  } catch {
    return getLocalSavedMeals(uid)
  }
}

function getLocalSavedMeals(uid: string): SavedMeal[] {
  const raw = localStorage.getItem(`forme_savedmeals_${uid}`)
  return raw ? JSON.parse(raw) : []
}

export async function saveFamilyRecipe(uid: string, recipe: any): Promise<void> {
  const ref = doc(db, 'users', uid, 'familyRecipes', recipe.id)
  if (!navigator.onLine) throw new Error('offline')
  try {
    await setDoc(ref, sanitizeForFirestore(recipe))
  } catch (error) {
    console.warn('Firestore write error (saveFamilyRecipe):', error)
    throw error
  }
  const local = getLocalFamilyRecipes(uid)
  const updated = local.filter((r: any) => r.id !== recipe.id)
  updated.push(recipe)
  localStorage.setItem(`forme_familyrecipes_${uid}`, JSON.stringify(updated))
}

export async function getFamilyRecipes(uid: string): Promise<any[]> {
  try {
    const ref = collection(db, 'users', uid, 'familyRecipes')
    const snap = await getDocs(ref)
    const cloudEntries = snap.docs.map(d => d.data())
    const localEntries = getLocalFamilyRecipes(uid)
    const cloudIds = new Set(cloudEntries.map(e => e.id))
    const unsyncedLocal = localEntries.filter((e: any) => !cloudIds.has(e.id))
    const merged = [...cloudEntries, ...unsyncedLocal]
    localStorage.setItem(`forme_familyrecipes_${uid}`, JSON.stringify(merged))
    return merged
  } catch {
    return getLocalFamilyRecipes(uid)
  }
}

function getLocalFamilyRecipes(uid: string): any[] {
  const raw = localStorage.getItem(`forme_familyrecipes_${uid}`)
  return raw ? JSON.parse(raw) : []
}

// ─── Workout Plan ─────────────────────────────────────────────

export async function saveWorkoutPlan(uid: string, plan: WorkoutPlan): Promise<void> {
  const ref = doc(db, 'users', uid, 'workoutPlan', 'current')
  localStorage.setItem(`forme_workoutplan_${uid}`, JSON.stringify(plan))
  if (!navigator.onLine) throw new Error('offline')
  try {
    await setDoc(ref, sanitizeForFirestore(plan))
  } catch (error) {
    console.warn('Firestore write error (saveWorkoutPlan):', error)
    throw error
  }
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
  localStorage.setItem(`forme_dietplan_${uid}`, JSON.stringify(plan))
  if (!navigator.onLine) throw new Error('offline')
  try {
    await setDoc(ref, sanitizeForFirestore(plan))
  } catch (error) {
    console.warn('Firestore write error (saveDietPlan):', error)
    throw error
  }
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

// ─── Account Deletion ─────────────────────────────────────────

export async function deleteUserData(uid: string): Promise<void> {
  if (!navigator.onLine) throw new Error('offline')
  const subcollections = ['foodLogs', 'weightHistory', 'waistHistory', 'workoutLogs', 'savedMeals', 'familyRecipes', 'cns']
  
  // Delete subcollection documents
  for (const col of subcollections) {
    try {
      const snap = await getDocs(collection(db, 'users', uid, col))
      const promises = snap.docs.map(d => deleteDoc(d.ref))
      await Promise.all(promises)
    } catch (error) {
      console.warn(`Failed to delete subcollection ${col}:`, error)
    }
  }

  // Delete specific known documents
  try { await deleteDoc(doc(db, 'users', uid, 'workoutPlan', 'current')) } catch {}
  try { await deleteDoc(doc(db, 'users', uid, 'dietPlan', 'current')) } catch {}
  try { await deleteDoc(doc(db, 'users', uid, 'manualDietPlan', 'current')) } catch {}
  try { await deleteDoc(doc(db, 'users', uid, 'dietTemplates', 'all')) } catch {}
  try { await deleteDoc(doc(db, 'users', uid, 'manualWorkoutPlan', 'current')) } catch {}
  try { await deleteDoc(doc(db, 'users', uid, 'workoutTemplates', 'all')) } catch {}
  try { await deleteDoc(doc(db, 'users', uid, 'achievements', 'current')) } catch {}

  // Delete the root user document
  try {
    await deleteDoc(doc(db, 'users', uid))
  } catch (error) {
    console.warn('Failed to delete user doc:', error)
    throw error
  }
}

// ─── Manual Diet Plan (PlanStore) ─────────────────────────────────────────────

export async function saveManualDietPlan(uid: string, plan: PlannedMealSlot[]): Promise<void> {
  const ref = doc(db, 'users', uid, 'manualDietPlan', 'current')
  localStorage.setItem(`forme_manual_diet_${uid}`, JSON.stringify(plan))
  if (!navigator.onLine) return
  try {
    await setDoc(ref, { plan: sanitizeForFirestore(plan) })
  } catch (error) {
    console.warn('Firestore write error:', error)
  }
}

export async function getManualDietPlan(uid: string): Promise<PlannedMealSlot[] | null> {
  try {
    const ref = doc(db, 'users', uid, 'manualDietPlan', 'current')
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const data = snap.data().plan as PlannedMealSlot[]
      localStorage.setItem(`forme_manual_diet_${uid}`, JSON.stringify(data))
      return data
    }
    return getLocalManualDietPlan(uid)
  } catch {
    return getLocalManualDietPlan(uid)
  }
}

function getLocalManualDietPlan(uid: string): PlannedMealSlot[] | null {
  const raw = localStorage.getItem(`forme_manual_diet_${uid}`)
  return raw ? JSON.parse(raw) : null
}

export async function saveDietTemplates(uid: string, templates: DietTemplate[]): Promise<void> {
  const ref = doc(db, 'users', uid, 'dietTemplates', 'all')
  localStorage.setItem(`forme_diet_templates_${uid}`, JSON.stringify(templates))
  if (!navigator.onLine) return
  try {
    await setDoc(ref, { templates: sanitizeForFirestore(templates) })
  } catch (error) {
    console.warn('Firestore write error:', error)
  }
}

export async function getDietTemplates(uid: string): Promise<DietTemplate[]> {
  try {
    const ref = doc(db, 'users', uid, 'dietTemplates', 'all')
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const data = snap.data().templates as DietTemplate[]
      localStorage.setItem(`forme_diet_templates_${uid}`, JSON.stringify(data))
      return data
    }
    return getLocalDietTemplates(uid)
  } catch {
    return getLocalDietTemplates(uid)
  }
}

function getLocalDietTemplates(uid: string): DietTemplate[] {
  const raw = localStorage.getItem(`forme_diet_templates_${uid}`)
  return raw ? JSON.parse(raw) : []
}

// ─── Manual Workout Plan (TrainStore) ─────────────────────────────────────────

export async function saveManualWorkoutPlan(uid: string, plan: ManualWorkoutDay[]): Promise<void> {
  const ref = doc(db, 'users', uid, 'manualWorkoutPlan', 'current')
  localStorage.setItem(`forme_manual_workout_${uid}`, JSON.stringify(plan))
  if (!navigator.onLine) return
  try {
    await setDoc(ref, { plan: sanitizeForFirestore(plan) })
  } catch (error) {
    console.warn('Firestore write error:', error)
  }
}

export async function getManualWorkoutPlan(uid: string): Promise<ManualWorkoutDay[] | null> {
  try {
    const ref = doc(db, 'users', uid, 'manualWorkoutPlan', 'current')
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const data = snap.data().plan as ManualWorkoutDay[]
      localStorage.setItem(`forme_manual_workout_${uid}`, JSON.stringify(data))
      return data
    }
    return getLocalManualWorkoutPlan(uid)
  } catch {
    return getLocalManualWorkoutPlan(uid)
  }
}

function getLocalManualWorkoutPlan(uid: string): ManualWorkoutDay[] | null {
  const raw = localStorage.getItem(`forme_manual_workout_${uid}`)
  return raw ? JSON.parse(raw) : null
}

export async function saveWorkoutTemplates(uid: string, templates: WorkoutTemplate[]): Promise<void> {
  const ref = doc(db, 'users', uid, 'workoutTemplates', 'all')
  localStorage.setItem(`forme_workout_templates_${uid}`, JSON.stringify(templates))
  if (!navigator.onLine) return
  try {
    await setDoc(ref, { templates: sanitizeForFirestore(templates) })
  } catch (error) {
    console.warn('Firestore write error:', error)
  }
}

export async function getWorkoutTemplates(uid: string): Promise<WorkoutTemplate[]> {
  try {
    const ref = doc(db, 'users', uid, 'workoutTemplates', 'all')
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const data = snap.data().templates as WorkoutTemplate[]
      localStorage.setItem(`forme_workout_templates_${uid}`, JSON.stringify(data))
      return data
    }
    return getLocalWorkoutTemplates(uid)
  } catch {
    return getLocalWorkoutTemplates(uid)
  }
}

function getLocalWorkoutTemplates(uid: string): WorkoutTemplate[] {
  const raw = localStorage.getItem(`forme_workout_templates_${uid}`)
  return raw ? JSON.parse(raw) : []
}

// ─── Achievements ───────────────────────────────────────────────

export async function saveAchievements(uid: string, achievements: any[]): Promise<void> {
  const ref = doc(db, 'users', uid, 'achievements', 'current')
  localStorage.setItem(`forme_achievements_${uid}`, JSON.stringify(achievements))
  if (!navigator.onLine) return
  try {
    await setDoc(ref, { achievements: sanitizeForFirestore(achievements) })
  } catch (error) {
    console.warn('Firestore write error:', error)
  }
}

export async function getAchievements(uid: string): Promise<any[]> {
  try {
    const ref = doc(db, 'users', uid, 'achievements', 'current')
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const data = snap.data().achievements as any[]
      localStorage.setItem(`forme_achievements_${uid}`, JSON.stringify(data))
      return data
    }
    return getLocalAchievements(uid)
  } catch {
    return getLocalAchievements(uid)
  }
}

function getLocalAchievements(uid: string): any[] {
  const raw = localStorage.getItem(`forme_achievements_${uid}`)
  return raw ? JSON.parse(raw) : []
}
