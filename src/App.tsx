// ============================================================
// FORME — Main App with Routing & Auth Guard
// ============================================================

import { useAchievementEngine } from '@/lib/engines/useAchievementEngine'
import { useAchievementStore } from '@/store/achievementStore'
import { useAuthStore } from '@/store/authStore'
import { useSpotifyStore } from '@/store/spotifyStore'
import { useUserStore } from '@/store/userStore'
import { AnimatePresence } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ActiveWorkoutOverlay } from '@/features/train/ActiveWorkoutOverlay'

// Feature imports
import { AppShell } from '@/components/layout/AppShell'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { LandingPage } from '@/features/auth/LandingPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { EatDashboard } from '@/features/eat/EatDashboard'
import { HomeDashboard } from '@/features/home/HomeDashboard'
import { OnboardingFlow } from '@/features/onboarding/OnboardingFlow'
import { PlanDashboard } from '@/features/plan/PlanDashboard'
import { AchievementsPage } from '@/features/profile/AchievementsPage'
import { IntegrationsPage } from '@/features/profile/IntegrationsPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { ProgressDashboard } from '@/features/progress/ProgressDashboard'
import { TrainDashboard } from '@/features/train/TrainDashboard'
import { useToastStore } from '@/store/toastStore'


function SpotifyCallback() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const processedCode = useRef<string | null>(null)
  
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const code = params.get('code')
    const error = params.get('error')
    
    // Prevent double-firing the same code (React Strict Mode / re-renders)
    if (code && processedCode.current !== code) {
      processedCode.current = code
      
      // Clear URL so it doesn't get processed again on reload
      window.history.replaceState({}, document.title, window.location.pathname)
      
      useSpotifyStore.getState().handleCallback(code).then(() => {
        navigate('/train')
      })
    } else if (error) {
      useToastStore.getState().error(`Spotify auth error: ${error}`)
      navigate('/train')
    } else {
      navigate('/train')
    }
  }, [location, navigate])

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
    if (user) {
      loadProfile(user.uid)
      useAchievementStore.getState().loadAchievements(user.uid)
    }
  }, [user, loadProfile])

  if (error) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-bg p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center mb-4">
          <span className="text-error text-2xl font-bold">!</span>
        </div>
        <h2 className="text-text-primary font-heading font-bold text-xl mb-2">Database Connection Error</h2>
        <p className="text-text-secondary text-sm mb-6 max-w-sm">{error}</p>
        <div className="flex gap-3">
          <button 
            onClick={() => user && loadProfile(user.uid)} 
            className="btn btn-accent"
          >
            Retry Loading
          </button>
          <button 
            onClick={() => logout()} 
            className="btn btn-secondary"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-bg p-6 text-center">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-white font-heading font-bold text-xl">
            F
          </div>
          <div className="flex gap-1 mt-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
        <p className="text-text-secondary text-sm mb-4">Loading your profile...</p>
        <button 
          onClick={() => logout()} 
          className="text-xs text-text-tertiary underline hover:text-text-secondary"
        >
          Cancel & Sign Out
        </button>
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
      <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPasswordPage />} />
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
    <>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer />
      </BrowserRouter>
      <ActiveWorkoutOverlay />
    </>
  )
}
