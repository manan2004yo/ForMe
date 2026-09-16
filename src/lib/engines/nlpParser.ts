// ============================================================
// FORME — NLP Food Parser
// Parses natural language Indian food descriptions
// ============================================================

import { INDIAN_FOODS, getNutritionForGrams } from '@/lib/data/indianFoods'
import type { FoodItem, PortionUnit, ParsedFoodEntry, LoggedFoodItem, NutritionConfidence } from '@/types'
import { v4 as uuidv4 } from 'uuid'

// ─── Unit Patterns ────────────────────────────────────────────

const UNIT_ALIASES: Record<string, PortionUnit> = {
  katori: 'katori', bowl: 'katori', katora: 'katori',
  glass: 'glass', glas: 'glass',
  cup: 'cup',
  plate: 'plate',
  piece: 'piece', pcs: 'piece', pc: 'piece',
  roti: 'piece', chapati: 'piece', paratha: 'piece',
  slice: 'slice',
  spoon: 'spoon',
  tablespoon: 'tablespoon', tbsp: 'tablespoon',
  teaspoon: 'teaspoon', tsp: 'teaspoon',
  gram: 'gram', grams: 'gram', g: 'gram', gm: 'gram',
  ml: 'ml', mL: 'ml',
  serving: 'serving',
  medium: 'medium',
  large: 'large',
  small: 'small',
}

// ─── Number words ─────────────────────────────────────────────

const NUM_WORDS: Record<string, number> = {
  half: 0.5, 'ek': 1, 'ek aur aadha': 1.5,
  'do': 2, 'teen': 3, 'char': 4,
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  'a': 1, 'an': 1,
  'couple': 2,
}

// ─── Main Parser ──────────────────────────────────────────────

export function parseNaturalLanguageFoodEntry(text: string): ParsedFoodEntry {
  // Split by common separators
  const segments = text
    .toLowerCase()
    .replace(/\bor\b/g, ',')
    .replace(/\band\b/g, ',')
    .replace(/\baur\b/g, ',')
    .replace(/\+/g, ',')
    .split(/[,;।\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  const parsedItems = segments.map(segment => parseSegment(segment)).filter(Boolean) as ParsedFoodEntry['parsedItems']

  return {
    originalText: text,
    parsedItems,
  }
}

function parseSegment(segment: string): ParsedFoodEntry['parsedItems'][0] | null {
  segment = segment.trim()
  if (!segment) return null

  // Try to extract quantity
  let quantity = 1
  let remainingText = segment

  // Pattern: "2 roti", "3 pieces of dal"
  const quantityMatch = segment.match(/^(\d+(?:\.\d+)?|½|¼|¾)\s*(.+)/)
  if (quantityMatch) {
    const numStr = quantityMatch[1]
    quantity = numStr === '½' ? 0.5 : numStr === '¼' ? 0.25 : numStr === '¾' ? 0.75 : parseFloat(numStr)
    remainingText = quantityMatch[2]
  } else {
    // Check word numbers
    for (const [word, val] of Object.entries(NUM_WORDS)) {
      if (remainingText.startsWith(word + ' ')) {
        quantity = val
        remainingText = remainingText.slice(word.length + 1).trim()
        break
      }
    }
  }

  // Try to match unit
  let unit: PortionUnit = 'piece'
  let foodText = remainingText

  for (const [unitWord, unitVal] of Object.entries(UNIT_ALIASES)) {
    const unitPattern = new RegExp(`\\b${unitWord}\\b\\s*(?:of\\s*)?`, 'i')
    if (unitPattern.test(remainingText)) {
      unit = unitVal
      foodText = remainingText.replace(unitPattern, '').trim()
      break
    }
  }

  // Find food item
  const foodItem = findBestFoodMatch(foodText)

  return {
    rawText: segment,
    foodItem: foodItem || undefined,
    quantity,
    unit,
    confidence: foodItem ? 0.8 : 0.3,
  }
}

function findBestFoodMatch(text: string): FoodItem | null {
  if (!text) return null
  const query = text.toLowerCase().trim()

  // Exact alias match first
  for (const food of INDIAN_FOODS) {
    for (const alias of food.aliases) {
      if (alias.toLowerCase() === query) return food
    }
  }

  // Partial alias match
  for (const food of INDIAN_FOODS) {
    for (const alias of food.aliases) {
      if (query.includes(alias.toLowerCase()) || alias.toLowerCase().includes(query)) {
        return food
      }
    }
  }

  // Tag match
  for (const food of INDIAN_FOODS) {
    if (food.tags.some(tag => query.includes(tag) || tag.includes(query))) {
      return food
    }
  }

  // Name match
  for (const food of INDIAN_FOODS) {
    if (food.name.toLowerCase().includes(query) || query.includes(food.name.toLowerCase())) {
      return food
    }
  }

  return null
}

// ─── Convert ParsedEntry to LoggedFoodItems ──────────────────

export function convertToLoggedItems(parsed: ParsedFoodEntry, customKatoriGrams = 150): LoggedFoodItem[] {
  return parsed.parsedItems
    .filter(item => item.foodItem)
    .map(item => {
      const food = item.foodItem!
      const gramsPerUnit = food.gramsPerUnit[item.unit] || food.gramsPerUnit['gram'] || 100
      const actualGrams = item.unit === 'gram' ? item.quantity : gramsPerUnit * item.quantity
      
      // Override katori size
      const finalGrams = item.unit === 'katori'
        ? customKatoriGrams * item.quantity
        : actualGrams

      const nutrition = getNutritionForGrams(food, finalGrams)

      return {
        id: uuidv4(),
        foodItemId: food.id,
        foodName: food.name,
        quantity: item.quantity,
        unit: item.unit,
        gramsConsumed: Math.round(finalGrams),
        nutrition,
        confidence: finalGrams > 0 ? 'moderate' : 'lower' as NutritionConfidence,
      }
    })
}

// ─── Sum Nutrition ────────────────────────────────────────────

export function sumNutrition(items: LoggedFoodItem[]) {
  return items.reduce((acc, item) => ({
    calories: Math.round(acc.calories + item.nutrition.calories),
    protein: parseFloat((acc.protein + item.nutrition.protein).toFixed(1)),
    carbs: parseFloat((acc.carbs + item.nutrition.carbs).toFixed(1)),
    fat: parseFloat((acc.fat + item.nutrition.fat).toFixed(1)),
    fiber: parseFloat((acc.fiber + item.nutrition.fiber).toFixed(1)),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })
}
