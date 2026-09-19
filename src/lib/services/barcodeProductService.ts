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
