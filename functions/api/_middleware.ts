import { verifyFirebaseToken } from '../lib/jwtVerify'

const TEXT_LIMIT = 100
const HEAVY_LIMIT = 20

// One hour in milliseconds
const WINDOW_MS = 60 * 60 * 1000

function isHeavy(path: string) {
  return path.includes('snap-log') || path.includes('transcribe-voice') || path.includes('read-nutrition-label')
}

export async function onRequest(context: any) {
  const { request, env, next } = context
  const url = new URL(request.url)

  if (request.method === 'OPTIONS') {
    return next()
  }

  const path = url.pathname.replace(/\/$/, '')
  const protectedRoutes = [
    '/api/ai-coach',
    '/api/estimate-nutrition',
    '/api/parse-voice',
    '/api/read-nutrition-label',
    '/api/snap-log',
    '/api/transcribe-voice'
  ]

  if (!protectedRoutes.includes(path)) {
    return next()
  }

  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized: No token provided' }), { 
      status: 401, headers: { 'Content-Type': 'application/json' } 
    })
  }

  const token = authHeader.split('Bearer ')[1]
  
  // VITE_FIREBASE_PROJECT_ID is passed to client, so we assume env.FIREBASE_PROJECT_ID or we can hardcode for Forme if we don't have it.
  // Wait, let's check what env var is available. `env.VITE_FIREBASE_PROJECT_ID` might be exposed to Pages.
  // If not, we can extract the project ID from the token itself? The issuer is 'https://securetoken.google.com/<projectId>'.
  // But verifying requires knowing the expected project ID.
  // Actually, we can get it from `env.FIREBASE_PROJECT_ID` or fallback to `env.VITE_FIREBASE_PROJECT_ID`.
  const projectId = env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID || 'forme-fitness-app'

  const decoded = await verifyFirebaseToken(token, projectId)
  
  if (!decoded || !decoded.uid) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid or expired token' }), { 
      status: 401, headers: { 'Content-Type': 'application/json' } 
    })
  }

  const uid = decoded.uid
  
  // Rate Limiting
  const kv = env.RATE_LIMITS
  if (!kv) {
    // Fail closed if no KV is available
    return new Response(JSON.stringify({ error: 'Service Unavailable: Rate limit storage missing' }), { 
      status: 503, headers: { 'Content-Type': 'application/json' } 
    })
  }

  const windowHour = Math.floor(Date.now() / WINDOW_MS)
  const isHeavyOp = isHeavy(url.pathname)
  const limit = isHeavyOp ? HEAVY_LIMIT : TEXT_LIMIT
  const key = `rl:${uid}:${isHeavyOp ? 'heavy' : 'text'}:${windowHour}`

  try {
    const currentStr = await kv.get(key)
    const current = currentStr ? parseInt(currentStr, 10) : 0

    if (current >= limit) {
      return new Response(JSON.stringify({ error: 'Too Many Requests' }), { 
        status: 429, 
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': '3600'
        } 
      })
    }

    await kv.put(key, (current + 1).toString(), { expirationTtl: 3600 })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Service Unavailable: Rate limit enforcement failed' }), { 
      status: 503, headers: { 'Content-Type': 'application/json' } 
    })
  }

  // Pass uid to the downstream context
  context.data = { ...context.data, uid }

  return next()
}
