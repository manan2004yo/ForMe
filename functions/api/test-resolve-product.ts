// ============================================================
// FORME — Test endpoint for Product Resolution Engine
// (functions/api/test-resolve-product.ts)
// ============================================================
// TEMPORARY: Used for manual verification of the resolution chain
// after deploy. Remove this file once the engine is migrated into
// the real barcode UI flow (barcodeProductService.ts replacement).
//
// Usage after Cloudflare deploy:
//   GET /api/test-resolve-product?barcode=737628064502
//   GET /api/test-resolve-product?barcode=5449000000439   (Coca-Cola 330ml)
//   GET /api/test-resolve-product?barcode=4005500052036   (Fanta Orange)
// ============================================================

import { resolveProduct } from '../lib/productResolutionEngine'

export async function onRequestGet(context: any) {
  const { request, env } = context
  const url = new URL(request.url)
  const barcode = url.searchParams.get('barcode')

  if (!barcode) {
    return new Response(
      JSON.stringify({ error: 'barcode query param required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const result = await resolveProduct(env, barcode)

  return new Response(JSON.stringify(result, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  })
}
