# The Serverless Proxy Blueprint
**Also known as the "Spotify Strategy"**

This document outlines the critical architectural pattern for integrating third-party APIs (like Spotify, Open Food Facts, Apple Health, Google Fit, etc.) into ForMe's pure client-side SPA (Single Page Application).

## The Problem: Client-Side Browser Restrictions

When a React app (running in a web browser) tries to talk directly to a strict third-party API, it will almost always fail due to two main reasons:

1. **CORS (Cross-Origin Resource Sharing)**: Browsers act as strict security guards. If the third-party API doesn't explicitly allow requests from `https://forme.app`, the browser will kill the request instantly and throw a `Failed to fetch` error.
2. **Forbidden Headers & API Keys**: Many APIs require a custom `User-Agent` (which browsers strictly forbid JavaScript from changing) or a secret API Key. If you put a secret API key in your React code, anyone can inspect your website and steal it.

## The Solution: Cloudflare Pages Functions (The Backend-for-Frontend)

Because ForMe is hosted on Cloudflare Pages, we have access to **Cloudflare Functions**. These are serverless backend endpoints that run on Cloudflare's edge network.

**The Golden Rule:** Servers do not have browser security guards. Servers ignore CORS, and servers can securely hold secret API keys without exposing them to the public.

Whenever a third-party API refuses to talk to the browser, we build a proxy tunnel using a Cloudflare Function.

### Step 1: Create the Function Route
Create a TypeScript file in the `functions/api/` directory. 
*Example: `functions/api/spotify/[trackId].ts`*

### Step 2: Write the Proxy Logic
Inside that file, catch the request from the React app, make the real request to the third-party API *from the backend*, and return the data with proper CORS headers so the React app accepts it.

```typescript
// Example: functions/api/spotify/[trackId].ts

interface Env {
  SPOTIFY_SECRET_TOKEN: string; // Securely injected by Cloudflare, never exposed!
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const trackId = context.params.trackId;

  // 1. Make the request FROM THE BACKEND
  const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: {
      'Authorization': `Bearer ${context.env.SPOTIFY_SECRET_TOKEN}`,
      'User-Agent': 'FORME-FitnessApp/1.0' // Browsers block this, but servers don't!
    }
  });

  const data = await response.json();

  // 2. Return data with wildcard CORS so the React app accepts it
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
```

### Step 3: Update the React App
Instead of fetching from the third-party API directly, your React app now simply asks your own Cloudflare backend.

```typescript
// ❌ BEFORE (Fails due to CORS or exposes API keys)
const res = await fetch('https://api.spotify.com/v1/tracks/123'); 

// ✅ AFTER (Succeeds securely via Proxy)
const res = await fetch('/api/spotify/123'); 
```

### Step 4: Local Development (Vite Proxy)
Because Cloudflare Functions don't run natively inside `npm run dev`, you must configure a Vite proxy in `vite.config.ts` to mimic the Cloudflare server behavior locally.

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api/spotify': {
        target: 'https://api.spotify.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/spotify/, '/v1/tracks'),
      }
    }
  }
});
```

By following this blueprint, ForMe can securely integrate with **any** strict API in the world without ever facing browser security blocks.
