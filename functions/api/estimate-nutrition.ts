// ============================================================
// FORME — Nutrition estimate endpoint
// POST { name, mode: 'packaged' | 'meal' }  (real use)
// GET  ?name=...&mode=...                    (TEMPORARY verification only)
// ============================================================
import { estimateNutrition } from '../lib/nutritionEstimator'

const headers = { 'Content-Type': 'application/json' }

async function respond(env: any, name: unknown, mode: unknown): Promise<Response> {
  const result = await estimateNutrition(
    env,
    typeof name === 'string' ? name : '',
    typeof mode === 'string' ? mode : ''
  )
  if (result.status === 'ok') {
    return new Response(JSON.stringify(result, null, 2), { headers })
  }
  const httpStatus = result.code === 'invalid_input' ? 400 : 503
  return new Response(JSON.stringify(result, null, 2), { status: httpStatus, headers })
}

export async function onRequestPost(context: any) {
  try {
    const body = await context.request.json()
    return await respond(context.env, body?.name, body?.mode)
  } catch {
    return new Response(
      JSON.stringify({ status: 'error', code: 'invalid_input', message: 'Invalid request body' }),
      { status: 400, headers }
    )
  }
}

// TEMPORARY: remove this GET handler before launch. Only for manual verification.
export async function onRequestGet(context: any) {
  const url = new URL(context.request.url)
  return respond(context.env, url.searchParams.get('name'), url.searchParams.get('mode'))
}
