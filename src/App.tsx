// ============================================================
// FORME — Main App with Routing & Auth Guard
// ============================================================

import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUserStore } from '@/store/userStore'

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

function AuthenticatedApp() {
  const { user } = useAuthStore()
  const { profile, loadProfile, loadDemoProfile } = useUserStore()

  useEffect(() => {
    if (user && user.uid !== 'demo') {
      loadProfile(user.uid)
    }
  }, [user, loadProfile])

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
      <Routes>
        <Route path="/" element={<HomeDashboard />} />
        <Route path="/eat" element={<EatDashboard />} />
        <Route path="/plan" element={<PlanDashboard />} />
        <Route path="/train" element={<TrainDashboard />} />
        <Route path="/progress" element={<ProgressDashboard />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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
