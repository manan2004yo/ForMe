// ============================================================
// FORME — Custom Food Service
// Allows users to create, save & delete custom food items in localStorage
// ============================================================

import type { ScannedProduct } from './barcodeProductService'

const CUSTOM_FOODS_KEY = 'forme_custom_foods_v1'

export function getCustomFoods(): ScannedProduct[] {
  try {
    const raw = localStorage.getItem(CUSTOM_FOODS_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveCustomFood(food: Omit<ScannedProduct, 'barcode' | 'dataSource'>): ScannedProduct {
  const existing = getCustomFoods()
  const newFood: ScannedProduct = {
    ...food,
    barcode: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    dataSource: 'custom'
  }
  
  const updated = [newFood, ...existing]
  localStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(updated))
  return newFood
}

export function deleteCustomFood(barcode: string): void {
  const existing = getCustomFoods()
  const updated = existing.filter(f => f.barcode !== barcode)
  localStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(updated))
}
