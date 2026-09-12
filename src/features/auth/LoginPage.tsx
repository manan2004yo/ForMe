// ============================================================
// FORME — Login Page
// ============================================================

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'

export function LoginPage() {
  const navigate = useNavigate()
  const { loginWithEmail, loginWithGoogle, isLoading, error, clearError } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    try {
      await loginWithEmail(email, password)
      navigate('/')
    } catch {
      // error handled in store
    }
  }

  const handleGoogle = async () => {
    clearError()
    try {
      await loginWithGoogle()
      navigate('/')
    } catch {
      // error handled
    }
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col max-w-lg mx-auto px-6">
      {/* Header */}
      <div className="pt-12 pb-8">
        <button onClick={() => navigate('/landing')} className="btn btn-ghost btn-sm -ml-2 mb-8">
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-accent">
            <span className="text-white font-heading font-bold text-lg">F</span>
          </div>
          <span className="font-heading font-bold text-2xl text-text-primary">FORME</span>
        </div>

        <h1 className="font-heading font-bold text-3xl text-text-primary mb-2">Welcome back</h1>
        <p className="text-text-secondary">Sign in to continue your journey</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="bg-error-light border border-error/20 text-error text-sm px-4 py-3 rounded-xl animate-fade-in">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
          <input
            id="login-email"
            type="email"
            className="input-field"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-text-secondary">Password</label>
            <Link to="/forgot-password" className="text-xs text-accent font-medium">Forgot?</Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className="input-field pr-12"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-tertiary hover:text-text-secondary transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          id="login-submit"
          type="submit"
          disabled={isLoading}
          className="btn btn-accent btn-lg w-full mt-2"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Signing in...
            </span>
          ) : 'Sign In'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-text-tertiary text-sm">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Google */}
      <button
        id="login-google"
        onClick={handleGoogle}
        disabled={isLoading}
        className="btn btn-secondary btn-lg w-full"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      {/* Sign up link */}
      <p className="text-center text-text-secondary text-sm mt-8">
        New to FORME?{' '}
        <Link to="/signup" className="text-accent font-medium">
          Create account
        </Link>
      </p>
    </div>
  )
}
