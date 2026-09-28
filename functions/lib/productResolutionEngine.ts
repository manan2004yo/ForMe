// ============================================================
// FORME — Product Resolution Engine
// (functions/lib/productResolutionEngine.ts)
// ============================================================
//
// Multi-source resolution chain for barcode → product data.
// Resolution order (first successful result wins):
//   1. Vybe product cache     (Cloudflare KV binding: VERIFIED_PRODUCTS)
//   2. Open Food Facts        (world.openfoodfacts.org — free, no key)
//   3. UPCitemdb              (api.upcitemdb.com — keyless trial, rate-limited)
//   4. GS1                   (STUB ONLY — requires paid membership, skipped)
//
// HOW TO ADD A NEW PROVIDER:
//   1. Implement the provider fetch function below.
//   2. Add it to the RESOLUTION_CHAIN array in resolveProduct().
//   3. No other code changes required.
//
// KV CACHE:
//   Cache reads and writes use the VERIFIED_PRODUCTS KV binding.
//   If the binding is missing, the cache is skipped and the chain still works.
// ============================================================

// ── Public types ────────────────────────────────────────────

export interface ResolvedProduct {
  barcode: string
  name: string
  brand: string | null
  per100g: {
    calories: number
    protein: number | null
    carbs: number | null
    fat: number | null
    fiber: number | null
  }
  servingSizeG: number | null
  dataSource: 'vybe_cache' | 'open_food_facts' | 'upcitemdb' | 'gs1'
  imageUrl: string | null
  resolvedAt: string // ISO timestamp
}

export type ResolutionResult =
  | { status: 'found'; product: ResolvedProduct }
  | { status: 'not_found' }
  | { status: 'missing_nutrition'; name: string; barcode: string }
  | { status: 'error'; message: string }

// ── Internal helpers ─────────────────────────────────────────

/**
 * Returns true if more than 30% of the text's meaningful characters
 * are from non-Latin scripts (Hebrew, Cyrillic, CJK, Arabic, etc.).
 * Verbatim copy of the same filter in src/lib/services/barcodeProductService.ts
 * so that ALL providers are subject to the same garbage-name rejection.
 */
function isPrimarilyNonLatinScript(text: string): boolean {
  if (!text || text.trim().length === 0) return false
  const nonLatinPattern = /[^\u0000-\u024F\u2000-\u206F\s\d.,()&'\-/]/g
  const nonLatinMatches = text.match(nonLatinPattern) || []
  const totalMeaningfulChars = text.replace(/\s/g, '').length
  if (totalMeaningfulChars === 0) return false
  return nonLatinMatches.length / totalMeaningfulChars > 0.3
}

/** Parses serving size strings like "30g", "1 cup (240ml)" → grams */
function parseServingSize(raw: string): number | null {
  const gramMatch = raw.match(/(\d+(?:\.\d+)?)\s*g/i)
  if (gramMatch) return parseFloat(gramMatch[1])
  const mlMatch = raw.match(/(\d+(?:\.\d+)?)\s*ml/i)
  if (mlMatch) return parseFloat(mlMatch[1])
  return null
}

function nowIso(): string {
  return new Date().toISOString()
}

/** Finite number, or null if absent/invalid. Never returns a fake 0. */
function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function round1(v: number | null): number | null {
  return v === null ? null : parseFloat(v.toFixed(1))
}

/** kcal per 100g. Falls back to converting kJ (1 kcal = 4.184 kJ). Null if neither exists. */
function extractKcal(n: any): number | null {
  const kcal = toNum(n['energy-kcal_100g'])
  if (kcal !== null) return kcal
  const kj = toNum(n['energy-kj_100g']) ?? toNum(n['energy_100g'])
  return kj !== null ? kj / 4.184 : null
}

const FETCH_TIMEOUT_MS = 6000

// ─────────────────────────────────────────────────────────────
// PROVIDER 1 — Vybe Verified Cache (Firestore REST)
// ─────────────────────────────────────────────────────────────

async function fetchFromVybeCache(
  env: any,
  barcode: string
): Promise<ResolvedProduct | null> {
  if (!env.VERIFIED_PRODUCTS) return null
  try {
    const cached = await env.VERIFIED_PRODUCTS.get(barcode, 'json') as ResolvedProduct | null
    if (!cached || !cached.name || !cached.per100g || typeof cached.per100g.calories !== 'number') return null
    return { ...cached, dataSource: 'vybe_cache' }
  } catch {
    return null
  }
}

/**
 * Writes a resolved product into the Vybe product cache (Cloudflare KV).
 * Silently skipped if the VERIFIED_PRODUCTS binding is missing.
 */
async function writeToVybeCache(env: any, product: ResolvedProduct): Promise<void> {
  if (!env.VERIFIED_PRODUCTS) return
  try {
    await env.VERIFIED_PRODUCTS.put(product.barcode, JSON.stringify(product))
  } catch (err: any) {
    console.error('[ProductResolutionEngine] Cache write failed:', err?.message)
  }
}

// ─────────────────────────────────────────────────────────────
// PROVIDER 2 — Open Food Facts
// ─────────────────────────────────────────────────────────────

async function fetchFromOpenFoodFacts(barcode: string): Promise<ResolutionResult> {
  const url =
    `https://world.openfoodfacts.org/api/v2/product/${barcode}.json` +
    `?fields=product_name,brands,nutriments,serving_size,serving_quantity,image_url`

  const res = await fetch(url, {
    headers: { 'User-Agent': 'FORME-FitnessApp/1.0 (contact@forme.app)' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })

  if (res.status === 404) return { status: 'not_found' }
  if (!res.ok) throw new Error(`Open Food Facts HTTP ${res.status}`)

  const data = await res.json() as any
  if (data.status !== 1 || !data.product) return { status: 'not_found' }

  const p = data.product
  if (p.product_name && isPrimarilyNonLatinScript(p.product_name)) {
    return { status: 'not_found' }
  }

  const n = p.nutriments ?? {}
  const calories = extractKcal(n)
  const protein  = toNum(n['proteins_100g'])
  const carbs    = toNum(n['carbohydrates_100g'])
  const fat      = toNum(n['fat_100g'])
  const fiber    = toNum(n['fiber_100g'])

  // Calories are required. All-zero is treated as unknown (safe failure).
  // Missing macros stay null (unknown) and are never turned into 0.
  if (calories === null || (calories === 0 && !protein && !carbs && !fat)) {
    return {
      status: 'missing_nutrition',
      name: p.product_name ?? 'Unknown Product',
      barcode,
    }
  }

  const servingSizeG = p.serving_quantity
    ? parseFloat(p.serving_quantity)
    : p.serving_size
    ? parseServingSize(p.serving_size)
    : null

  const product: ResolvedProduct = {
    barcode,
    name: p.product_name ?? 'Unknown Product',
    brand: p.brands ?? null,
    per100g: {
      calories: Math.round(calories),
      protein: round1(protein),
      carbs: round1(carbs),
      fat: round1(fat),
      fiber: round1(fiber),
    },
    servingSizeG,
    dataSource: 'open_food_facts',
    imageUrl: p.image_url ?? null,
    resolvedAt: nowIso(),
  }

  return { status: 'found', product }
}

// ─────────────────────────────────────────────────────────────
// PROVIDER 3 — UPCitemdb (keyless trial tier)
// ─────────────────────────────────────────────────────────────
//
// UPCitemdb's trial endpoint is publicly accessible with no API key.
// It is a GENERAL product database, not food-specific, so nutrition
// data is almost never present. If a product name/brand is found but
// nutrition is missing, we return 'missing_nutrition' rather than
// fabricating values.
//
// Rate limits (trial): ~100 lookups/day per IP.
// To upgrade: set UPCITEMDB_API_KEY in Cloudflare env → this function
// will automatically switch to the authenticated endpoint.
//
async function fetchFromUPCitemdb(
  env: any,
  barcode: string
): Promise<ResolutionResult> {
  const apiKey: string | undefined = env.UPCITEMDB_API_KEY

  // Keyless trial endpoint — best-effort, rate-limited.
  // Authenticated endpoint (when key available): https://api.upcitemdb.com/prod/v1/lookup?upc={barcode}
  // with header 'user_key: {apiKey}'
  const url = apiKey
    ? `https://api.upcitemdb.com/prod/v1/lookup?upc=${barcode}`
    : `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`

  const headers: Record<string, string> = {}
  if (apiKey) headers['user_key'] = apiKey

  const res = await fetch(url, { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })

  // 429 = rate limit hit, 404 = not found — both are non-crash outcomes
  if (res.status === 404) return { status: 'not_found' }
  if (res.status === 429) {
    // Rate limited = provider could not answer. Throw so it is not counted as "not found".
    throw new Error('UPCitemdb rate limit hit')
  }
  if (!res.ok) {
    throw new Error(`UPCitemdb HTTP ${res.status}`)
  }

  const data = await res.json() as any

  // UPCitemdb response: { code: 'OK', total: N, items: [{ title, brand, ... }] }
  if (data.code !== 'OK' || !data.items || data.items.length === 0) {
    return { status: 'not_found' }
  }

  const item = data.items[0]
  const name: string = item.title ?? item.description ?? ''
  const brand: string | null = item.brand ?? null

  if (!name) return { status: 'not_found' }

  // Apply the same non-Latin garbage filter
  if (isPrimarilyNonLatinScript(name)) return { status: 'not_found' }

  // UPCitemdb is not food-specific — nutrition fields are rarely present.
  // Check for them opportunistically, but never fabricate.
  const nutrition = item.nutrition ?? null
  const calories = toNum(nutrition?.calories)
  const protein  = toNum(nutrition?.protein)
  const carbs    = toNum(nutrition?.carbs)
  const fat      = toNum(nutrition?.fat)

  if (calories === null || (calories === 0 && !protein && !carbs && !fat)) {
    return { status: 'missing_nutrition', name, barcode }
  }

  const product: ResolvedProduct = {
    barcode,
    name,
    brand,
    per100g: {
      calories: Math.round(calories),
      protein: round1(protein),
      carbs: round1(carbs),
      fat: round1(fat),
      fiber: null, // UPCitemdb does not provide fiber
    },
    servingSizeG: null,
    dataSource: 'upcitemdb',
    imageUrl: item.images?.[0] ?? null,
    resolvedAt: nowIso(),
  }

  return { status: 'found', product }
}

// ─────────────────────────────────────────────────────────────
// PROVIDER 4 — GS1 (STUB — always skipped)
// ─────────────────────────────────────────────────────────────
//
// GS1 is the global barcode standards body. Their Verified by GS1
// API (https://www.gs1.org/services/verified-by-gs1) requires a paid
// GS1 membership or a commercial API agreement. There is no meaningful
// free tier for programmatic product data lookups.
//
// This stub is here to document the intended position in the chain
// and to make future activation a 1-step code change (implement the
// fetch function and set GS1_API_KEY in Cloudflare env).
//
function isGs1Configured(env: any): boolean {
  // GS1 requires GS1_API_KEY — not yet obtained. Always returns false.
  return !!env.GS1_API_KEY
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function fetchFromGs1(_env: any, _barcode: string): Promise<ResolutionResult> {
  // TODO: Implement when GS1_API_KEY is available.
  // Endpoint: https://api.gs1.org/verifiedbygs1/products/{gtin}
  // Auth: Bearer token via GS1 OAuth2 using GS1_API_KEY
  throw new Error('GS1 provider not yet implemented')
}

// ─────────────────────────────────────────────────────────────
// PUBLIC ENTRY POINT
// ─────────────────────────────────────────────────────────────

/**
 * Resolves a barcode to a product via the multi-source resolution chain.
 * Resolution order: Vybe cache → Open Food Facts → UPCitemdb → GS1 (stub).
 * The first successful 'found' result is returned immediately.
 * missing_nutrition results are accumulated — the last one is returned if
 * no provider returns a fully-nutritioned 'found' result.
 */
export async function resolveProduct(
  env: any,
  barcode: string
): Promise<ResolutionResult> {
  // Reject malformed input before any cache or provider access
  if (!/^\d{8,14}$/.test(barcode)) {
    return { status: 'error', message: 'Invalid barcode' }
  }

  let lastMissingNutrition: ResolutionResult | null = null
  let providersAnswered = 0

  // Step 1: Vybe cache
  try {
    const cached = await fetchFromVybeCache(env, barcode)
    if (cached) {
      console.log(`[ProductResolutionEngine] Cache HIT: ${barcode}`)
      return { status: 'found', product: cached }
    }
  } catch (err: any) {
    console.error('[ProductResolutionEngine] Vybe cache error:', err?.message)
  }

  // Step 2: Open Food Facts
  try {
    const offResult = await fetchFromOpenFoodFacts(barcode)
    providersAnswered++
    if (offResult.status === 'found') {
      console.log(`[ProductResolutionEngine] Resolved via Open Food Facts: ${barcode}`)
      await writeToVybeCache(env, offResult.product)
      return offResult
    }
    if (offResult.status === 'missing_nutrition') lastMissingNutrition = offResult
  } catch (err: any) {
    console.error('[ProductResolutionEngine] Open Food Facts error:', err?.message)
  }

  // Step 3: UPCitemdb
  try {
    const upcResult = await fetchFromUPCitemdb(env, barcode)
    providersAnswered++
    if (upcResult.status === 'found') {
      console.log(`[ProductResolutionEngine] Resolved via UPCitemdb: ${barcode}`)
      await writeToVybeCache(env, upcResult.product)
      return upcResult
    }
    if (upcResult.status === 'missing_nutrition') lastMissingNutrition = upcResult
  } catch (err: any) {
    console.error('[ProductResolutionEngine] UPCitemdb error:', err?.message)
  }

  // Step 4: GS1 (skipped until configured)
  if (isGs1Configured(env)) {
    try {
      const gs1Result = await fetchFromGs1(env, barcode)
      providersAnswered++
      if (gs1Result.status === 'found') {
        console.log(`[ProductResolutionEngine] Resolved via GS1: ${barcode}`)
        await writeToVybeCache(env, gs1Result.product)
        return gs1Result
      }
      if (gs1Result.status === 'missing_nutrition') lastMissingNutrition = gs1Result
    } catch (err: any) {
      console.error('[ProductResolutionEngine] GS1 error:', err?.message)
    }
  }

  if (lastMissingNutrition) return lastMissingNutrition

  // If no provider actually answered, this is an outage, not "product not found"
  if (providersAnswered === 0) {
    return { status: 'error', message: 'Product lookup is temporarily unavailable' }
  }

  return { status: 'not_found' }
}
