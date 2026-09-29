import { resolveProduct } from '../../lib/productResolutionEngine'
import { estimateNutrition } from '../../lib/nutritionEstimator'

export async function onRequestGet(context: any) {
  const { params, env } = context
  const barcode = params.barcode as string
  const headers = { 'Content-Type': 'application/json' }

  const resolved = await resolveProduct(env, barcode)

  if (resolved.status === 'found') {
    return new Response(JSON.stringify({
      status: 'found',
      source: 'database',
      product: resolved.product,
    }), { headers })
  }

  if (resolved.status === 'error') {
    return new Response(JSON.stringify({
      status: 'error',
      message: resolved.message,
    }), { status: 503, headers })
  }

  // not_found or missing_nutrition: try an AI estimate IF we have a name
  const productName = resolved.status === 'missing_nutrition' ? resolved.name : null

  if (!productName) {
    // No name from any provider — nothing to estimate from
    return new Response(JSON.stringify({ status: 'not_found' }), { headers })
  }

  const estimate = await estimateNutrition(env, productName, 'packaged')

  if (estimate.status !== 'ok') {
    // We have a name but the estimator is unavailable — still better than nothing:
    // return missing_nutrition so the UI can offer Snap Label / Manual Add with the name pre-filled
    return new Response(JSON.stringify({
      status: 'missing_nutrition',
      name: productName,
      barcode,
    }), { headers })
  }

  return new Response(JSON.stringify({
    status: 'found',
    source: 'ai_estimate',
    estimate: estimate.estimate,
    barcode,
  }), { headers })
}
