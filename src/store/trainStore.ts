// ============================================================
// FORME - Train Store (Manual Workout Planning)
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { PlannedExercise, MuscleGroup } from '@/types'

export interface WorkoutDay {
  id: string
  dayIndex: number
  isRestDay: boolean
  exercises: PlannedExercise[]
  notes?: string
}

export interface WorkoutTemplate {
  id: string
  name: string
  exercises: PlannedExercise[]
}

interface TrainState {
  currentPlan: WorkoutDay[]
  templates: WorkoutTemplate[]
  toggleRestDay: (dayIndex: number) => void
  addExerciseToDay: (dayIndex: number, exercise: Omit<PlannedExercise, 'id'>) => void
  removeExerciseFromDay: (dayIndex: number, exerciseId: string) => void
  saveAsTemplate: (name: string, dayIndex: number) => void
  loadTemplate: (templateId: string, dayIndex: number) => void
  clearPlan: () => void
}

const DEFAULT_DAYS: WorkoutDay[] = Array.from({ length: 7 }, (_, i) => ({
  id: uuidv4(),
  dayIndex: i,
  isRestDay: false,
  exercises: [],
}))

export const useTrainStore = create<TrainState>()(
  persist(
    (set, get) => ({
      currentPlan: JSON.parse(JSON.stringify(DEFAULT_DAYS)),
      templates: [],
      toggleRestDay: (dayIndex) => {
        set(state => ({
          currentPlan: state.currentPlan.map(d => 
            d.dayIndex === dayIndex ? { ...d, isRestDay: !d.isRestDay } : d
          )
        }))
      },
      addExerciseToDay: (dayIndex, exercise) => {
        set(state => ({
          currentPlan: state.currentPlan.map(d => 
            d.dayIndex === dayIndex ? { ...d, exercises: [...d.exercises, { ...exercise, id: uuidv4() }] } : d
          )
        }))
      },
      removeExerciseFromDay: (dayIndex, exerciseId) => {
        set(state => ({
          currentPlan: state.currentPlan.map(d => 
            d.dayIndex === dayIndex ? { ...d, exercises: d.exercises.filter(e => e.id !== exerciseId) } : d
          )
        }))
      },
      saveAsTemplate: (name, dayIndex) => {
        const day = get().currentPlan.find(d => d.dayIndex === dayIndex)
        if (day && day.exercises.length > 0) {
          set(state => ({
            templates: [...state.templates, { id: uuidv4(), name, exercises: JSON.parse(JSON.stringify(day.exercises)) }]
          }))
        }
      },
      loadTemplate: (templateId, dayIndex) => {
        const template = get().templates.find(t => t.id === templateId)
        if (template) {
          set(state => ({
            currentPlan: state.currentPlan.map(d => 
              d.dayIndex === dayIndex ? { ...d, exercises: JSON.parse(JSON.stringify(template.exercises)), isRestDay: false } : d
            )
          }))
        }
      },
      clearPlan: () => {
        set({ currentPlan: JSON.parse(JSON.stringify(DEFAULT_DAYS)) })
      }
    }),
    { name: 'forme-train-store' }
  )
)
