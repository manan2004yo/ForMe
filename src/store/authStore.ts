// ============================================================
// FORME — Zustand Auth Store
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from 'firebase/auth'
import { observeAuthState, signUpWithEmail, signInWithEmail, signInWithGoogle, signOutUser, resetPassword, deleteUserAccount } from '@/lib/firebase/authService'
import { deleteUserData } from '@/lib/firebase/dataService'

interface AuthState {
  user: User | { uid: string; email: string; displayName: string } | null
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  isDemo: boolean
  isPro: boolean

  // Actions
  initialize: () => () => void
  loginWithEmail: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  loginWithGoogle: (rememberMe?: boolean) => Promise<void>
  signup: (email: string, password: string, name: string, rememberMe?: boolean) => Promise<void>
  logout: () => Promise<void>
  deleteAccount: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  clearError: () => void
  setDemoUser: () => void
  setProStatus: (status: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isInitialized: false,
      error: null,
      isDemo: false,
      isPro: false,

  setProStatus: (status: boolean) => set({ isPro: status }),

  setDemoUser: () => {
    set({
      user: { uid: 'demo', email: 'demo@forme.app', displayName: 'Arjun (Demo)' },
      isInitialized: true,
      isDemo: true,
      isPro: true, // Demo users get pro automatically for testing
    })
  },

  initialize: () => {
    // Check for unconfigured Firebase (placeholder keys)
    const isConfigured = !import.meta.env.VITE_FIREBASE_API_KEY
      ? false
      : import.meta.env.VITE_FIREBASE_API_KEY !== 'YOUR_API_KEY'

    if (!isConfigured) {
      // No real Firebase — mark as initialized but no user
      set({ isInitialized: true })
      return () => {}
    }

    const unsubscribe = observeAuthState((user) => {
      set({ user, isInitialized: true, isLoading: false })
    })
    return unsubscribe
  },

  loginWithEmail: async (email, password, rememberMe = true) => {
    if (!import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'YOUR_API_KEY') {
      const msg = 'Firebase is not configured. Please set your VITE_FIREBASE_* environment variables in .env'
      set({ error: msg, isLoading: false })
      throw new Error(msg)
    }
    set({ isLoading: true, error: null })
    try {
      await signInWithEmail(email, password, rememberMe)
    } catch (err: any) {
      const msg = parseFirebaseError(err.code)
      set({ error: msg })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  loginWithGoogle: async (rememberMe = true) => {
    if (!import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'YOUR_API_KEY') {
      const msg = 'Firebase is not configured. Please set your VITE_FIREBASE_* environment variables in .env'
      set({ error: msg, isLoading: false })
      throw new Error(msg)
    }
    set({ isLoading: true, error: null })
    try {
      await signInWithGoogle(rememberMe)
    } catch (err: any) {
      const msg = parseFirebaseError(err.code)
      set({ error: msg })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  signup: async (email, password, name, rememberMe = true) => {
    if (!import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'YOUR_API_KEY') {
      const msg = 'Firebase is not configured. Please set your VITE_FIREBASE_* environment variables in .env'
      set({ error: msg, isLoading: false })
      throw new Error(msg)
    }
    set({ isLoading: true, error: null })
    try {
      await signUpWithEmail(email, password, name, rememberMe)
    } catch (err: any) {
      const msg = parseFirebaseError(err.code)
      set({ error: msg })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      if (get().isDemo) {
        set({ user: null, isDemo: false })
      } else {
        await signOutUser()
        set({ user: null, isDemo: false })
      }
      
      // Clear all local storage keys that belong to FORME state
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        if (key.startsWith('forme_') || key.startsWith('forme-')) {
          localStorage.removeItem(key)
        }
      }
      
      // Also clear any lingering third-party OAuth verifiers
      localStorage.removeItem('spotify_code_verifier')
      
      // Force reload to completely wipe Zustand in-memory state for all stores
      window.location.href = '/'
    } finally {
      set({ isLoading: false })
    }
  },

  deleteAccount: async () => {
    const user = get().user
    if (!user || user.uid === 'demo') {
      await get().logout()
      return
    }

    set({ isLoading: true, error: null })
    try {
      // 1. Delete all Firestore data for this user
      await deleteUserData(user.uid)
      
      // 2. Delete the Firebase Auth account
      await deleteUserAccount()
      
      // 3. Clean up local state
      set({ user: null })
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        if (key.startsWith('forme_') || key.startsWith('forme-')) {
          localStorage.removeItem(key)
        }
      }
      
      // 4. Force reload to wipe in-memory state
      window.location.href = '/'
    } catch (err: any) {
      set({ error: err.code === 'auth/requires-recent-login' ? 'For your security, please sign out and sign back in before deleting your account.' : 'Failed to delete account. Please try again.' })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  sendPasswordReset: async (email) => {
    set({ isLoading: true, error: null })
    try {
      await resetPassword(email)
    } catch (err: any) {
      set({ error: parseFirebaseError(err.code) })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  clearError: () => set({ error: null }),
}), { 
  name: 'forme-auth-storage',
  partialize: (state) => ({ user: state.user, isDemo: state.isDemo }) // DO NOT persist isInitialized or isLoading
}))

function parseFirebaseError(code: string): string {
  switch (code) {
    case 'auth/invalid-email': return 'Invalid email address.'
    case 'auth/user-disabled': return 'This account has been disabled.'
    case 'auth/user-not-found': return 'No account found with this email.'
    case 'auth/wrong-password': return 'Incorrect password.'
    case 'auth/invalid-credential': return 'Incorrect email or password.'
    case 'auth/email-already-in-use': return 'An account with this email already exists.'
    case 'auth/weak-password': return 'Password must be at least 6 characters.'
    case 'auth/popup-closed-by-user': return 'Sign-in window was closed. Please try again.'
    case 'auth/network-request-failed': return 'Network error. Check your connection.'
    case 'auth/too-many-requests': return 'Too many attempts. Please try again later.'
    default: return 'Something went wrong. Please try again.'
  }
}
