import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SpotifyTrack {
  id: string
  name: string
  artist: string
  bpm: number
}

interface SpotifyState {
  isConnected: boolean
  isConnecting: boolean
  currentTrack: SpotifyTrack | null
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
  error: string | null
  
  connect: () => Promise<void>
  disconnect: () => void
  handleCallback: (code: string) => Promise<void>
  fetchCurrentTrack: () => Promise<void>
}

// Helper to generate PKCE Code Verifier
function generateRandomString(length: number) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

// Helper to generate PKCE Code Challenge
async function sha256(plain: string) {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return window.crypto.subtle.digest('SHA-256', data)
}

function base64encode(input: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
// STRICT CALLBACK URI to fix Spotify 'Not matching configuration' error
const REDIRECT_URI = window.location.origin.includes('localhost') ? 'http://localhost:5173/callback' : window.location.origin + '/callback'

export const useSpotifyStore = create<SpotifyState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      isConnecting: false,
      currentTrack: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      error: null,

      connect: async () => {
        if (!SPOTIFY_CLIENT_ID) {
          set({ error: "Missing VITE_SPOTIFY_CLIENT_ID in environment variables." })
          return
        }
        
        set({ isConnecting: true, error: null })
        
        const codeVerifier = generateRandomString(64)
        window.localStorage.setItem('spotify_code_verifier', codeVerifier)
        
        const hashed = await sha256(codeVerifier)
        const codeChallenge = base64encode(hashed)
        
        const scope = 'user-read-currently-playing user-read-playback-state'
        const authUrl = new URL("https://accounts.spotify.com/authorize")
        
        authUrl.search = new URLSearchParams({
          response_type: 'code',
          client_id: SPOTIFY_CLIENT_ID,
          scope,
          code_challenge_method: 'S256',
          code_challenge: codeChallenge,
          redirect_uri: REDIRECT_URI,
        }).toString()

        // Redirect user to Spotify
        window.location.href = authUrl.toString()
      },

      handleCallback: async (code: string) => {
        if (!SPOTIFY_CLIENT_ID) return;
        set({ isConnecting: true, error: null })
        
        const codeVerifier = window.localStorage.getItem('spotify_code_verifier')
        if (!codeVerifier) {
          set({ isConnecting: false, error: "Auth flow error: Missing code verifier." })
          return
        }

        try {
          const payload = {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: SPOTIFY_CLIENT_ID,
              grant_type: 'authorization_code',
              code,
              redirect_uri: REDIRECT_URI,
              code_verifier: codeVerifier,
            }),
          }

          const body = await fetch('https://accounts.spotify.com/api/token', payload)
          const response = await body.json()

          if (!body.ok) throw new Error(response.error_description || 'Failed to fetch token')

          window.localStorage.removeItem('spotify_code_verifier')
          
          set({
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            expiresAt: Date.now() + response.expires_in * 1000,
            isConnected: true,
            isConnecting: false,
          })
          
        } catch (err: any) {
          set({ isConnecting: false, error: err.message, isConnected: false })
        }
      },

      disconnect: () => {
        set({ isConnected: false, currentTrack: null, accessToken: null, refreshToken: null, expiresAt: null, error: null })
      },

      fetchCurrentTrack: async () => {
        const { accessToken, expiresAt } = get()
        if (!accessToken || !expiresAt) return

        // Basic Token Refresh Logic
        if (Date.now() > expiresAt) {
          // Token expired. We should ideally refresh it here using refreshToken.
          // For simplicity right now, force a disconnect to prompt re-login.
          // (A full production app implements the refresh token POST here).
          set({ isConnected: false, accessToken: null, error: "Session expired. Please reconnect." })
          return;
        }

        try {
          // 1. Get Currently Playing
          const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          })

          if (res.status === 204) {
            // Nothing playing
            set({ currentTrack: null })
            return
          }

          if (res.status === 401) {
            set({ isConnected: false, accessToken: null, error: "Invalid token." })
            return
          }

          const data = await res.json()
          if (!data || !data.item) {
            set({ currentTrack: null })
            return
          }

          const trackId = data.item.id
          const trackName = data.item.name
          const artistName = data.item.artists.map((a: any) => a.name).join(', ')

          // 2. Attempt to get BPM (Audio Features)
          let bpm = 0
          try {
            const afRes = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            })
            if (afRes.ok) {
              const afData = await afRes.json()
              bpm = Math.round(afData.tempo || 0)
            }
          } catch (e) {
            // Ignore Audio Features failure if deprecated/unavailable
          }

          set({
            currentTrack: {
              id: trackId,
              name: trackName,
              artist: artistName,
              bpm
            }
          })

        } catch (err) {
          console.error("Failed to fetch track", err)
        }
      }
    }),
    {
      name: 'forme-spotify-storage',
      // Don't persist errors or connecting state
      partialize: (state) => ({ 
        isConnected: state.isConnected, 
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt
      }),
    }
  )
)
