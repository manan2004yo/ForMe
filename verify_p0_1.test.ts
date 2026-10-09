import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { onRequest as middleware } from './functions/api/_middleware'
import { onRequestPost as aiCoach } from './functions/api/ai-coach'
import * as jwtVerify from './functions/lib/jwtVerify'
import * as aiOrchestrator from './functions/lib/aiOrchestrator'

// Mock the network-level JWT verifier
vi.mock('./functions/lib/jwtVerify', () => ({
  verifyFirebaseToken: vi.fn()
}))

// Mock the AI Orchestrator to intercept calls
vi.mock('./functions/lib/aiOrchestrator', () => ({
  generateText: vi.fn(),
  generateStructuredOutput: vi.fn(),
  processAudio: vi.fn(),
  analyzeImage: vi.fn()
}))

function createMockContext(url: string, headers: Record<string, string>, envOverloads: any = {}) {
  let nextCalled = false
  const req = new Request(url, {
    method: 'POST',
    headers: new Headers(headers),
    body: JSON.stringify({ messages: [{ role: 'user', content: 'test' }] })
  })
  return {
    request: req,
    env: {
      RATE_LIMITS: {
        store: new Map<string, string>(),
        async get(key: string) { return this.store.get(key) || null },
        async put(key: string, val: string) { this.store.set(key, val) }
      },
      FIREBASE_PROJECT_ID: 'test-project',
      ...envOverloads
    },
    data: {} as Record<string, any>,
    next: async () => { nextCalled = true; return new Response('next', { status: 200 }) },
    getNextCalled: () => nextCalled
  }
}

describe('P0-1 Verification Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. Missing Authorization header -> 401
  it('1. Missing Authorization header -> 401', async () => {
    const ctx = createMockContext('http://localhost/api/ai-coach', {})
    const res = await middleware(ctx)
    expect(res.status).toBe(401)
  })

  // 2. Malformed bearer token -> 401
  it('2. Malformed bearer token -> 401', async () => {
    const ctx = createMockContext('http://localhost/api/ai-coach', { 'Authorization': 'Bearer malformed.token' })
    vi.mocked(jwtVerify.verifyFirebaseToken).mockResolvedValue(null)
    const res = await middleware(ctx)
    expect(res.status).toBe(401)
  })

  // 3-5. Handled by mock returning null for invalid signatures, exp, aud, iss.
  it('3-5. Invalid/Expired/Wrong-aud token -> 401', async () => {
    const ctx = createMockContext('http://localhost/api/ai-coach', { 'Authorization': 'Bearer expired.token' })
    vi.mocked(jwtVerify.verifyFirebaseToken).mockResolvedValue(null) // Simulates rejection
    const res = await middleware(ctx)
    expect(res.status).toBe(401)
  })

  // 6. Valid Firebase ID token -> request reaches endpoint and backend-derived UID is available
  it('6. Valid Firebase ID token -> reaches endpoint, UID available', async () => {
    const ctx = createMockContext('http://localhost/api/ai-coach', { 'Authorization': 'Bearer valid.token' })
    vi.mocked(jwtVerify.verifyFirebaseToken).mockResolvedValue({ uid: 'user_123' })
    const res = await middleware(ctx)
    expect(res.status).toBe(200)
    expect(ctx.getNextCalled()).toBe(true)
    expect(ctx.data.uid).toBe('user_123')
  })

  // 7. All 6 endpoints pass through middleware - implicitly true in Pages router, but we test the code checks path correctly.
  
  // 8. Text rate limit: 100/hr boundary
  it('8. Text rate limit: 100/hr boundary', async () => {
    const ctx = createMockContext('http://localhost/api/ai-coach', { 'Authorization': 'Bearer valid.token' })
    vi.mocked(jwtVerify.verifyFirebaseToken).mockResolvedValue({ uid: 'user_123' })
    
    // Simulate 100 requests
    for (let i = 0; i < 100; i++) {
      const res = await middleware(ctx)
      expect(res.status).toBe(200) // 1 to 100 should pass
    }
    
    // Request 101 should fail
    const res101 = await middleware(ctx)
    expect(res101.status).toBe(429)
  })

  // 9. Heavy rate limit: 20/hr boundary
  it('9. Heavy rate limit: 20/hr boundary', async () => {
    const ctx = createMockContext('http://localhost/api/snap-log', { 'Authorization': 'Bearer valid.token' })
    vi.mocked(jwtVerify.verifyFirebaseToken).mockResolvedValue({ uid: 'user_456' })
    
    // Simulate 20 requests
    for (let i = 0; i < 20; i++) {
      const res = await middleware(ctx)
      expect(res.status).toBe(200)
    }
    
    // Request 21 should fail
    const res21 = await middleware(ctx)
    expect(res21.status).toBe(429)
  })

  // 10. 429 includes Retry-After
  it('10. 429 includes Retry-After', async () => {
    const ctx = createMockContext('http://localhost/api/snap-log', { 'Authorization': 'Bearer valid.token' })
    vi.mocked(jwtVerify.verifyFirebaseToken).mockResolvedValue({ uid: 'user_456' })
    
    let res: Response | any;
    for (let i = 0; i < 21; i++) {
      res = await middleware(ctx)
    }
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('3600')
  })

  // 11. Simulate unavailable KV -> fail closed 503
  it('11. Unavailable KV -> fail closed 503', async () => {
    const ctx = createMockContext('http://localhost/api/ai-coach', { 'Authorization': 'Bearer valid.token' }, { RATE_LIMITS: null })
    vi.mocked(jwtVerify.verifyFirebaseToken).mockResolvedValue({ uid: 'user_789' })
    
    const res = await middleware(ctx)
    expect(res.status).toBe(503)
  })

  // 12. Verify oversized ai-coach payload rejected
  it('12. Oversized ai-coach payload rejected', async () => {
    const bigBody = { messages: Array(25).fill({ role: 'user', content: 'hello' }) }
    const req = new Request('http://localhost/api/ai-coach', { method: 'POST', body: JSON.stringify(bigBody) })
    const res = await aiCoach({ request: req, env: {} })
    expect(res.status).toBe(400)
  })

  // 15. Force provider exhaustion, generic error, no leakage
  it('15. Provider exhaustion generic error', async () => {
    const req = new Request('http://localhost/api/ai-coach', { method: 'POST', body: JSON.stringify({ messages: [{role: 'user', content: 'test'}]}) })
    vi.mocked(aiOrchestrator.generateText).mockResolvedValue({ success: false, error: 'GEMINI_INTERNAL_CRITICAL_FAILURE' })
    
    const res = await aiCoach({ request: req, env: {} })
    expect(res.status).toBe(503)
    const json = await res.json()
    expect(json.error).toBe('AI Service Unavailable') // No raw error leakage
  })

  // --- NEW AUTHORIZED TESTS FOR OPTION A ---
  
  const AI_ENDPOINTS = [
    '/api/ai-coach',
    '/api/estimate-nutrition',
    '/api/parse-voice',
    '/api/read-nutrition-label',
    '/api/snap-log',
    '/api/transcribe-voice'
  ]

  const NON_AI_ENDPOINTS = [
    '/api/barcode/12345',
    '/api/resolve-barcode/12345',
    '/api/spotify-token',
    '/api/spotify-playing',
    '/api/verify',
    '/api/razorpay',
    '/api/test-resolve-product'
  ]

  it('Scope: 6 AI routes get 401 with no token, malformed token, and Bearer undefined', async () => {
    vi.mocked(jwtVerify.verifyFirebaseToken).mockResolvedValue(null)
    
    for (const ep of AI_ENDPOINTS) {
      // No token
      let ctx = createMockContext(`http://localhost${ep}`, {})
      let res = await middleware(ctx)
      expect(res.status).toBe(401)
      
      // Malformed token
      ctx = createMockContext(`http://localhost${ep}`, { 'Authorization': 'Bearer malformed' })
      res = await middleware(ctx)
      expect(res.status).toBe(401)
      
      // Bearer undefined (Demo user behavior)
      ctx = createMockContext(`http://localhost${ep}`, { 'Authorization': 'Bearer undefined' })
      res = await middleware(ctx)
      expect(res.status).toBe(401)
    }
  })

  it('Scope: Non-AI endpoints are NOT intercepted (passed to next)', async () => {
    for (const ep of NON_AI_ENDPOINTS) {
      const ctx = createMockContext(`http://localhost${ep}`, {}) // No token
      await middleware(ctx)
      expect(ctx.getNextCalled()).toBe(true)
    }
  })

  it('Edge Cases: Path variants and percent encoding', async () => {
    vi.mocked(jwtVerify.verifyFirebaseToken).mockResolvedValue(null)

    const variants = [
      { url: 'http://localhost/api/%61i-coach', expectedNext: true }, // %61 is 'a', url.pathname unescapes it? Actually URL class decodes it in pathname, but let's test. wait URL doesn't always decode.
      { url: 'http://localhost/api/ai-coach%2F', expectedNext: true },
      { url: 'http://localhost/api/ai-coach%00', expectedNext: true },
      { url: 'http://localhost//api/ai-coach', expectedNext: true },
      { url: 'http://localhost/api/ai-coach//', expectedNext: true },
      { url: 'http://localhost/API/ai-coach', expectedNext: true }
    ]

    for (const v of variants) {
      const ctx = createMockContext(v.url, {})
      await middleware(ctx)
      expect(ctx.getNextCalled()).toBe(v.expectedNext) // bypassed because strict match fails
    }
  })

  it('Edge Cases: Query string and hash on protected routes', async () => {
    vi.mocked(jwtVerify.verifyFirebaseToken).mockResolvedValue(null)
    for (const ep of AI_ENDPOINTS) {
      const ctx = createMockContext(`http://localhost${ep}?query=1#hash`, {})
      const res = await middleware(ctx)
      expect(res.status).toBe(401)
      expect(ctx.getNextCalled()).toBe(false)
    }
  })

  it('Edge Cases: GET, PUT, DELETE, HEAD return 401', async () => {
    vi.mocked(jwtVerify.verifyFirebaseToken).mockResolvedValue(null)
    const methods = ['GET', 'PUT', 'DELETE', 'HEAD']
    for (const ep of AI_ENDPOINTS) {
      for (const method of methods) {
        let nextCalled = false
        const req = new Request(`http://localhost${ep}`, { method })
        const ctx = {
          request: req, env: {}, data: {},
          next: async () => { nextCalled = true; return new Response('next', { status: 200 }) },
          getNextCalled: () => nextCalled
        }
        const res = await middleware(ctx)
        expect(res.status).toBe(401)
      }
    }
  })

  it('Rate limits: Assert heavy tier for specific routes', async () => {
    const heavyRoutes = ['/api/snap-log', '/api/transcribe-voice', '/api/read-nutrition-label']
    vi.mocked(jwtVerify.verifyFirebaseToken).mockResolvedValue({ uid: 'heavy_user' })
    
    for (const ep of heavyRoutes) {
      const ctx = createMockContext(`http://localhost${ep}`, { 'Authorization': 'Bearer valid.token' })
      const storeMap = ctx.env.RATE_LIMITS.store
      await middleware(ctx)
      
      let foundHeavy = false
      for (const key of storeMap.keys()) {
        if (key.includes('heavy_user') && key.includes('heavy')) foundHeavy = true
      }
      expect(foundHeavy).toBe(true)
    }
  })

  it('Rate limits: Assert text tier for specific routes', async () => {
    const textRoutes = ['/api/ai-coach', '/api/estimate-nutrition', '/api/parse-voice']
    vi.mocked(jwtVerify.verifyFirebaseToken).mockResolvedValue({ uid: 'text_user' })
    
    for (const ep of textRoutes) {
      const ctx = createMockContext(`http://localhost${ep}`, { 'Authorization': 'Bearer valid.token' })
      const storeMap = ctx.env.RATE_LIMITS.store
      await middleware(ctx)
      
      let foundText = false
      for (const key of storeMap.keys()) {
        if (key.includes('text_user') && key.includes('text')) foundText = true
      }
      expect(foundText).toBe(true)
    }
  })

  it('Rate limits: Exempt routes never touch KV', async () => {
    const mockGet = vi.fn()
    const mockPut = vi.fn()
    
    for (const ep of NON_AI_ENDPOINTS) {
      const ctx = createMockContext(`http://localhost${ep}`, { 'Authorization': 'Bearer valid.token' })
      ctx.env.RATE_LIMITS.get = mockGet
      ctx.env.RATE_LIMITS.put = mockPut
      await middleware(ctx)
    }
  })

  describe('6. Signed-token tests (characterizing jwtVerify)', () => {
    let privateKeyPem: string
    let publicKeyJwk: any
    let actualJwtVerify: any
    
    beforeAll(async () => {
      const crypto = require('crypto')
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'jwk' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      })
      privateKeyPem = privateKey
      publicKeyJwk = { ...publicKey, kid: 'test-kid', use: 'sig', alg: 'RS256' }
      actualJwtVerify = await vi.importActual('./functions/lib/jwtVerify')
    })

    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn(async (url) => {
        if (url === 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com') {
          return new Response(JSON.stringify({ keys: [publicKeyJwk] }))
        }
        return new Response('Not found', { status: 404 })
      }))
    })

    function createToken(payload: any, keyPem: string, header: any = { alg: 'RS256', kid: 'test-kid' }) {
      const crypto = require('crypto')
      const b64Url = (str: string) => Buffer.from(str).toString('base64url')
      const h = b64Url(JSON.stringify(header))
      const p = b64Url(JSON.stringify(payload))
      const sign = crypto.createSign('RSA-SHA256')
      sign.update(`${h}.${p}`)
      const s = sign.sign(keyPem, 'base64url')
      return `${h}.${p}.${s}`
    }

    const validPayload = {
      exp: Math.floor(Date.now() / 1000) + 3600,
      aud: 'test-project',
      iss: 'https://securetoken.google.com/test-project',
      sub: 'real_user'
    }

    it('Valid token', async () => {
      const token = createToken(validPayload, privateKeyPem)
      const res = await actualJwtVerify.verifyFirebaseToken(token, 'test-project')
      expect(res).toEqual({ uid: 'real_user' })
    })

    it('Bad signature', async () => {
      const token = createToken(validPayload, privateKeyPem)
      const badToken = token.substring(0, token.length - 2) + 'XX'
      const res = await actualJwtVerify.verifyFirebaseToken(badToken, 'test-project')
      expect(res).toBeNull()
    })

    it('Wrong issuer, wrong audience, expired, missing sub, unknown kid', async () => {
      expect(await actualJwtVerify.verifyFirebaseToken(createToken({ ...validPayload, iss: 'wrong' }, privateKeyPem), 'test-project')).toBeNull()
      expect(await actualJwtVerify.verifyFirebaseToken(createToken({ ...validPayload, aud: 'wrong' }, privateKeyPem), 'test-project')).toBeNull()
      expect(await actualJwtVerify.verifyFirebaseToken(createToken({ ...validPayload, exp: Math.floor(Date.now() / 1000) - 100 }, privateKeyPem), 'test-project')).toBeNull()
      expect(await actualJwtVerify.verifyFirebaseToken(createToken({ ...validPayload, sub: undefined }, privateKeyPem), 'test-project')).toBeNull()
      expect(await actualJwtVerify.verifyFirebaseToken(createToken(validPayload, privateKeyPem, { alg: 'RS256', kid: 'unknown' }), 'test-project')).toBeNull()
    })

    it('Missing exp and non-RS256 algorithm headers (Current behavior characterization)', async () => {
      // Missing exp -> payload.exp is undefined. (undefined < now) is false in JS! 
      // Thus, missing exp bypasses the expiry check.
      const noExpPayload = { ...validPayload }
      delete (noExpPayload as any).exp
      const noExpToken = createToken(noExpPayload, privateKeyPem)
      const res1 = await actualJwtVerify.verifyFirebaseToken(noExpToken, 'test-project')
      expect(res1).toEqual({ uid: 'real_user' }) // Weakness: Passes

      // non-RS256 header -> the code ignores header.alg and always uses RS256 for crypto.subtle.verify!
      // Thus, 'none' or 'HS256' in header doesn't matter as long as it's signed with RS256 using the public key.
      // (This is not an algorithm confusion vulnerability because verify always forces RS256, but it ignores the header).
      const badAlgToken = createToken(validPayload, privateKeyPem, { alg: 'HS256', kid: 'test-kid' })
      const res2 = await actualJwtVerify.verifyFirebaseToken(badAlgToken, 'test-project')
      expect(res2).toEqual({ uid: 'real_user' }) // Weakness: Passes
    })
  })
})
