// ============================================================
// FORME — AI Orchestrator (functions/lib/aiOrchestrator.ts)
// ============================================================
// Provider-neutral AI infrastructure for Cloudflare Functions.
// ALL Cloudflare Function files that need an AI call must go
// through this module. No other file should ever construct a
// Gemini URL or hardcode a model string.
//
// To add a new provider (e.g. OpenAI):
//   1. Add an entry to PROVIDERS below.
//   2. Add a case to buildRequest() for that provider's API shape.
//   3. Add a case to extractText() for that provider's response shape.
//   No calling code changes required.
// ============================================================

export interface AIProviderConfig {
  name: string
  modelId: string
  apiKeyEnvVar: string
  baseUrl: string
  capabilities: {
    audio: boolean
  }
}

// ── Registered providers — order = fallback priority ───────
const PROVIDERS: AIProviderConfig[] = [
  {
    name: 'gemini',
    modelId: 'gemini-3.1-flash-lite',
    apiKeyEnvVar: 'GEMINI_API_KEY',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    capabilities: {
      audio: true,
    },
  },
]

// ── Public result type ──────────────────────────────────────
export interface OrchestratorResult<T = string> {
  success: boolean
  data?: T
  error?: string
  providerUsed?: string
}

// ── Internal: Gemini-format conversation message ────────────
export interface ConversationMessage {
  role: 'user' | 'model'
  content: string
}

// ─────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────

function getApiKey(env: any, provider: AIProviderConfig): string | null {
  return env?.[provider.apiKeyEnvVar] ?? null
}

function buildGeminiUrl(provider: AIProviderConfig, apiKey: string, operation: string): string {
  return `${provider.baseUrl}/${provider.modelId}:${operation}?key=${apiKey}`
}

// Extracts the generated text from a Gemini response body.
function extractGeminiText(data: any): string | null {
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Generate a text response from the AI.
 *
 * Pass `options.systemInstruction` for a system prompt.
 * Pass `options.conversationHistory` for multi-turn chat (overrides `prompt`).
 * When conversationHistory is provided the prompt param is ignored — include
 * the latest user turn as the last entry in the history array.
 */
export async function generateText(
  env: any,
  prompt: string,
  options?: {
    systemInstruction?: string
    conversationHistory?: ConversationMessage[]
  }
): Promise<OrchestratorResult<string>> {
  for (const provider of PROVIDERS) {
    const apiKey = getApiKey(env, provider)
    if (!apiKey) continue

    try {
      const url = buildGeminiUrl(provider, apiKey, 'generateContent')

      // Build the contents array — multi-turn history or single prompt
      const contents = options?.conversationHistory
        ? options.conversationHistory.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }],
          }))
        : [{ role: 'user', parts: [{ text: prompt }] }]

      const requestBody: Record<string, any> = { contents }

      if (options?.systemInstruction) {
        requestBody.system_instruction = {
          parts: { text: options.systemInstruction },
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json() as any

      if (!response.ok) {
        // Provider returned an error — try next provider
        console.error(`[Orchestrator] ${provider.name} error (${response.status}):`, data?.error?.message)
        continue
      }

      const text = extractGeminiText(data)
      if (text === null) {
        console.error(`[Orchestrator] ${provider.name} returned no text content`)
        continue
      }

      return { success: true, data: text, providerUsed: provider.name }
    } catch (err: any) {
      // Network-level failure — try next provider
      console.error(`[Orchestrator] ${provider.name} network error:`, err?.message)
    }
  }

  return { success: false, error: 'No AI provider currently available' }
}

/**
 * Generate structured (JSON) output from the AI.
 * Automatically adds response_mime_type: application/json to the request.
 * Attempts to JSON.parse the response and returns the parsed object as data.
 */
export async function generateStructuredOutput<T = any>(
  env: any,
  prompt: string,
  options?: {
    systemInstruction?: string
  }
): Promise<OrchestratorResult<T>> {
  for (const provider of PROVIDERS) {
    const apiKey = getApiKey(env, provider)
    if (!apiKey) continue

    try {
      const url = buildGeminiUrl(provider, apiKey, 'generateContent')

      const requestBody: Record<string, any> = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: 'application/json' },
      }

      if (options?.systemInstruction) {
        requestBody.system_instruction = {
          parts: { text: options.systemInstruction },
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json() as any

      if (!response.ok) {
        console.error(`[Orchestrator] ${provider.name} error (${response.status}):`, data?.error?.message)
        continue
      }

      const text = extractGeminiText(data)
      if (text === null) {
        console.error(`[Orchestrator] ${provider.name} returned no text content`)
        continue
      }

      try {
        const parsed = JSON.parse(text) as T
        return { success: true, data: parsed, providerUsed: provider.name }
      } catch {
        console.error(`[Orchestrator] ${provider.name} returned invalid JSON:`, text)
        return { success: false, error: 'Invalid JSON returned by provider' }
      }
    } catch (err: any) {
      console.error(`[Orchestrator] ${provider.name} network error:`, err?.message)
    }
  }

  return { success: false, error: 'No AI provider currently available' }
}

/**
 * Process an audio input with an accompanying text prompt.
 * Providers are checked for explicit audio capability before attempting
 * the request. Provider failures fall through to the next capable provider.
 */
export async function processAudio(
  env: any,
  prompt: string,
  audioBase64: string,
  mimeType: string
): Promise<OrchestratorResult<string>> {
  for (const provider of PROVIDERS) {
    if (!provider.capabilities.audio) continue

    const apiKey = getApiKey(env, provider)
    if (!apiKey) continue

    try {
      const url = buildGeminiUrl(provider, apiKey, 'generateContent')

      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: audioBase64 } },
            ],
          },
        ],
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json() as any

      if (!response.ok) {
        console.error(`[Orchestrator] ${provider.name} audio error (${response.status}):`, data?.error?.message)
        continue
      }

      const text = extractGeminiText(data)
      if (text === null) {
        console.error(`[Orchestrator] ${provider.name} audio returned no text content`)
        continue
      }

      return { success: true, data: text, providerUsed: provider.name }
    } catch (err: any) {
      console.error(`[Orchestrator] ${provider.name} audio network error:`, err?.message)
    }
  }

  return { success: false, error: 'No AI provider currently available' }
}

/**
 * Analyze an image with an accompanying text prompt.
 * Used by Snap AI. Returns the raw text response (callers parse the JSON
 * themselves so they can keep their own error handling + response shape).
 */
export async function analyzeImage(
  env: any,
  prompt: string,
  imageBase64: string,
  mimeType: string
): Promise<OrchestratorResult<string>> {
  for (const provider of PROVIDERS) {
    const apiKey = getApiKey(env, provider)
    if (!apiKey) continue

    try {
      const url = buildGeminiUrl(provider, apiKey, 'generateContent')

      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
            ],
          },
        ],
        generationConfig: { response_mime_type: 'application/json' },
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json() as any

      if (!response.ok) {
        console.error(`[Orchestrator] ${provider.name} error (${response.status}):`, data?.error?.message)
        continue
      }

      const text = extractGeminiText(data)
      if (text === null) {
        console.error(`[Orchestrator] ${provider.name} returned no text content`)
        continue
      }

      return { success: true, data: text, providerUsed: provider.name }
    } catch (err: any) {
      console.error(`[Orchestrator] ${provider.name} network error:`, err?.message)
    }
  }

  return { success: false, error: 'No AI provider currently available' }
}
