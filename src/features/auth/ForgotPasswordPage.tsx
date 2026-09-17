// ============================================================
// FORME — Forgot Password Page
// ============================================================

import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { sendPasswordReset, isLoading, error, clearError } = useAuthStore()
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setSuccess(false)
    
    if (!email) return
    
    try {
      await sendPasswordReset(email)
      setSuccess(true)
      useToastStore.getState().success('Password reset email sent!')
    } catch {
      // error handled in store
    }
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col max-w-lg mx-auto px-6">
      {/* Header */}
      <div className="pt-12 pb-8">
        <button onClick={() => navigate('/login')} className="btn btn-ghost btn-sm -ml-2 mb-8">
          <ArrowLeft size={16} />
          Back to Login
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-accent">
            <span className="text-white font-heading font-bold text-lg">F</span>
          </div>
          <span className="text-2xl font-heading font-black tracking-tighter text-white">
            FORME<span className="text-accent">.</span>
          </span>
        </div>

        <h1 className="text-3xl font-heading font-bold text-white tracking-tight mb-2">
          Reset Password
        </h1>
        <p className="text-white/60">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {success ? (
          <div className="p-6 rounded-2xl bg-[#121212] border border-accent/20 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-accent/20 text-accent flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl">📧</span>
            </div>
            <h3 className="text-white font-medium text-lg">Check your inbox</h3>
            <p className="text-white/60 text-sm">
              We've sent a password reset link to <span className="text-white font-medium">{email}</span>.
            </p>
            <button 
              onClick={() => navigate('/login')}
              className="btn btn-primary w-full mt-4"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5 ml-1">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-[#121212] border border-white/5 rounded-2xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-full h-12 text-base font-semibold"
              disabled={isLoading || !email}
            >
              {isLoading ? 'Sending Link...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
