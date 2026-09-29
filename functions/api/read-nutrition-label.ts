// ============================================================
// FORME — Read Nutrition Label
// (functions/api/read-nutrition-label.ts)
// ============================================================
// POST { image: dataURL }
// Reads the printed nutrition table from a label photo and
// returns validated per-100g macros.
// ============================================================
import { analyzeImage } from '../lib/aiOrchestrator'

const MAX: Record<string, number> = {
  calories: 3000,
  protein: 300,
  carbs: 500,
  fat: 300,
  fiber: 100,
  sugar: 300,
  sodium: 40000,
}

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : null
}

function clampOrNull(v: number | null, key: string): number | null {
  if (v === null) return null
  return v <= MAX[key] ? v : null
}

const PROMPT = `You are a precise nutrition label reader.

Look at the nutrition facts panel in the image.
Your job is to extract values PER 100g (or per 100ml for liquids).

Rules:
- If the label shows values per serving only, convert them to per 100g using the printed serving size. If the serving size is not visible, set each nutrient to null instead of guessing.
- Extract ONLY what is printed. Do NOT guess or estimate missing values — use null.
- sodium in mg; all others (calories in kcal, protein/carbs/fat/fiber/sugar in g).
- servingSizeG: the printed serving size in grams, or null.

Return ONLY valid JSON in exactly this shape:
{
  "calories": number or null,
  "protein": number or null,
  "carbs": number or null,
  "fat": number or null,
  "fiber": number or null,
  "sugar": number or null,
  "sodium": number or null,
  "servingSizeG": number or null
}`

export async function onRequestPost(context: any) {
  const { env, request } = context
  const headers = { 'Content-Type': 'application/json' }

  let body: any
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ status: 'error', message: 'Invalid JSON body' }), { status: 400, headers })
  }

  const { image } = body ?? {}
  if (typeof image !== 'string' || !image.startsWith('data:image/')) {
    return new Response(JSON.stringify({ status: 'error', message: 'image must be a data: URL' }), { status: 400, headers })
  }

  // Parse data URL → base64 + mimeType
  const commaIdx = image.indexOf(',')
  if (commaIdx === -1) {
    return new Response(JSON.stringify({ status: 'error', message: 'Malformed data URL' }), { status: 400, headers })
  }
  const meta = image.slice(5, commaIdx) // e.g. "image/jpeg;base64"
  const mimeType = meta.split(';')[0] ?? 'image/jpeg'
  const imageBase64 = image.slice(commaIdx + 1)

  const aiResult = await analyzeImage(env, PROMPT, imageBase64, mimeType)
  if (!aiResult.success || !aiResult.data) {
    return new Response(JSON.stringify({ status: 'unreadable' }), { headers })
  }

  let parsed: any
  try {
    parsed = JSON.parse(aiResult.data)
  } catch {
    return new Response(JSON.stringify({ status: 'unreadable' }), { headers })
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return new Response(JSON.stringify({ status: 'unreadable' }), { headers })
  }

  const calories = clampOrNull(toNum(parsed.calories), 'calories')
  const protein  = clampOrNull(toNum(parsed.protein),  'protein')
  const carbs    = clampOrNull(toNum(parsed.carbs),    'carbs')
  const fat      = clampOrNull(toNum(parsed.fat),      'fat')
  const fiber    = clampOrNull(toNum(parsed.fiber),    'fiber')
  const sugar    = clampOrNull(toNum(parsed.sugar),    'sugar')
  const sodium   = clampOrNull(toNum(parsed.sodium),   'sodium')
  const servingSizeG = (() => {
    const n = toNum(parsed.servingSizeG)
    return n !== null && n >= 1 && n <= 5000 ? Math.round(n) : null
  })()

  // Validate Atwater consistency if all four main macros are present
  if (
    calories !== null &&
    protein !== null &&
    carbs !== null &&
    fat !== null
  ) {
    const computed = 4 * protein + 4 * carbs + 9 * fat
    const tolerance = Math.max(40, calories * 0.25)
    if (Math.abs(calories - computed) > tolerance) {
      return new Response(JSON.stringify({ status: 'unreadable' }), { headers })
    }
  }

  // Require at least calories to be readable
  if (calories === null) {
    return new Response(JSON.stringify({ status: 'unreadable' }), { headers })
  }

  return new Response(JSON.stringify({
    status: 'ok',
    per100g: { calories, protein, carbs, fat, fiber, sugar, sodium },
    servingSizeG,
  }), { headers })
}
