// ============================================================
// FORME — Canonical per-100g nutrient profile
// ============================================================
// ONE place that defines which nutrients we track per 100g and how
// unknown values convert to and from the number-typed display shape.
// Unknown is null, never 0. To track a new nutrient: add it to
// TRACKED_NUTRIENTS and to NumericPer100g.
// ============================================================

export const TRACKED_NUTRIENTS = [
  'calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium',
] as const

export type TrackedNutrient = typeof TRACKED_NUTRIENTS[number]

/** Canonical per-100g profile. null = unknown (never 0). */
export type NutrientProfile = Record<TrackedNutrient, number | null>

/** Number-typed shape used by display math. Unknown is tracked in a separate list. */
export interface NumericPer100g {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  /** Optional extras. Absent means unknown (never 0). */
  sugar?: number
  sodium?: number
}

const REQUIRED_DISPLAY_KEYS = ['calories', 'protein', 'carbs', 'fat', 'fiber'] as const

/** Canonical profile -> display shape plus the list of unknown nutrient names. */
export function profileToDisplay(profile: Partial<NutrientProfile>): {
  per100g: NumericPer100g
  unknownFields: string[]
} {
  const unknownFields: string[] = []
  const num = (key: (typeof REQUIRED_DISPLAY_KEYS)[number]): number => {
    const v = profile[key]
    if (v === null || v === undefined) {
      unknownFields.push(key)
      return 0
    }
    return v
  }
  const per100g: NumericPer100g = {
    calories: num('calories'),
    protein: num('protein'),
    carbs: num('carbs'),
    fat: num('fat'),
    fiber: num('fiber'),
  }
  if (profile.sugar != null) per100g.sugar = profile.sugar
  if (profile.sodium != null) per100g.sodium = profile.sodium
  return { per100g, unknownFields }
}

/** Display shape plus unknown list -> canonical profile. Unknown or absent becomes null. */
export function displayToProfile(per100g: NumericPer100g, unknownFields: string[]): NutrientProfile {
  const result = {} as NutrientProfile
  for (const key of TRACKED_NUTRIENTS) {
    if (unknownFields.includes(key)) {
      result[key] = null
    } else {
      const v = per100g[key]
      result[key] = v === undefined ? null : v
    }
  }
  return result
}

/** Scale a per-100g display shape to a gram quantity (same rounding as the existing portion math). */
export function scalePer100g(per100g: NumericPer100g, grams: number): NumericPer100g {
  const ratio = grams / 100
  return {
    calories: Math.round(per100g.calories * ratio),
    protein: parseFloat((per100g.protein * ratio).toFixed(1)),
    carbs: parseFloat((per100g.carbs * ratio).toFixed(1)),
    fat: parseFloat((per100g.fat * ratio).toFixed(1)),
    fiber: parseFloat((per100g.fiber * ratio).toFixed(1)),
    ...(per100g.sugar !== undefined && { sugar: parseFloat((per100g.sugar * ratio).toFixed(1)) }),
    ...(per100g.sodium !== undefined && { sodium: Math.round(per100g.sodium * ratio) }),
  }
}
