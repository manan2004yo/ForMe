export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json();
    
    if (!env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OpenAI API key not configured in Cloudflare environment variables." }), { status: 500 });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are Forme AI, a hardcore, no-nonsense fitness and nutrition coach. You give direct, actionable, science-based advice. Keep responses under 3 paragraphs.' },
          ...body.messages
        ]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI API error');
    }

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
