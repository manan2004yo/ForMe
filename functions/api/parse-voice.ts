export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json();

    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Gemini API key not configured in Cloudflare environment variables.' }), { status: 500 });
    }

    if (!body.transcript) {
      return new Response(JSON.stringify({ error: 'No transcript provided' }), { status: 400 });
    }

    const prompt = `You are a voice parser for a fitness app. Analyze the given transcript and determine the user's intent. Return ONLY a JSON object with the following shape: {\n  "intent": "LOG_FOOD" | "LOG_WORKOUT" | "UNKNOWN",\n  // For LOG_FOOD include: "foodName", "quantity", "unit" (if mentioned).\n  // For LOG_WORKOUT include: "exerciseName", "sets", "reps", "weight", "weightUnit" (if mentioned).\n  // Include a numeric confidence between 0 and 1 indicating how confident you are in the parsing.\n}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: `${prompt}\n\nTranscript:\n${body.transcript}` }]
        }],
        generationConfig: { response_mime_type: 'application/json' }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API error');
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    try {
      const parsed = JSON.parse(content);
      return new Response(JSON.stringify(parsed), { headers: { 'Content-Type': 'application/json' } });
    } catch {
      console.error('Failed to parse Gemini JSON response:', content);
      return new Response(JSON.stringify({ intent: 'UNKNOWN', confidence: 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Unexpected error' }), { status: 500 });
  }
}
