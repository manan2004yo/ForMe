import { generateText } from '../lib/aiOrchestrator'
import type { ConversationMessage } from '../lib/aiOrchestrator'

const MAX_MESSAGES = 20
const MAX_MESSAGE_LENGTH = 1000

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context
    const body = await request.json()

    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response(JSON.stringify({ error: 'Invalid input: messages array required' }), { status: 400 })
    }

    if (body.messages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: 'Payload too large: too many messages' }), { status: 400 })
    }

    const systemPrompt =
      'You are Forme AI, a hardcore, no-nonsense fitness and nutrition coach. ' +
      'You give direct, actionable, science-based advice. Keep responses under 3 paragraphs.'

    // Map OpenAI-style messages to the Orchestrator's ConversationMessage format.
    const conversationHistory: ConversationMessage[] = []
    for (const msg of body.messages) {
      if (!msg.content || typeof msg.content !== 'string') continue
      if (msg.content.length > MAX_MESSAGE_LENGTH) {
        return new Response(JSON.stringify({ error: 'Payload too large: message exceeds length limit' }), { status: 400 })
      }
      conversationHistory.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        content: msg.content,
      })
    }

    const result = await generateText(env, '', {
      systemInstruction: systemPrompt,
      conversationHistory,
    })

    if (!result.success) {
      console.error('[ai-coach] Provider failed:', result.error)
      return new Response(JSON.stringify({ error: 'AI Service Unavailable' }), { status: 503 })
    }

    return new Response(
      JSON.stringify({
        choices: [{ message: { content: result.data } }],
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('[ai-coach] Unexpected error:', error?.message)
    return new Response(JSON.stringify({ error: 'Unexpected error' }), { status: 500 })
  }
}
