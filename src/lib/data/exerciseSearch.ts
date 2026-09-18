import { v4 as uuidv4 } from 'uuid'
import { EXERCISE_DATABASE, type ExerciseEntry } from './exerciseDatabase'

/**
 * Merges the canonical database with the user's custom exercises.
 * Custom exercises always take priority on ID collision.
 */
export function getMergedLibrary(customExercises: ExerciseEntry[]): ExerciseEntry[] {
  const customIds = new Set(customExercises.map(e => e.id))
  return [
    ...EXERCISE_DATABASE.filter(e => !customIds.has(e.id)),
    ...customExercises,
  ]
}

/**
 * Smart search with alias support and relevance scoring.
 * Returns exercises sorted by match quality, best match first.
 * Pass an empty query to return the full library unsorted.
 */
export function searchExercises(
  query: string,
  library: ExerciseEntry[] = EXERCISE_DATABASE
): ExerciseEntry[] {
  if (!query.trim()) return library

  const q = query.toLowerCase().trim()

  const scored = library.map(exercise => {
    let score = 0

    if (exercise.name.toLowerCase() === q) score += 100
    if (exercise.name.toLowerCase().startsWith(q)) score += 50
    if (exercise.name.toLowerCase().includes(q)) score += 25

    if (exercise.aliases.some(a => a.toLowerCase() === q)) score += 80
    if (exercise.aliases.some(a => a.toLowerCase().startsWith(q))) score += 40
    if (exercise.aliases.some(a => a.toLowerCase().includes(q))) score += 15

    if (exercise.primaryMuscle.toLowerCase().includes(q)) score += 10
    if (exercise.secondaryMuscles.some(m => m.toLowerCase().includes(q))) score += 5

    return { exercise, score }
  })

  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ exercise }) => exercise)
}

/**
 * Looks up a single exercise by its canonical ID.
 * Searches the merged library so custom exercises are included.
 */
export function getExerciseById(
  id: string,
  customExercises: ExerciseEntry[] = []
): ExerciseEntry | undefined {
  return getMergedLibrary(customExercises).find(e => e.id === id)
}

/**
 * Creates a new custom exercise entry with a prefixed UUID.
 * Use this factory function whenever adding a user-created exercise
 * to ensure the ID never collides with canonical database IDs.
 */
export function createCustomExercise(
  data: Omit<ExerciseEntry, 'id'>
): ExerciseEntry {
  return {
    ...data,
    id: `custom_${uuidv4()}`,
  }
}
