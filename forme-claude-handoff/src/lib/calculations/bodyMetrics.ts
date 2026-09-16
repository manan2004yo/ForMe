// ============================================================
// FORME — Body Metrics Calculations
// BMR, TDEE, Body Fat, Macro Targets
// ============================================================

import type { UserProfile, BodyMetrics, FitnessGoal, ActivityLevel } from '@/types'
import type { ActiveContext } from '@/store/userStore'

// ─── Activity Multipliers ─────────────────────────────────────

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
}

// ─── BMR (Mifflin-St Jeor) ───────────────────────────────────

export function calculateBMR(profile: Pick<UserProfile, 'weightKg' | 'heightCm' | 'age' | 'gender'>): number {
  const { weightKg, heightCm, age, gender } = profile
  
  if (gender === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5
  } else {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161
  }
}

// ─── TDEE ─────────────────────────────────────────────────────

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel])
}

// ─── BMI ──────────────────────────────────────────────────────

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1))
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal weight'
  if (bmi < 30) return 'Overweight'
  return 'Obese'
}

// ─── Caloric Target ───────────────────────────────────────────

export function getCaloricTarget(
  tdee: number,
  goal: FitnessGoal
): { target: number; strategy: 'deficit' | 'maintenance' | 'surplus'; deficitOrSurplus: number } {
  switch (goal) {
    case 'lose_fat':
    case 'get_lean':
      return {
        target: Math.max(1400, Math.round(tdee * 0.8)), // 20% deficit, min 1400
        strategy: 'deficit',
        deficitOrSurplus: Math.round(tdee * 0.2),
      }
    case 'build_muscle':
      return {
        target: Math.round(tdee * 1.1), // 10% surplus
        strategy: 'surplus',
        deficitOrSurplus: Math.round(tdee * 0.1),
      }
    case 'body_recomposition':
    case 'improve_fitness':
      return {
        target: Math.round(tdee * 0.95), // slight deficit
        strategy: 'maintenance',
        deficitOrSurplus: Math.round(tdee * 0.05),
      }
    case 'hybrid':
      return {
        target: Math.round(tdee * 0.9),
        strategy: 'deficit',
        deficitOrSurplus: Math.round(tdee * 0.1),
      }
    default:
      return { target: tdee, strategy: 'maintenance', deficitOrSurplus: 0 }
  }
}

// ─── Protein Target ───────────────────────────────────────────

export function getProteinTarget(weightKg: number, goal: FitnessGoal): number {
  switch (goal) {
    case 'build_muscle':
      return Math.round(weightKg * 2.0)
    case 'lose_fat':
    case 'get_lean':
      return Math.round(weightKg * 2.2) // Higher during cut to preserve muscle
    case 'body_recomposition':
      return Math.round(weightKg * 2.0)
    case 'improve_fitness':
      return Math.round(weightKg * 1.6)
    case 'hybrid':
      return Math.round(weightKg * 2.0)
    default:
      return Math.round(weightKg * 1.6)
  }
}

// ─── Macro Targets ────────────────────────────────────────────

export function getMacroTargets(
  caloricTarget: number,
  proteinTarget: number
): { carbTarget: number; fatTarget: number; fiberTarget: number } {
  const proteinCalories = proteinTarget * 4
  const fatCalories = caloricTarget * 0.25
  const carbCalories = caloricTarget - proteinCalories - fatCalories

  return {
    carbTarget: Math.max(50, Math.round(carbCalories / 4)),
    fatTarget: Math.round(fatCalories / 9),
    fiberTarget: 30, // Standard recommendation
  }
}

// ─── Body Fat Estimation ──────────────────────────────────────

// Using Navy method if waist/neck available, otherwise BMI-based range
export function estimateBodyFat(
  profile: Pick<UserProfile, 'gender' | 'heightCm' | 'waistCm' | 'neckCm' | 'hipCm' | 'weightKg' | 'age'>
): { low: number; high: number } | null {
  // Navy circumference method
  if (profile.waistCm && profile.neckCm) {
    let bf: number
    if (profile.gender === 'male') {
      bf = 86.01 * Math.log10(profile.waistCm - profile.neckCm) - 70.041 * Math.log10(profile.heightCm) + 36.76
    } else if (profile.hipCm) {
      bf = 163.205 * Math.log10(profile.waistCm + (profile.hipCm || 0) - profile.neckCm) - 97.684 * Math.log10(profile.heightCm) - 78.387
    } else {
      return getBMIBasedBodyFatRange(profile.weightKg, profile.heightCm, profile.age || 25, profile.gender as string)
    }
    return { low: Math.round(bf - 3), high: Math.round(bf + 3) }
  }

  return getBMIBasedBodyFatRange(
    profile.weightKg,
    profile.heightCm,
    (profile as any).age || 25,
    profile.gender as string
  )
}

function getBMIBasedBodyFatRange(weightKg: number, heightCm: number, age: number, gender: string): { low: number; high: number } {
  const bmi = calculateBMI(weightKg, heightCm)
  // Deurenberg formula (approximate)
  const isMale = gender === 'male'
  const bf = 1.2 * bmi + 0.23 * age - 10.8 * (isMale ? 1 : 0) - 5.4
  return {
    low: Math.max(3, Math.round(bf - 4)),
    high: Math.round(bf + 4),
  }
}

// ─── Full Body Metrics Calculation ───────────────────────────

export function calculateBodyMetrics(profile: UserProfile, context: ActiveContext = 'normal'): BodyMetrics {
  const bmr = calculateBMR(profile)
  const tdee = calculateTDEE(bmr, profile.activityLevel)
  const bmi = calculateBMI(profile.weightKg, profile.heightCm)
  const bmiCategory = getBMICategory(bmi)
  
  let { target: caloricTarget, strategy: caloricStrategy, deficitOrSurplus } = getCaloricTarget(tdee, profile.fitnessGoal)
  let proteinTarget = getProteinTarget(profile.weightKg, profile.fitnessGoal)

  // ─── CONTEXT ADJUSTMENTS ───
  if (context === 'travel' || context === 'restaurant' || context === 'family_dinner') {
    // When out of routine, shift to maintenance to reduce guilt and increase sustainability
    caloricTarget = tdee
    caloricStrategy = 'maintenance'
    deficitOrSurplus = 0
    // Slightly relax protein target (1.4g/kg) during these contexts
    proteinTarget = Math.round(profile.weightKg * 1.4)
  } else if (context === 'recovery') {
    // Recovery/sick days require maintenance or slight surplus for healing
    caloricTarget = Math.round(tdee * 1.05)
    caloricStrategy = 'maintenance'
    deficitOrSurplus = Math.round(tdee * 0.05)
    proteinTarget = Math.round(profile.weightKg * 1.8)
  }

  const { carbTarget, fatTarget, fiberTarget } = getMacroTargets(caloricTarget, proteinTarget)

  const bodyFatEst = estimateBodyFat(profile as any)
  
  let estimatedFatMassKg: number | undefined
  let estimatedLeanMassKg: number | undefined
  if (bodyFatEst) {
    const midBF = (bodyFatEst.low + bodyFatEst.high) / 2
    estimatedFatMassKg = parseFloat(((midBF / 100) * profile.weightKg).toFixed(1))
    estimatedLeanMassKg = parseFloat((profile.weightKg - estimatedFatMassKg).toFixed(1))
  }

  return {
    bmi,
    bmiCategory,
    bmr: Math.round(bmr),
    tdee,
    caloricTarget,
    caloricStrategy,
    deficitOrSurplus,
    proteinTarget,
    carbTarget,
    fatTarget,
    fiberTarget,
    bodyFatRange: bodyFatEst || undefined,
    estimatedFatMassKg,
    estimatedLeanMassKg,
  }
}

// ─── Trajectory Model ─────────────────────────────────────────

export function generateTrajectory(
  profile: UserProfile,
  metrics: BodyMetrics,
  months: number[] = [3, 6, 12, 18, 24]
) {
  return months.map(month => {
    const weeklyRateKg = metrics.caloricStrategy === 'deficit'
      ? -0.4 // avg 0.4 kg/week loss
      : metrics.caloricStrategy === 'surplus'
      ? 0.25  // avg 0.25 kg/week gain
      : 0    // maintenance/recomp

    const conservativeMultiplier = 0.6
    const excellentMultiplier = 1.3

    const weeksInPeriod = month * 4.33

    const expectedChange = weeklyRateKg * weeksInPeriod
    const conservativeChange = expectedChange * conservativeMultiplier
    const excellentChange = expectedChange * excellentMultiplier

    const startWeight = profile.weightKg
    const startBF = metrics.bodyFatRange
      ? (metrics.bodyFatRange.low + metrics.bodyFatRange.high) / 2
      : 20

    // Fat loss: 75% from fat, 25% protected by adequate protein
    const bfChangePerKg = metrics.caloricStrategy === 'deficit' ? 0.015 : -0.005

    return {
      month,
      conservative: {
        weightKg: parseFloat((startWeight + conservativeChange).toFixed(1)),
        bodyFatPercent: parseFloat((startBF + conservativeChange * bfChangePerKg * 100).toFixed(1)),
        leanMassKg: metrics.estimatedLeanMassKg
          ? parseFloat((metrics.estimatedLeanMassKg + conservativeChange * 0.25).toFixed(1))
          : undefined,
      },
      expected: {
        weightKg: parseFloat((startWeight + expectedChange).toFixed(1)),
        bodyFatPercent: parseFloat((startBF + expectedChange * bfChangePerKg * 100).toFixed(1)),
        leanMassKg: metrics.estimatedLeanMassKg
          ? parseFloat((metrics.estimatedLeanMassKg + expectedChange * 0.25).toFixed(1))
          : undefined,
      },
      excellent: {
        weightKg: parseFloat((startWeight + excellentChange).toFixed(1)),
        bodyFatPercent: parseFloat((startBF + excellentChange * bfChangePerKg * 100).toFixed(1)),
        leanMassKg: metrics.estimatedLeanMassKg
          ? parseFloat((metrics.estimatedLeanMassKg + excellentChange * 0.25).toFixed(1))
          : undefined,
      },
    }
  })
}

// ─── Estimated weekly fat loss in kg ─────────────────────────

export function estimateWeeklyChange(caloricDeficit: number): number {
  // 1 kg body fat ≈ 7700 kcal
  return parseFloat((caloricDeficit * 7 / 7700).toFixed(2))
}
