import { v4 as uuidv4 } from 'uuid'
import { EXERCISE_DATABASE, type ExerciseEntry } from './exerciseDatabase'

interface ExerciseDbRecord {
  id?: string | number
  name?: string
  gifUrl?: string
  gifURL?: string
  imageUrl?: string
}

interface ExerciseDbMedia {
  exerciseDbId: string
  gifUrl: string
}

const EXERCISE_DB_V1_ENDPOINT = 'https://www.exercisedb.dev/api/v1/exercises'
const exerciseDbMediaCache = new Map<string, ExerciseDbMedia | null>()
let exerciseDbRequest: Promise<ExerciseDbRecord[]> | null = null

function normalizeExerciseName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function buildExerciseMatchKeys(exercise: ExerciseEntry): string[] {
  return [exercise.name, ...exercise.aliases]
    .map(normalizeExerciseName)
    .filter(Boolean)
}

async function loadExerciseDbRecords(): Promise<ExerciseDbRecord[]> {
  if (exerciseDbRequest) return exerciseDbRequest

  exerciseDbRequest = fetch(EXERCISE_DB_V1_ENDPOINT, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })
    .then(async response => {
      if (!response.ok) {
        throw new Error(`ExerciseDB request failed: ${response.status}`)
      }

      const payload: unknown = await response.json()

      if (Array.isArray(payload)) {
        return payload as ExerciseDbRecord[]
      }

      if (
        typeof payload === 'object' &&
        payload !== null &&
        'data' in payload &&
        Array.isArray((payload as { data?: unknown }).data)
      ) {
        return (payload as { data: ExerciseDbRecord[] }).data
      }

      return []
    })
    .catch(error => {
      exerciseDbRequest = null
      throw error
    })

  return exerciseDbRequest
}

function findExerciseDbMatch(
  exercise: ExerciseEntry,
  records: ExerciseDbRecord[]
): ExerciseDbMedia | null {
  const keys = buildExerciseMatchKeys(exercise)

  let best: ExerciseDbRecord | null = null
  let bestScore = 0

  for (const record of records) {
    if (!record.name) continue

    const providerName = normalizeExerciseName(record.name)
    if (!providerName) continue

    let score = 0

    if (keys.includes(providerName)) {
      score = 100
    } else if (
      keys.some(key =>
        providerName.includes(key) || key.includes(providerName)
      )
    ) {
      score = 70
    } else {
      const providerTokens = new Set(providerName.split(' '))
      const matchedTokenCount = keys
        .flatMap(key => key.split(' '))
        .filter(token => token.length >= 3 && providerTokens.has(token))
        .length

      if (matchedTokenCount >= 2) score = 45
    }

    if (score > bestScore) {
      best = record
      bestScore = score
    }
  }

  if (!best || bestScore < 45) return null

  const gifUrl =
    (typeof best.gifUrl === 'string' && best.gifUrl) ||
    (typeof best.gifURL === 'string' && best.gifURL) ||
    (typeof best.imageUrl === 'string' && best.imageUrl) ||
    ''

  const exerciseDbId =
    best.id === undefined || best.id === null
      ? ''
      : String(best.id)

  if (!gifUrl || !exerciseDbId) return null

  return {
    exerciseDbId,
    gifUrl,
  }
}

export async function getExerciseDbMedia(
  exercise: ExerciseEntry
): Promise<ExerciseDbMedia | null> {
  if (exerciseDbMediaCache.has(exercise.id)) {
    return exerciseDbMediaCache.get(exercise.id) ?? null
  }

  try {
    const records = await loadExerciseDbRecords()
    const media = findExerciseDbMatch(exercise, records)
    exerciseDbMediaCache.set(exercise.id, media)
    return media
  } catch {
    exerciseDbMediaCache.set(exercise.id, null)
    return null
  }
}

export async function enrichExerciseWithMedia(
  exercise: ExerciseEntry
): Promise<ExerciseEntry> {
  const media = await getExerciseDbMedia(exercise)

  if (!media) return exercise

  return {
    ...exercise,
    exerciseDbId: media.exerciseDbId,
    gifUrl: media.gifUrl,
  }
}

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
