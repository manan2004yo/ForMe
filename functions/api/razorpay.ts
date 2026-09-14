export async function onRequestPost(context: any) {
  const { request, env } = context;
  
  try {
    // We expect the user's UID to be sent in the request body
    const body = await request.json();
    const { uid } = body;

    if (!uid) {
      return new Response(JSON.stringify({ error: 'UID is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const key_id = env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
    const key_secret = env.RAZORPAY_KEY_SECRET || 'secret_placeholder';
    const plan_id = env.RAZORPAY_PLAN_ID || 'plan_placeholder';

    // Call Razorpay REST API directly (since SDK requires Node.js)
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${key_id}:${key_secret}`)
      },
      body: JSON.stringify({
        plan_id: plan_id,
        total_count: 120,
        customer_notify: 1,
        notes: {
          firebase_uid: uid
        }
      })
    });

    const data = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      return new Response(JSON.stringify({ error: data.error?.description || 'Razorpay error' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      subscription_id: data.id,
      key_id: key_id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
