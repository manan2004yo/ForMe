export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json();
    
    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "Gemini API key not configured in Cloudflare environment variables." }), { status: 500 });
    }

    const systemPrompt = "You are Forme AI, a hardcore, no-nonsense fitness and nutrition coach. You give direct, actionable, science-based advice. Keep responses under 3 paragraphs.";

    // Map OpenAI style messages to Gemini style
    const geminiContents = body.messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: { text: systemPrompt }
        },
        contents: geminiContents
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API error');
    }

    // Map Gemini response back to OpenAI style so frontend modelRouter.ts doesn't need changing
    const messageText = data.candidates[0]?.content?.parts[0]?.text || '';

    return new Response(JSON.stringify({
      choices: [
        { message: { content: messageText } }
      ]
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
