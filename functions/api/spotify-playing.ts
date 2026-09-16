export async function onRequestGet(context: any) {
  try {
    const request = context.request;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    const spotifyResponse = await fetch('https://api.spotify.com/v1/me/player/currently-playing?additional_types=track,episode', {
      method: 'GET',
      headers: { 
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    });

    if (spotifyResponse.status === 204) {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    if (!spotifyResponse.ok) {
      const errorText = await spotifyResponse.text();
      return new Response(errorText, {
        status: spotifyResponse.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    const data = await spotifyResponse.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization',
    }
  });
}
