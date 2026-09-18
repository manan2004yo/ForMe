// ============================================================
// FORME — Food Search Service
// ============================================================
// Handles text-based food searches via the Cloudflare Proxy.
// ============================================================

import type { ScannedProduct } from './barcodeProductService'

export async function searchFoods(query: string): Promise<ScannedProduct[]> {
  if (!query || query.trim() === '') return []

  try {
    const response = await fetch(`/api/food-search?search_terms=${encodeURIComponent(query)}`)
    if (!response.ok) return []

    const data = await response.json()
    if (!data.products || !Array.isArray(data.products)) return []

    const results: ScannedProduct[] = []

    for (const p of data.products) {
      const n = p.nutriments ?? {}
      
      const calories = n['energy-kcal_100g'] ?? n['energy_100g'] ?? 0
      const protein  = n['proteins_100g'] ?? 0
      const carbs    = n['carbohydrates_100g'] ?? 0
      const fat      = n['fat_100g'] ?? 0
      const fiber    = n['fiber_100g'] ?? 0

      // Skip products with missing macros
      if (calories === 0 && protein === 0 && carbs === 0 && fat === 0) continue

      results.push({
        barcode: p.code ?? `custom_${Math.random().toString(36).substring(2)}`,
        name: p.product_name || 'Unknown Product',
        brand: p.brands ?? null,
        per100g: {
          calories: Math.round(calories),
          protein: parseFloat(Number(protein).toFixed(1)),
          carbs: parseFloat(Number(carbs).toFixed(1)),
          fat: parseFloat(Number(fat).toFixed(1)),
          fiber: parseFloat(Number(fiber).toFixed(1)),
        },
        servingSizeG: p.serving_quantity ? parseFloat(p.serving_quantity) : null,
        dataSource: 'manufacturer',
        imageUrl: p.image_url ?? null
      })
    }

    return results

  } catch (err) {
    console.error('Search error:', err)
    return []
  }
}
