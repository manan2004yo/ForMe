import { generateStructuredOutput } from '../lib/aiOrchestrator'

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context
    const body = await request.json()

    if (!body.transcript) {
      return new Response(JSON.stringify({ error: 'No transcript provided' }), { status: 400 })
    }

    const prompt =
      `You are a voice parser for a fitness app. Analyze the given transcript and determine the user's intent. ` +
      `Return ONLY a JSON object with the following shape:\n` +
      `{\n` +
      `  "intent": "LOG_FOOD" | "LOG_WORKOUT" | "UNKNOWN",\n` +
      `  // For LOG_FOOD include: "foodName", "quantity", "unit" (if mentioned).\n` +
      `  // For LOG_WORKOUT include: "exerciseName", "sets", "reps", "weight", "weightUnit" (if mentioned).\n` +
      `  // Include a numeric confidence between 0 and 1 indicating how confident you are in the parsing.\n` +
      `}\n\n` +
      `Transcript:\n${body.transcript}`

    const result = await generateStructuredOutput(env, prompt)

    if (!result.success) {
      // Per existing contract: voice parse failures return UNKNOWN with status 200, not a 500
      console.error('[parse-voice] Orchestrator failed:', result.error)
      return new Response(
        JSON.stringify({ intent: 'UNKNOWN', confidence: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(JSON.stringify(result.data), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Unexpected error' }), {
      status: 500,
    })
  }
}
