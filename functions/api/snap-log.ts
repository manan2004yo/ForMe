export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json();
    
    if (!env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OpenAI API key not configured in Cloudflare environment variables." }), { status: 500 });
    }

    if (!body.image) {
      return new Response(JSON.stringify({ error: "No image provided" }), { status: 400 });
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
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this food image. Provide a highly accurate estimate of the macronutrients. Return ONLY a raw JSON object with no markdown formatting, structured exactly like this: {"foodName": "string", "calories": number, "protein": number, "carbs": number, "fat": number, "confidence": "high" | "medium" | "low"}. Do not include any other text.' },
              {
                type: 'image_url',
                image_url: {
                  url: body.image,
                }
              }
            ]
          }
        ],
        max_tokens: 300
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI API error');
    }

    const content = data.choices[0].message.content;
    
    // Parse the JSON string returned by OpenAI
    try {
      const parsedData = JSON.parse(content);
      return new Response(JSON.stringify(parsedData), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (parseError) {
      console.error('Failed to parse OpenAI JSON response:', content);
      throw new Error('Invalid JSON format returned from Vision API');
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
