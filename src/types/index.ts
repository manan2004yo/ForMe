// ============================================================
// FORME — Complete TypeScript Type Definitions
// ============================================================

// ─── User & Auth ─────────────────────────────────────────────

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active'
export type Lifestyle = 'student' | 'working_professional' | 'business_owner' | 'homemaker' | 'retired' | 'other'
export type FitnessGoal = 'build_muscle' | 'lose_fat' | 'body_recomposition' | 'get_lean' | 'improve_fitness' | 'hybrid'
export type TrainingExperience = 'beginner' | 'intermediate' | 'advanced'
export type TrainingLocation = 'gym' | 'home' | 'hybrid'
export type ComplexityMode = 'easy' | 'smart' | 'precision'
export type DietType = 'vegetarian' | 'non_vegetarian' | 'vegan' | 'jain' | 'other'
export type EatingEnvironment = 'home' | 'hostel' | 'office' | 'tiffin' | 'restaurant' | 'combination'
export type CookingAbility = 'none' | 'basic' | 'regular' | 'enjoys'
export type WorkoutDuration = '20-30' | '30-45' | '45-60' | '60-90' | '90+'
export type BodyFatSource = 'dexa' | 'inbody' | 'smart_scale' | 'manual' | 'other'

export interface UserProfile {
  id: string
  email: string
  name: string
  avatar?: string

  // Personal
  age: number
  gender: Gender
  heightCm: number
  weightKg: number
  activityLevel: ActivityLevel

  // Lifestyle & Diet
  lifestyle: Lifestyle
  dietType: DietType
  eatsEggs: boolean
  eatsMeat: boolean
  eatsFish: boolean
  eatsDairy: boolean
  allergies: string
  monthlyFoodBudget?: number // in INR

  // Food context
  cookingAbility: CookingAbility
  eatingEnvironment: EatingEnvironment
  foodAvailability: string[] // list of available foods

  // Training
  fitnessGoal: FitnessGoal
  trainingExperience: TrainingExperience
  trainingLocation: TrainingLocation
  availableEquipment: string[]
  trainingDays: number[] // 0=Sun, 1=Mon, ... 6=Sat
  gymClosedDays: number[]
  workoutDuration: WorkoutDuration
  physicalLimitations: string

  // Preferences
  complexityMode: ComplexityMode
  mealFrequency: number // meals per day
  preferredKatoriGrams: number // default 150

  // Body composition (optional)
  waistCm?: number
  neckCm?: number
  hipCm?: number
  bodyFatPercent?: number
  bodyFatSource?: BodyFatSource

  onboardingComplete: boolean
  createdAt: string
  updatedAt: string
}

// ─── Calculated Metrics ───────────────────────────────────────

export interface BodyMetrics {
  bmi: number
  bmiCategory: string
  bmr: number
  tdee: number
  caloricTarget: number
  caloricStrategy: 'deficit' | 'maintenance' | 'surplus'
  deficitOrSurplus: number
  proteinTarget: number // grams
  carbTarget: number    // grams
  fatTarget: number     // grams
  fiberTarget: number   // grams
  bodyFatRange?: { low: number; high: number }
  estimatedFatMassKg?: number
  estimatedLeanMassKg?: number
}

// ─── Food & Nutrition ─────────────────────────────────────────

export type PortionUnit =
  | 'katori' | 'glass' | 'cup' | 'bowl' | 'plate' | 'piece'
  | 'slice' | 'spoon' | 'tablespoon' | 'teaspoon' | 'gram'
  | 'ml' | 'medium' | 'large' | 'small' | 'serving'

export type NutritionConfidence = 'high' | 'moderate' | 'lower'

export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'pre_workout' | 'post_workout'

export interface NutritionInfo {
  calories: number
  protein: number  // g
  carbs: number    // g
  fat: number      // g
  fiber: number    // g
  saturatedFat?: number
  addedSugar?: number
  calcium?: number // mg
  iron?: number    // mg
  vitaminC?: number // mg
  vitaminD?: number // IU
  b12?: number     // mcg
  sodium?: number  // mg
}

export interface FoodItem {
  id: string
  name: string
  nameHindi?: string
  nameLocal?: string
  category: string
  subcategory?: string
  region?: string
  portionUnits: PortionUnit[]
  defaultPortion: number
  defaultUnit: PortionUnit
  gramsPerUnit: Record<string, number>
  nutrition: NutritionInfo // per 100g
  tags: string[]
  aliases: string[]
  isIndian: boolean
  estimatedCostPer100g?: number // INR
}

export interface LoggedFoodItem {
  id: string
  foodItemId: string
  foodName: string
  quantity: number
  unit: PortionUnit
  gramsConsumed: number
  nutrition: NutritionInfo
  confidence: NutritionConfidence
  notes?: string
}

export interface FoodLogEntry {
  id: string
  userId: string
  date: string // YYYY-MM-DD
  meal: MealSlot
  foods: LoggedFoodItem[]
  totals: NutritionInfo
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface SavedMeal {
  id: string
  userId: string
  name: string
  foods: LoggedFoodItem[]
  totals: NutritionInfo
  meal: MealSlot
  tags: string[]
  createdAt: string
}

export interface FamilyRecipe {
  id: string
  userId: string
  name: string
  rawIngredients: LoggedFoodItem[]
  totalMacros: NutritionInfo
  totalServings: number
  servingUnit: string // e.g., 'katori', 'plate', 'grams'
  createdAt: string
}

// ─── Diet Plan ────────────────────────────────────────────────

export interface MealPlanItem {
  foodName: string
  quantity: number
  unit: PortionUnit
  nutrition: NutritionInfo
  notes?: string
}

export interface PlannedMeal {
  slot: MealSlot
  label: string
  items: MealPlanItem[]
  totals: NutritionInfo
  prepTime?: number // minutes
  estimatedCost?: number // INR
}

export interface DailyDietPlan {
  id: string
  userId: string
  date?: string
  meals: PlannedMeal[]
  totals: NutritionInfo
  estimatedDailyCost?: number
  notes?: string
  generatedAt: string
}

// ─── Workout & Exercise ───────────────────────────────────────

export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'core'
  | 'full_body' | 'forearms'

export type ExerciseType = 'compound' | 'isolation' | 'cardio' | 'bodyweight'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type Equipment = 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'resistance_band' | 'pull_up_bar' | 'bench' | 'none'

export interface Exercise {
  id: string
  name: string
  muscleGroup: MuscleGroup
  secondaryMuscles: MuscleGroup[]
  type: ExerciseType
  equipment: Equipment[]
  difficulty: Difficulty
  instructions: string[]
  tips: string[]
  homeAlternative?: string
  isCompound: boolean
}

export interface WorkoutSet {
  setNumber: number
  targetReps: [number, number] // [min, max]
  weight?: number // kg
  completedReps?: number
  rir?: number // reps in reserve
  notes?: string
}

export interface PlannedExercise {
  id?: string
  exerciseId: string
  exerciseName: string
  muscleGroup: MuscleGroup
  sets: number
  repRange: [number, number]
  restSeconds: number
  rir: number
  notes?: string
  difficulty: Difficulty
}

export interface WorkoutDay {
  dayLabel: string // e.g. "Chest + Triceps"
  dayOfWeek: number
  muscleGroups: MuscleGroup[]
  exercises: PlannedExercise[]
  estimatedDurationMin: number
}

export interface WorkoutPlan {
  id: string
  userId: string
  splitName: string // "PPL" | "Upper Lower" | "Full Body" | etc.
  days: WorkoutDay[]
  daysPerWeek: number
  goal: FitnessGoal
  generatedAt: string
}

export interface LoggedSet {
  weight?: number
  reps: number
  rir?: number
  trackBpm?: number
}

export interface LoggedExercise {
  exerciseId: string
  exerciseName: string
  muscleGroup: MuscleGroup
  sets: LoggedSet[]
  notes?: string
}

export interface WorkoutLogEntry {
  id: string
  userId: string
  date: string
  planDayLabel: string
  exercises: LoggedExercise[]
  durationMin?: number
  notes?: string
  completed: boolean
  createdAt: string
}

// ─── Progress Tracking ────────────────────────────────────────

export interface WeightEntry {
  id: string
  userId: string
  date: string
  weightKg: number
  notes?: string
}

export interface WaistEntry {
  id: string
  userId: string
  date: string
  waistCm: number
  chestCm?: number
  armsCm?: number
  thighsCm?: number
  hipsCm?: number
  notes?: string
}

export interface BodyCompositionEntry {
  id: string
  userId: string
  date: string
  weightKg: number
  waistCm?: number
  bodyFatPercent?: number
  fatMassKg?: number
  leanMassKg?: number
  source?: BodyFatSource
}

export interface StrengthRecord {
  exerciseId: string
  exerciseName: string
  date: string
  weightKg: number
  reps: number
  oneRepMaxEstimate?: number
}

// ─── Weekly Report ────────────────────────────────────────────

export interface WeeklyReport {
  weekStartDate: string
  weekEndDate: string
  avgCalories: number
  avgProtein: number
  avgFiber: number
  caloricTarget: number
  proteinTarget: number
  workoutsCompleted: number
  workoutsPlanned: number
  avgWeight?: number
  weightChange?: number
  waistChange?: number
  topInsight: string
  biggestWin: string
  biggestOpportunity: string
  nextWeekPriorities: string[]
}

// ─── Trajectory ───────────────────────────────────────────────

export interface TrajectoryPoint {
  month: number
  conservative: { weightKg: number; bodyFatPercent?: number; leanMassKg?: number }
  expected: { weightKg: number; bodyFatPercent?: number; leanMassKg?: number }
  excellent: { weightKg: number; bodyFatPercent?: number; leanMassKg?: number }
}

// ─── NLP Parser ──────────────────────────────────────────────

export interface ParsedFoodEntry {
  originalText: string
  parsedItems: {
    rawText: string
    foodItem?: FoodItem
    quantity: number
    unit: PortionUnit
    confidence: number
  }[]
}

// ─── Insights ────────────────────────────────────────────────

export interface Insight {
  id: string
  type: 'nutrition' | 'training' | 'progress' | 'recovery' | 'adherence'
  priority: 'high' | 'medium' | 'low'
  title: string
  body: string
  actionText?: string
  actionRoute?: string
  date: string
}

// ─── UI State ────────────────────────────────────────────────

export type AppRoute =
  | 'landing' | 'login' | 'signup' | 'onboarding'
  | 'home' | 'eat' | 'plan' | 'train' | 'progress' | 'profile'
  | 'settings' | 'privacy'

export interface UIState {
  activeNav: AppRoute
  isLoading: boolean
  theme: 'light' | 'dark'
  toasts: Toast[]
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}
