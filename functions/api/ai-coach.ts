import { generateText } from '../lib/aiOrchestrator'
import type { ConversationMessage } from '../lib/aiOrchestrator'

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context
    const body = await request.json()

    const systemPrompt =
      'You are Forme AI, a hardcore, no-nonsense fitness and nutrition coach. ' +
      'You give direct, actionable, science-based advice. Keep responses under 3 paragraphs.'

    // Map OpenAI-style messages to the Orchestrator's ConversationMessage format.
    // The frontend's modelRouter.ts sends: [{ role: 'user'|'assistant', content: '...' }]
    // The Orchestrator (and Gemini) use:   [{ role: 'user'|'model', content: '...' }]
    const conversationHistory: ConversationMessage[] = body.messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      content: msg.content,
    }))

    const result = await generateText(env, '', {
      systemInstruction: systemPrompt,
      conversationHistory,
    })

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error || 'AI Coach error' }), { status: 500 })
    }

    // Return in OpenAI-style shape so frontend's modelRouter.ts doesn't need changing
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: result.data } }],
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
