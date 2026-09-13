// ============================================================
// FORME — Zustand Auth Store
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from 'firebase/auth'
import { observeAuthState, signUpWithEmail, signInWithEmail, signInWithGoogle, signOutUser, resetPassword } from '@/lib/firebase/authService'

interface AuthState {
  user: User | { uid: string; email: string; displayName: string } | null
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  isDemo: boolean

  // Actions
  initialize: () => () => void
  loginWithEmail: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  loginWithGoogle: (rememberMe?: boolean) => Promise<void>
  signup: (email: string, password: string, name: string, rememberMe?: boolean) => Promise<void>
  logout: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  clearError: () => void
  setDemoUser: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      isInitialized: false,
      error: null,
      isDemo: false,

  setDemoUser: () => {
    set({
      user: { uid: 'demo', email: 'demo@forme.app', displayName: 'Arjun (Demo)' },
      isInitialized: true,
      isDemo: true,
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
      await signOutUser()
      set({ user: null })
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
