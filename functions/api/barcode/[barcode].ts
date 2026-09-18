// ============================================================
// FORME — Cloudflare Pages Function: Barcode API Proxy
// ============================================================
// Proxies requests to Open Food Facts to bypass client-side CORS
// and inject the required User-Agent header from a secure backend.
// ============================================================

export const onRequest = async (context: any) => {
  const { params } = context
  const barcode = params.barcode as string

  if (!barcode) {
    return new Response(JSON.stringify({ status: 'network_error', message: 'Missing barcode' }), { status: 400 })
  }

  const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v2/product'
  
  try {
    const response = await fetch(
      `${OPEN_FOOD_FACTS_API}/${barcode}.json?fields=product_name,brands,nutriments,serving_size,serving_quantity,image_url`,
      {
        headers: {
          'User-Agent': 'FORME-FitnessApp/1.0 (contact@forme.app)',
        }
      }
    )

    if (!response.ok) {
      return new Response(JSON.stringify({ status: 'network_error', message: `HTTP ${response.status}` }), {
        status: response.status,
        headers: { 'Access-Control-Allow-Origin': '*' }
      })
    }

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ status: 'network_error', message: err.message }), { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  }
}
