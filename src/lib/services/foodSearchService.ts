// ============================================================
// FORME — Food Search Service
// ============================================================
// Handles text-based food searches via the Cloudflare Proxy.
// ============================================================

import type { ScannedProduct } from './barcodeProductService'
import { LOCAL_INDIAN_FOODS } from '../data/comprehensiveIndianFoods'
import { getCustomFoods } from './customFoodService'

export async function searchFoods(query: string): Promise<ScannedProduct[]> {
  const customFoods = getCustomFoods()
  const allFoods = [...customFoods, ...LOCAL_INDIAN_FOODS]

  if (!query || query.trim() === '') {
    // If empty query, return user's custom foods first followed by top staples
    return allFoods.slice(0, 30)
  }

  const q = query.toLowerCase().trim()
  
  // Fake a small network delay so the UI loading state still feels natural
  await new Promise(resolve => setTimeout(resolve, 100))

  return allFoods.filter(food => {
    return food.name.toLowerCase().includes(q) || 
           (food.brand && food.brand.toLowerCase().includes(q)) ||
           (food as any).aliases?.some((a: string) => a.toLowerCase().includes(q))
  })
}

