// ============================================================
// FORME — Main App with Routing & Auth Guard
// ============================================================

import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useUserStore } from '@/store/userStore'
import { useSpotifyStore } from '@/store/spotifyStore'
import { useAchievementEngine } from '@/lib/engines/useAchievementEngine'

// Feature imports
import { LandingPage } from '@/features/auth/LandingPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { OnboardingFlow } from '@/features/onboarding/OnboardingFlow'
import { AppShell } from '@/components/layout/AppShell'
import { HomeDashboard } from '@/features/home/HomeDashboard'
import { EatDashboard } from '@/features/eat/EatDashboard'
import { PlanDashboard } from '@/features/plan/PlanDashboard'
import { TrainDashboard } from '@/features/train/TrainDashboard'
import { ProgressDashboard } from '@/features/progress/ProgressDashboard'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { IntegrationsPage } from '@/features/profile/IntegrationsPage'
import { AchievementsPage } from '@/features/profile/AchievementsPage'


function SpotifyCallback() {
  const location = useLocation()
  
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const code = params.get('code')
    if (code) {
      useSpotifyStore.getState().handleCallback(code).then(() => {
        window.location.href = '/train' // Redirect to train dashboard after success
      })
    } else {
      window.location.href = '/train' // Fallback
    }
  }, [location])

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-bg">
      <div className="w-12 h-12 rounded-full border-4 border-accent border-t-transparent animate-spin mb-4" />
      <p className="text-white font-medium">Authenticating with Spotify...</p>
    </div>
  )
}

function AuthenticatedApp() {
  const { user, logout } = useAuthStore()
  const { profile, loadProfile, error } = useUserStore()
  const location = useLocation()
  useAchievementEngine()

  useEffect(() => {
    if (user && user.uid !== 'demo') {
      loadProfile(user.uid)
    }
  }, [user, loadProfile])

  if (error) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-bg p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center mb-4">
          <span className="text-error text-2xl font-bold">!</span>
        </div>
        <h2 className="text-text-primary font-heading font-bold text-xl mb-2">Database Error</h2>
        <p className="text-text-secondary text-sm mb-6 max-w-sm">{error}</p>
        <button onClick={() => logout()} className="btn btn-secondary">
          Sign Out & Try Again
        </button>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-white font-heading font-bold text-xl">
            F
          </div>
          <div className="flex gap-1 mt-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  if (!profile.onboardingComplete) {
    return <OnboardingFlow />
  }

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomeDashboard />} />
          <Route path="/eat" element={<EatDashboard />} />
          <Route path="/plan" element={<PlanDashboard />} />
          <Route path="/train" element={<TrainDashboard />} />
          <Route path="/progress" element={<ProgressDashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/integrations" element={<IntegrationsPage />} />
          <Route path="/profile/achievements" element={<AchievementsPage />} />
          <Route path="/callback" element={<SpotifyCallback />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </AppShell>
  )
}

function AppRoutes() {
  const { user, isInitialized, initialize } = useAuthStore()

  useEffect(() => {
    // Intercept Spotify OAuth Callback
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    if (code) {
      useSpotifyStore.getState().handleCallback(code)
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    const unsubscribe = initialize()
    return unsubscribe
  }, [initialize])

  if (!isInitialized) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-white font-heading font-bold text-xl">
            F
          </div>
          <div className="flex gap-1 mt-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <SignupPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route
        path="/*"
        element={user ? <AuthenticatedApp /> : <LandingPage />}
      />
    </Routes>
  )
}


export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
