export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json();
    
    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "Gemini API key not configured in Cloudflare environment variables." }), { status: 500 });
    }

    if (!body.image) {
      return new Response(JSON.stringify({ error: "No image provided" }), { status: 400 });
    }

    // Extract base64 and mime type
    let mimeType = 'image/jpeg';
    let base64Data = body.image;
    
    const match = body.image.match(/^data:(image\/[a-zA-Z]*);base64,([^"]*)$/);
    if (match) {
      mimeType = match[1];
      base64Data = match[2];
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: 'Analyze this food image. Provide a highly accurate estimate of the macronutrients. Return ONLY a raw JSON object with no markdown formatting, structured exactly like this: {"foodName": "string", "calories": number, "protein": number, "carbs": number, "fat": number, "confidence": "high" | "medium" | "low"}. Do not include any other text.' },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API error');
    }

    const content = data.candidates[0]?.content?.parts[0]?.text || '{}';
    
    // Parse the JSON string returned by Gemini
    try {
      const parsedData = JSON.parse(content);
      return new Response(JSON.stringify(parsedData), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch {
      console.error('Failed to parse Gemini JSON response:', content);
      throw new Error('Invalid JSON format returned from Vision API');
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
