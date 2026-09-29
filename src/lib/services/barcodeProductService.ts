// ============================================================
// FORME — Barcode Product Service
// ============================================================
// Abstraction layer over Open Food Facts.
// To swap to Edamam: replace fetchFromOpenFoodFacts and
// map its response to ScannedProduct. Nothing else changes.
// ============================================================

export interface ScannedProduct {
  barcode: string
  name: string
  brand: string | null
  /** Per 100g */
  per100g: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
  servingSizeG: number | null
  /** 'manufacturer' = real barcode DB data, 'estimated' = fallback, 'local' = prebuilt DB, 'custom' = user added */
  dataSource: 'manufacturer' | 'estimated' | 'local' | 'custom'
  imageUrl: string | null
}

export type BarcodeProductResult =
  | { status: 'found'; product: ScannedProduct }
  | { status: 'not_found' }
  | { status: 'missing_nutrition'; name: string }
  | { status: 'network_error'; message: string }

export async function fetchProductByBarcode(barcode: string): Promise<BarcodeProductResult> {
  try {
    const response = await fetch(
      `/api/barcode/${barcode}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return { status: 'network_error', message: `HTTP ${response.status}` }
    }

    const data = await response.json()

    if (data.status !== 1 || !data.product) {
      return { status: 'not_found' }
    }

    const p = data.product

    // If the product name is predominantly non-Latin script (Hebrew, Cyrillic,
    // CJK, Arabic, etc.), treat as not_found rather than show unreadable garbage.
    if (p.product_name && isPrimarilyNonLatinScript(p.product_name)) {
      return { status: 'not_found' }
    }

    const n = p.nutriments ?? {}

    const calories = n['energy-kcal_100g'] ?? n['energy_100g'] ?? 0
    const protein  = n['proteins_100g'] ?? 0
    const carbs    = n['carbohydrates_100g'] ?? 0
    const fat      = n['fat_100g'] ?? 0
    const fiber    = n['fiber_100g'] ?? 0

    // Reject products with no meaningful nutrition data
    if (calories === 0 && protein === 0 && carbs === 0 && fat === 0) {
      return { 
        status: 'missing_nutrition', 
        name: p.product_name ?? 'Unknown Product' 
      }
    }

    const product: ScannedProduct = {
      barcode,
      name: p.product_name ?? 'Unknown Product',
      brand: p.brands ?? null,
      per100g: {
        calories: Math.round(calories),
        protein: parseFloat(Number(protein).toFixed(1)),
        carbs:   parseFloat(Number(carbs).toFixed(1)),
        fat:     parseFloat(Number(fat).toFixed(1)),
        fiber:   parseFloat(Number(fiber).toFixed(1)),
      },
      servingSizeG: p.serving_quantity
        ? parseFloat(p.serving_quantity)
        : p.serving_size
        ? parseServingSize(p.serving_size)
        : null,
      dataSource: 'manufacturer',
      imageUrl: p.image_url ?? null,
    }

    return { status: 'found', product }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { status: 'network_error', message }
  }
}

/**
 * Returns true if more than 30% of the text's meaningful characters are from
 * non-Latin scripts (Hebrew, Cyrillic, CJK, Arabic, etc.).
 * Used to reject Open Food Facts product names that were entered in a foreign
 * script and would appear as garbage to an English-speaking user.
 */
function isPrimarilyNonLatinScript(text: string): boolean {
  if (!text || text.trim().length === 0) return false
  // Count characters outside basic Latin, Latin-1 Supplement,
  // and common punctuation/numbers/whitespace
  const nonLatinPattern = /[^\u0000-\u024F\u2000-\u206F\s\d.,()&'\-/]/g
  const nonLatinMatches = text.match(nonLatinPattern) || []
  const totalMeaningfulChars = text.replace(/\s/g, '').length
  if (totalMeaningfulChars === 0) return false
  // If more than 30% of characters are non-Latin script, treat as garbage
  return (nonLatinMatches.length / totalMeaningfulChars) > 0.3
}

/** Parses serving size strings like "30g", "1 cup (240ml)" → grams */
function parseServingSize(raw: string): number | null {
  const gramMatch = raw.match(/(\d+(?:\.\d+)?)\s*g/i)
  if (gramMatch) return parseFloat(gramMatch[1])
  const mlMatch = raw.match(/(\d+(?:\.\d+)?)\s*ml/i)
  if (mlMatch) return parseFloat(mlMatch[1])
  return null
}

/** Calculates nutrition for a given gram quantity */
export function calculateNutritionForGrams(
  product: ScannedProduct,
  grams: number
): ScannedProduct['per100g'] {
  const ratio = grams / 100
  return {
    calories: Math.round(product.per100g.calories * ratio),
    protein:  parseFloat((product.per100g.protein * ratio).toFixed(1)),
    carbs:    parseFloat((product.per100g.carbs   * ratio).toFixed(1)),
    fat:      parseFloat((product.per100g.fat     * ratio).toFixed(1)),
    fiber:    parseFloat((product.per100g.fiber   * ratio).toFixed(1)),
  }
}

// ============================================================
// NEW — Resolution Engine adapter (prefer this over fetchProductByBarcode)
// fetchProductByBarcode is kept as-is for reference / legacy fallback.
// ============================================================

export interface ProductTrust {
  tier: 'database' | 'ai_estimate' | 'label' | 'manual'
  label: string
  confidence?: 'medium' | 'low'
  consistent?: boolean | null
}

export interface ResolvedScannedProduct extends ScannedProduct {
  trust: ProductTrust
  /** null fields from the underlying source are preserved here per nutrient,
   * separate from per100g which stays number-typed for display math. */
  unknownFields: string[]
}

export type ResolveBarcodeResult =
  | { status: 'found'; product: ResolvedScannedProduct }
  | { status: 'missing_nutrition'; name: string; barcode: string }
  | { status: 'not_found' }
  | { status: 'network_error'; message: string }

/**
 * NEW resolution path. Calls the Product Resolution Engine + AI Estimator
 * via the /api/resolve-barcode/{barcode} endpoint instead of hitting
 * Open Food Facts directly. Prefer this over fetchProductByBarcode
 * going forward; fetchProductByBarcode is kept only as a reference/fallback.
 */
export async function resolveBarcodeProduct(barcode: string): Promise<ResolveBarcodeResult> {
  try {
    const response = await fetch(`/api/resolve-barcode/${barcode}`)
    if (!response.ok) {
      return { status: 'network_error', message: `HTTP ${response.status}` }
    }
    const data = await response.json()

    if (data.status === 'not_found') return { status: 'not_found' }
    if (data.status === 'error') return { status: 'network_error', message: data.message }
    if (data.status === 'missing_nutrition') {
      return { status: 'missing_nutrition', name: data.name, barcode: data.barcode ?? barcode }
    }

    // status === 'found'
    if (data.source === 'database') {
      const p = data.product
      const unknownFields: string[] = []
      const num = (v: number | null, field: string): number => {
        if (v === null) { unknownFields.push(field); return 0 }
        return v
      }
      const product: ResolvedScannedProduct = {
        barcode: p.barcode,
        name: p.name,
        brand: p.brand,
        per100g: {
          calories: num(p.per100g.calories, 'calories'),
          protein: num(p.per100g.protein, 'protein'),
          carbs: num(p.per100g.carbs, 'carbs'),
          fat: num(p.per100g.fat, 'fat'),
          fiber: num(p.per100g.fiber, 'fiber'),
        },
        servingSizeG: p.servingSizeG,
        dataSource: 'manufacturer',
        imageUrl: p.imageUrl,
        trust: { tier: 'database', label: 'Database' },
        unknownFields,
      }
      return { status: 'found', product }
    }

    // source === 'ai_estimate'
    const e = data.estimate
    const unknownFields: string[] = []
    const num = (v: number | null, field: string): number => {
      if (v === null) { unknownFields.push(field); return 0 }
      return v
    }
    const product: ResolvedScannedProduct = {
      barcode: data.barcode ?? barcode,
      name: e.name,
      brand: null,
      per100g: {
        calories: num(e.nutrients.calories, 'calories'),
        protein: num(e.nutrients.protein, 'protein'),
        carbs: num(e.nutrients.carbs, 'carbs'),
        fat: num(e.nutrients.fat, 'fat'),
        fiber: num(e.nutrients.fiber, 'fiber'),
      },
      servingSizeG: e.servingSizeG,
      dataSource: 'estimated',
      imageUrl: null,
      trust: {
        tier: 'ai_estimate',
        label: 'AI Estimate',
        confidence: e.confidence,
        consistent: e.consistent,
      },
      unknownFields,
    }
    return { status: 'found', product }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { status: 'network_error', message }
  }
}
