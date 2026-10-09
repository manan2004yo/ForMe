// ============================================================
// FORME — Edge-compatible Firebase JWT Verifier
// ============================================================
// Validates Firebase ID tokens using Google's public JWKS.
// Runs purely on Web Crypto API, compatible with Cloudflare Workers.
// ============================================================

const JWK_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'

// Cache keys in memory during the isolate's lifetime
let cachedJwks: any = null
let keysExpiration = 0

async function fetchJwks(): Promise<any> {
  if (cachedJwks && Date.now() < keysExpiration) {
    return cachedJwks
  }
  const res = await fetch(JWK_URL)
  if (!res.ok) throw new Error('Failed to fetch Google JWKS')
  
  const cacheControl = res.headers.get('cache-control') || ''
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/)
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600
  
  const jwks = await res.json()
  cachedJwks = jwks
  keysExpiration = Date.now() + maxAge * 1000
  return jwks
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export async function verifyFirebaseToken(token: string, projectId: string): Promise<{ uid: string } | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [headerB64, payloadB64, sigB64] = parts
    const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(headerB64)))
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)))

    // 1. Validate claims
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) return null
    if (payload.aud !== projectId) return null
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null
    if (!payload.sub || typeof payload.sub !== 'string') return null
    if (!header.kid) return null

    // 2. Fetch keys and find the matching one
    const jwks = await fetchJwks()
    const jwk = jwks.keys.find((k: any) => k.kid === header.kid)
    if (!jwk) return null

    // 3. Verify signature using Web Crypto API
    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const signature = base64UrlDecode(sigB64)
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`)

    const isValid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      signature as any,
      data as any
    )

    if (!isValid) return null

    return { uid: payload.sub }
  } catch (err) {
    return null
  }
}
