// ============================================================
// FORME — Cloudflare Pages Function: Food Search API Proxy
// ============================================================
// Proxies text search requests to Open Food Facts to bypass client-side CORS
// and inject the required User-Agent header from a secure backend.
// ============================================================

export const onRequest = async (context: any) => {
  const url = new URL(context.request.url)
  const query = url.searchParams.get('search_terms')

  if (!query) {
    return new Response(JSON.stringify({ status: 'network_error', message: 'Missing search query' }), { status: 400 })
  }

  const OPEN_FOOD_FACTS_SEARCH_API = 'https://world.openfoodfacts.org/cgi/search.pl'
  
  try {
    const response = await fetch(
      `${OPEN_FOOD_FACTS_SEARCH_API}?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&fields=code,product_name,brands,nutriments,serving_size,serving_quantity,image_url`,
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
