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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: 'Look closely at this image. Extract the barcode number. Return ONLY the raw numerical digits of the barcode (e.g. 1234567890123). Do not include any other text, markdown, or explanation. If you absolutely cannot read any barcode, return "NOT_FOUND".' },
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
          temperature: 0.1
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API error');
    }

    const content = data.candidates[0]?.content?.parts[0]?.text || '';
    
    // Strip everything except numerical digits (handles markdown or chatty AI responses)
    const rawDigits = content.replace(/\D/g, '');
    
    // Standard barcodes are usually 8, 12, 13, or 14 digits. 
    // If it's too short, it's not a valid barcode (e.g., if it replied 'NOT_FOUND')
    const barcode = rawDigits.length >= 6 ? rawDigits : 'NOT_FOUND';

    return new Response(JSON.stringify({ barcode }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
