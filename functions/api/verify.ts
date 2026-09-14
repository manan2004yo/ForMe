export async function onRequestPost(context: any) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = body;

    const secret = env.RAZORPAY_KEY_SECRET || 'secret_placeholder';
    const generated_signature = await hmacSha256(
      razorpay_payment_id + '|' + razorpay_subscription_id, 
      secret
    );

    if (generated_signature !== razorpay_signature) {
      return new Response(JSON.stringify({ valid: false, error: 'Invalid signature' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ valid: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ valid: false, error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper to calculate HMAC-SHA256 using Web Crypto API (Edge Compatible)
async function hmacSha256(message: string, secret: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    enc.encode(message)
  );
  
  // Convert ArrayBuffer to Hex string
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
