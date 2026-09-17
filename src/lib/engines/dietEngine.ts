// ============================================================
// FORME — Diet Plan Engine
// Generates personalized Indian meal plans
// ============================================================

import { FOOD_MAP, getNutritionForGrams } from '@/lib/data/indianFoods'
import type {
  BodyMetrics, DailyDietPlan,
  MealPlanItem, MealSlot,
  PlannedMeal,
  UserProfile
} from '@/types'

// ─── Meal Templates by Profile ───────────────────────────────

interface MealTemplate {
  slot: MealSlot
  label: string
  items: { foodId: string; quantity: number; unit: string; notes?: string }[]
}

function getBreakfastOptions(profile: UserProfile): MealTemplate[] {
  const isVeg = profile.dietType === 'vegetarian' || profile.dietType === 'vegan'
  const hasEggs = profile.eatsEggs
  const lowBudget = (profile.monthlyFoodBudget || 4000) < 3000
  const minCooking = profile.cookingAbility === 'none' || profile.cookingAbility === 'basic'

  const options: MealTemplate[] = []

  if (hasEggs) {
    options.push({
      slot: 'breakfast', label: 'Breakfast',
      items: [
        { foodId: 'egg_whole', quantity: 2, unit: 'piece', notes: 'Boiled or scrambled' },
        { foodId: 'roti_wheat', quantity: 2, unit: 'piece' },
        { foodId: 'dahi', quantity: 1, unit: 'katori' },
      ]
    })
    if (!minCooking) {
      options.push({
        slot: 'breakfast', label: 'Breakfast',
        items: [
          { foodId: 'egg_bhurji', quantity: 1, unit: 'serving' },
          { foodId: 'roti_wheat', quantity: 2, unit: 'piece' },
          { foodId: 'masala_chai', quantity: 1, unit: 'cup' },
        ]
      })
    }
  }

  if (isVeg && !minCooking) {
    options.push({
      slot: 'breakfast', label: 'Breakfast',
      items: [
        { foodId: 'besan_chilla', quantity: 2, unit: 'piece' },
        { foodId: 'dahi', quantity: 1, unit: 'katori' },
        { foodId: 'masala_chai', quantity: 1, unit: 'cup' },
      ]
    })
  }

  if (!minCooking) {
    options.push({
      slot: 'breakfast', label: 'Breakfast',
      items: [
        { foodId: 'poha', quantity: 1, unit: 'plate' },
        { foodId: hasEggs ? 'egg_whole' : 'dahi', quantity: hasEggs ? 2 : 1, unit: hasEggs ? 'piece' : 'katori' },
        { foodId: 'masala_chai', quantity: 1, unit: 'cup' },
      ]
    })
  }

  // Always available — low effort
  options.push({
    slot: 'breakfast', label: 'Breakfast',
    items: [
      { foodId: 'oats_cooked', quantity: 1, unit: 'katori', notes: 'Add milk and banana' },
      { foodId: 'banana', quantity: 1, unit: 'piece' },
      { foodId: lowBudget ? 'peanuts' : 'almonds', quantity: lowBudget ? 30 : 25, unit: 'gram' },
    ]
  })

  if (profile.eatingEnvironment === 'hostel') {
    options.push({
      slot: 'breakfast', label: 'Breakfast',
      items: [
        { foodId: 'roti_wheat', quantity: 2, unit: 'piece', notes: 'Whatever is available at mess' },
        { foodId: 'dahi', quantity: 1, unit: 'katori', notes: 'If available' },
        { foodId: 'banana', quantity: 1, unit: 'piece', notes: 'Buy from canteen' },
      ]
    })
  }

  return options
}

function getLunchOptions(profile: UserProfile): MealTemplate[] {
  const isVeg = profile.dietType === 'vegetarian' || profile.dietType === 'vegan'
  
  const options: MealTemplate[] = [
    {
      slot: 'lunch', label: 'Lunch',
      items: [
        { foodId: 'roti_wheat', quantity: 3, unit: 'piece' },
        { foodId: 'toor_dal_cooked', quantity: 1, unit: 'katori' },
        { foodId: 'mixed_sabzi', quantity: 1, unit: 'katori' },
        { foodId: 'dahi', quantity: 1, unit: 'katori' },
      ]
    },
    {
      slot: 'lunch', label: 'Lunch',
      items: [
        { foodId: 'rice_cooked', quantity: 1, unit: 'katori' },
        { foodId: 'rajma_cooked', quantity: 1, unit: 'katori' },
        { foodId: 'dahi', quantity: 1, unit: 'katori' },
        { foodId: 'roti_wheat', quantity: 1, unit: 'piece' },
      ]
    },
  ]

  if (profile.eatsEggs && !isVeg) {
    options.push({
      slot: 'lunch', label: 'Lunch',
      items: [
        { foodId: 'rice_cooked', quantity: 1, unit: 'katori' },
        { foodId: 'toor_dal_cooked', quantity: 1, unit: 'katori' },
        { foodId: 'egg_whole', quantity: 2, unit: 'piece' },
        { foodId: 'mixed_sabzi', quantity: 1, unit: 'katori' },
      ]
    })
  }

  if (!isVeg && profile.eatsMeat) {
    options.push({
      slot: 'lunch', label: 'Lunch',
      items: [
        { foodId: 'rice_cooked', quantity: 1, unit: 'katori' },
        { foodId: 'chicken_curry', quantity: 1, unit: 'katori' },
        { foodId: 'dahi', quantity: 1, unit: 'katori' },
        { foodId: 'roti_wheat', quantity: 1, unit: 'piece' },
      ]
    })
  }

  return options
}

function getDinnerOptions(profile: UserProfile): MealTemplate[] {
  const isVeg = profile.dietType === 'vegetarian' || profile.dietType === 'vegan'
  
  const options: MealTemplate[] = [
    {
      slot: 'dinner', label: 'Dinner',
      items: [
        { foodId: 'roti_wheat', quantity: 3, unit: 'piece' },
        { foodId: 'toor_dal_cooked', quantity: 1, unit: 'katori' },
        { foodId: 'mixed_sabzi', quantity: 1, unit: 'katori' },
      ]
    },
    {
      slot: 'dinner', label: 'Dinner',
      items: [
        { foodId: 'roti_wheat', quantity: 2, unit: 'piece' },
        { foodId: 'chole_cooked', quantity: 1, unit: 'katori' },
        { foodId: 'dahi', quantity: 1, unit: 'katori' },
      ]
    },
    {
      slot: 'dinner', label: 'Dinner',
      items: [
        { foodId: 'rice_cooked', quantity: 1, unit: 'katori' },
        { foodId: 'dal_makhani', quantity: 1, unit: 'katori' },
        { foodId: 'mixed_sabzi', quantity: 1, unit: 'katori' },
      ]
    },
  ]

  if (!isVeg && profile.eatsMeat) {
    options.push({
      slot: 'dinner', label: 'Dinner',
      items: [
        { foodId: 'roti_wheat', quantity: 3, unit: 'piece' },
        { foodId: 'chicken_curry', quantity: 1, unit: 'katori' },
        { foodId: 'mixed_sabzi', quantity: 1, unit: 'katori' },
      ]
    })
  }

  return options
}

function getSnackOptions(profile: UserProfile): MealTemplate[] {
  const lowBudget = (profile.monthlyFoodBudget || 4000) < 3000
  const hasEggs = profile.eatsEggs

  return [
    {
      slot: 'snack', label: 'Snack',
      items: [
        { foodId: lowBudget ? 'peanuts' : 'almonds', quantity: lowBudget ? 30 : 25, unit: 'gram' },
        { foodId: 'banana', quantity: 1, unit: 'piece' },
      ]
    },
    {
      slot: 'snack', label: 'Snack',
      items: [
        { foodId: 'dahi', quantity: 1, unit: 'katori' },
        { foodId: hasEggs ? 'egg_whole' : 'soya_chunks', quantity: hasEggs ? 2 : 50, unit: hasEggs ? 'piece' : 'gram' },
      ]
    },
    {
      slot: 'snack', label: 'Snack',
      items: [
        { foodId: 'masala_chai', quantity: 1, unit: 'cup' },
        { foodId: lowBudget ? 'peanuts' : 'peanut_butter', quantity: lowBudget ? 30 : 2, unit: lowBudget ? 'gram' : 'tablespoon' },
      ]
    },
  ]
}

// ─── Template to Planned Meal ─────────────────────────────────

function templateToMeal(template: MealTemplate, katoriGrams: number): PlannedMeal {
  const items: MealPlanItem[] = template.items.map(item => {
    const food = FOOD_MAP[item.foodId]
    if (!food) return null
    
    const unit = item.unit as any
    let grams: number
    if (unit === 'gram') {
      grams = item.quantity
    } else if (unit === 'katori') {
      grams = katoriGrams * item.quantity
    } else {
      grams = (food.gramsPerUnit[unit] || food.gramsPerUnit['piece'] || 100) * item.quantity
    }
    
    const nutrition = getNutritionForGrams(food, grams)
    const cost = food.estimatedCostPer100g ? (food.estimatedCostPer100g * grams / 100) : undefined

    return {
      foodName: food.name,
      quantity: item.quantity,
      unit,
      nutrition,
      notes: item.notes,
      estimatedCost: cost,
    } as MealPlanItem
  }).filter(Boolean) as MealPlanItem[]

  const totals = items.reduce((acc, item) => ({
    calories: acc.calories + item.nutrition.calories,
    protein: parseFloat((acc.protein + item.nutrition.protein).toFixed(1)),
    carbs: parseFloat((acc.carbs + item.nutrition.carbs).toFixed(1)),
    fat: parseFloat((acc.fat + item.nutrition.fat).toFixed(1)),
    fiber: parseFloat((acc.fiber + item.nutrition.fiber).toFixed(1)),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })

  const cost = items.reduce((acc, item) => acc + ((item as any).estimatedCost || 0), 0)

  return {
    slot: template.slot,
    label: template.label,
    items,
    totals,
    estimatedCost: Math.round(cost),
  }
}

// ─── Main Diet Plan Generator ─────────────────────────────────

export function generateDietPlan(profile: UserProfile, _metrics: BodyMetrics): DailyDietPlan {
  const katoriGrams = profile.preferredKatoriGrams || 150
  
  const breakfastTemplates = getBreakfastOptions(profile)
  const lunchTemplates = getLunchOptions(profile)
  const dinnerTemplates = getDinnerOptions(profile)
  const snackTemplates = getSnackOptions(profile)

  // Pick best-scoring template (first for now, can be made smarter)
  const breakfast = templateToMeal(breakfastTemplates[0], katoriGrams)
  const lunch = templateToMeal(lunchTemplates[0], katoriGrams)
  const snack = templateToMeal(snackTemplates[0], katoriGrams)
  const dinner = templateToMeal(dinnerTemplates[0], katoriGrams)

  const meals = [breakfast, lunch, snack, dinner]

  // Calculate plan totals
  const totals = meals.reduce((acc, meal) => ({
    calories: acc.calories + meal.totals.calories,
    protein: parseFloat((acc.protein + meal.totals.protein).toFixed(1)),
    carbs: parseFloat((acc.carbs + meal.totals.carbs).toFixed(1)),
    fat: parseFloat((acc.fat + meal.totals.fat).toFixed(1)),
    fiber: parseFloat((acc.fiber + meal.totals.fiber).toFixed(1)),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })

  const dailyCost = meals.reduce((acc, meal) => acc + (meal.estimatedCost || 0), 0)

  return {
    id: `plan_${Date.now()}`,
    userId: profile.id,
    meals,
    totals,
    estimatedDailyCost: dailyCost,
    generatedAt: new Date().toISOString(),
  }
}

// ─── What Should I Eat Now? ───────────────────────────────────

export function getEatNowRecommendation(
  consumed: { calories: number; protein: number; carbs: number; fat: number; fiber: number },
  targets: BodyMetrics,
  profile: UserProfile
): string {
  const calRemaining = targets.caloricTarget - consumed.calories
  const proteinRemaining = targets.proteinTarget - consumed.protein

  const msgs: string[] = []

  if (proteinRemaining > 20) {
    const sources: string[] = []
    if (profile.eatsEggs) sources.push('2 boiled eggs (~13g protein)')
    if (profile.eatsDairy) sources.push('1 katori curd (~5g) + 30g peanuts (~8g)')
    sources.push('50g soya chunks cooked (~26g protein)')
    msgs.push(`You need about ${Math.round(proteinRemaining)}g more protein. Try: ${sources.slice(0, 2).join(' or ')}.`)
  }

  if (calRemaining > 300) {
    msgs.push(`You have about ${Math.round(calRemaining)} kcal left. A light meal of roti + dal + curd fits well.`)
  } else if (calRemaining < -100) {
    msgs.push(`You've slightly exceeded your calorie target today. A light snack like fruit or chaach would be fine.`)
  } else {
    msgs.push(`You're close to your calorie target. A small snack of fruits or curd is fine.`)
  }

  return msgs.join(' ')
}
