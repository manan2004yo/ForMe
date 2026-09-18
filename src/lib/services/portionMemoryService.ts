// ============================================================
// FORME — Smart Portion Memory Service
// ============================================================
// Remembers user's preferred unit and quantity per food item.
// Stored in localStorage — lightweight, no Firestore needed.
// ============================================================

export interface PortionMemory {
  foodId: string
  preferredUnit: string
  preferredQuantity: number
  /** How many times logged — used for confidence threshold */
  logCount: number
  lastUsedAt: number // Unix timestamp
}

type MemoryStore = Record<string, PortionMemory>

function getStorageKey(uid: string): string {
  return `forme_portion_memory_${uid}`
}

function loadMemory(uid: string): MemoryStore {
  try {
    const raw = localStorage.getItem(getStorageKey(uid))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveMemory(uid: string, memory: MemoryStore): void {
  try {
    localStorage.setItem(getStorageKey(uid), JSON.stringify(memory))
  } catch {
    // Storage quota exceeded — fail silently
  }
}

/**
 * Records a food logging event. Call every time a user logs a food item.
 */
export function recordPortionUsage(
  uid: string,
  foodId: string,
  unit: string,
  quantity: number
): void {
  const memory = loadMemory(uid)
  const existing = memory[foodId]

  memory[foodId] = {
    foodId,
    preferredUnit: unit,
    preferredQuantity: quantity,
    logCount: (existing?.logCount ?? 0) + 1,
    lastUsedAt: Date.now(),
  }

  saveMemory(uid, memory)
}

/**
 * Returns remembered portion for a food. Returns null if logged < 2 times.
 */
export function getPortionMemory(
  uid: string,
  foodId: string
): PortionMemory | null {
  const memory = loadMemory(uid)
  const entry = memory[foodId]
  if (!entry || entry.logCount < 2) return null
  return entry
}

/**
 * All portion memories sorted by most recently used.
 */
export function getAllPortionMemories(uid: string): PortionMemory[] {
  const memory = loadMemory(uid)
  return Object.values(memory).sort((a, b) => b.lastUsedAt - a.lastUsedAt)
}

/**
 * Clears all portion memory for a user. Call on account deletion.
 */
export function clearPortionMemory(uid: string): void {
  localStorage.removeItem(getStorageKey(uid))
}
