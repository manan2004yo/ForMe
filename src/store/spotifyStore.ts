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
  connect: () => Promise<void>
  disconnect: () => void
  fetchCurrentTrack: () => void
}

const MOCK_TRACKS: SpotifyTrack[] = [
  { id: '1', name: 'Till I Collapse', artist: 'Eminem', bpm: 171 },
  { id: '2', name: 'Remember the Name', artist: 'Fort Minor', bpm: 85 },
  { id: '3', name: 'Can\'t Be Touched', artist: 'Roy Jones Jr', bpm: 93 },
  { id: '4', name: 'POWER', artist: 'Kanye West', bpm: 154 },
  { id: '5', name: 'X Gon\' Give It To Ya', artist: 'DMX', bpm: 95 }
]

export const useSpotifyStore = create<SpotifyState>()(
  persist(
    (set) => ({
  isConnected: false,
  isConnecting: false,
  currentTrack: null,

  connect: async () => {
    set({ isConnecting: true })
    // Simulate OAuth flow
    await new Promise(resolve => setTimeout(resolve, 1500))
    set({ isConnected: true, isConnecting: false })
  },

  disconnect: () => {
    set({ isConnected: false, currentTrack: null })
  },

  fetchCurrentTrack: () => {
    set((state) => {
      if (!state.isConnected) return state
      
      // Pick a random high energy track for simulation
      const randomTrack = MOCK_TRACKS[Math.floor(Math.random() * MOCK_TRACKS.length)]
      return { currentTrack: randomTrack }
    })
  }
    }),
    {
      name: 'forme-spotify-storage',
    }
  )
)
