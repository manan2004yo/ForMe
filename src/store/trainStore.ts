// ============================================================
// FORME - Train Store (Manual Workout Planning)
// ============================================================

import { getManualWorkoutPlan, getWorkoutTemplates, saveManualWorkoutPlan, saveWorkoutTemplates } from '@/lib/firebase/dataService'
import { type ExerciseEntry } from '@/lib/data/exerciseDatabase'
import { getMergedLibrary, searchExercises as searchExercisesUtil, createCustomExercise } from '@/lib/data/exerciseSearch'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import type { PlannedExercise, WorkoutDay } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import { create } from 'zustand'



export interface WorkoutTemplate {
  id: string
  name: string
  exercises: PlannedExercise[]
}

interface TrainState {
  currentPlan: WorkoutDay[]
  templates: WorkoutTemplate[]
  isLoading: boolean
  loadAll: (uid: string) => Promise<void>
  toggleRestDay: (dayIndex: number) => void
  addExerciseToDay: (dayIndex: number, exercise: Omit<PlannedExercise, 'id'>) => void
  removeExerciseFromDay: (dayIndex: number, exerciseId: string) => void
  saveAsTemplate: (name: string, dayIndex: number) => void
  loadTemplate: (templateId: string, dayIndex: number) => void
  clearPlan: () => void
  customExercises: ExerciseEntry[]
  addCustomExercise: (data: Omit<ExerciseEntry, 'id'>) => Promise<void>
  searchExercises: (query: string) => ExerciseEntry[]
}

const DEFAULT_DAYS: WorkoutDay[] = Array.from({ length: 7 }, (_, i) => ({
  id: uuidv4(),
  dayIndex: i,
  isRestDay: false,
  exercises: [],
}))

export const useTrainStore = create<TrainState>((set, get) => ({
  currentPlan: JSON.parse(JSON.stringify(DEFAULT_DAYS)),
  templates: [],
  isLoading: false,
  customExercises: [],

  addCustomExercise: async (data) => {
    const newExercise = createCustomExercise(data)
    const updated = [...get().customExercises, newExercise]
    set({ customExercises: updated })
    const uid = useAuthStore.getState().user?.uid
    if (uid) {
      try {
        // Persist to Firestore: users/{uid}/customExercises/all
        // Use the existing saveWorkoutTemplates pattern as a reference
        // when you wire Firestore persistence in a later step
      } catch {
        useToastStore.getState().error('Custom exercise saved locally. Cloud sync will retry.')
      }
    }
  },

  searchExercises: (query) => {
    const library = getMergedLibrary(get().customExercises)
    return searchExercisesUtil(query, library)
  },


  loadAll: async (uid: string) => {
    set({ isLoading: true })
    try {
      const [plan, temps] = await Promise.all([
        getManualWorkoutPlan(uid),
        getWorkoutTemplates(uid)
      ])
      if (plan) set({ currentPlan: plan })
      if (temps) set({ templates: temps })
    } finally {
      set({ isLoading: false })
    }
  },

  toggleRestDay: async (dayIndex) => {
    const newPlan = get().currentPlan.map(d => 
      d.dayIndex === dayIndex ? { ...d, isRestDay: !d.isRestDay } : d
    )
    set({ currentPlan: newPlan })
    const uid = useAuthStore.getState().user?.uid
    if (uid) {
      try { await saveManualWorkoutPlan(uid, newPlan) }
      catch { useToastStore.getState().error('Your data is saved on this device. Cloud sync will retry automatically.') }
    }
  },

  addExerciseToDay: async (dayIndex, exercise) => {
    const newPlan = get().currentPlan.map(d => 
      d.dayIndex === dayIndex ? { ...d, exercises: [...d.exercises, { ...exercise, id: uuidv4() }] } : d
    )
    set({ currentPlan: newPlan })
    const uid = useAuthStore.getState().user?.uid
    if (uid) {
      try { await saveManualWorkoutPlan(uid, newPlan) }
      catch { useToastStore.getState().error('Your data is saved on this device. Cloud sync will retry automatically.') }
    }
  },

  removeExerciseFromDay: async (dayIndex, exerciseId) => {
    const newPlan = get().currentPlan.map(d => 
      d.dayIndex === dayIndex ? { ...d, exercises: d.exercises.filter(e => e.id !== exerciseId) } : d
    )
    set({ currentPlan: newPlan })
    const uid = useAuthStore.getState().user?.uid
    if (uid) {
      try { await saveManualWorkoutPlan(uid, newPlan) }
      catch { useToastStore.getState().error('Your data is saved on this device. Cloud sync will retry automatically.') }
    }
  },

  saveAsTemplate: async (name, dayIndex) => {
    const day = get().currentPlan.find(d => d.dayIndex === dayIndex)
    if (!day) return
    const newTemplate: WorkoutTemplate = { id: uuidv4(), name, exercises: day.exercises }
    const newTemplates = [...get().templates, newTemplate]
    set({ templates: newTemplates })
    const uid = useAuthStore.getState().user?.uid
    if (uid) {
      try { await saveWorkoutTemplates(uid, newTemplates) }
      catch { useToastStore.getState().error('Your data is saved on this device. Cloud sync will retry automatically.') }
    }
  },

  loadTemplate: async (templateId, dayIndex) => {
    const template = get().templates.find(t => t.id === templateId)
    if (template) {
      const newPlan = get().currentPlan.map(d => 
        d.dayIndex === dayIndex ? { ...d, exercises: template.exercises, isRestDay: false } : d
      )
      set({ currentPlan: newPlan })
      const uid = useAuthStore.getState().user?.uid
      if (uid) {
      try { await saveManualWorkoutPlan(uid, newPlan) }
      catch { useToastStore.getState().error('Your data is saved on this device. Cloud sync will retry automatically.') }
    }
    }
  },

  clearPlan: async () => {
    const newPlan = JSON.parse(JSON.stringify(DEFAULT_DAYS))
    set({ currentPlan: newPlan })
    const uid = useAuthStore.getState().user?.uid
    if (uid) {
      try { await saveManualWorkoutPlan(uid, newPlan) }
      catch { useToastStore.getState().error('Your data is saved on this device. Cloud sync will retry automatically.') }
    }
  }
}))
