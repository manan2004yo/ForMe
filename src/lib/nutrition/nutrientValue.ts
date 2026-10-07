import { NutrientValue, Provenance } from '@/types'

export function createNutrient(
  value: number | null,
  unit: string,
  state: NutrientValue['state'] = value === null ? 'unknown' : 'known',
  provenance: Provenance[] = [],
  atwater_consistent?: boolean
): NutrientValue {
  return { 
    value, 
    unit, 
    state, 
    provenance,
    validationFlags: atwater_consistent !== undefined ? { atwater_consistent } : undefined
  }
}

export function sumNutrients(nutrients: NutrientValue[], targetUnit: string): NutrientValue {
  let sum = 0
  let hasUnknown = false
  let hasConflict = false
  const allProvenance: Provenance[] = []

  for (const n of nutrients) {
    if (n.provenance) allProvenance.push(...n.provenance)
    if (n.state === 'unknown') hasUnknown = true
    if (n.state === 'conflict') hasConflict = true
    
    if (n.value !== null) {
      sum += n.value
    }
  }

  const finalState = hasConflict ? 'conflict' : (hasUnknown ? 'unknown' : 'known')
  return {
    value: finalState === 'known' ? sum : (sum > 0 ? sum : null), // minimum known value
    unit: targetUnit,
    state: finalState,
    provenance: allProvenance
  }
}

export function scaleNutrient(nutrient: NutrientValue, multiplier: number): NutrientValue {
  if (nutrient.value === null) return { ...nutrient }
  return { ...nutrient, value: nutrient.value * multiplier }
}

export function formatNutrientValue(n: NutrientValue | undefined, hideUnit: boolean = false): string {
  if (!n || n.state === 'unknown' && (!n.value || n.value === 0)) return '—'
  const val = Math.round(n.value ?? 0)
  const unit = hideUnit ? '' : n.unit
  if (n.state === 'known') return `${val}${unit}`
  if (n.state === 'trace') return `<1${unit}`
  if (n.value !== null && n.value > 0) return `>${val}${unit}`
  return '—'
}

export function getEmptyNutrition(): import('@/types').NutritionInfo {
  return {
    calories: createNutrient(0, 'kcal', 'known'),
    protein: createNutrient(0, 'g', 'known'),
    carbs: createNutrient(0, 'g', 'known'),
    fat: createNutrient(0, 'g', 'known'),
    fiber: createNutrient(0, 'g', 'known')
  }
}
