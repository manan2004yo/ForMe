import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ArrowLeft, CheckCircle } from 'lucide-react'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { sendPasswordReset, isLoading, error, clearError } = useAuthStore()
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setSuccess(false)
    try {
      await sendPasswordReset(email)
      setSuccess(true)
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
          Back to login
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-accent">
            <span className="text-white font-heading font-bold text-lg">F</span>
          </div>
          <span className="font-heading font-bold text-2xl text-text-primary">FORME</span>
        </div>

        <h1 className="font-heading font-bold text-3xl text-text-primary mb-2">Reset Password</h1>
        <p className="text-text-secondary">Enter your email and we'll send you a link to reset your password.</p>
      </div>

      {/* Form */}
      {success ? (
        <div className="bg-[#121212] border border-accent/20 p-6 rounded-2xl flex flex-col items-center text-center animate-fade-in">
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent mb-4">
            <CheckCircle size={24} />
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-2">Check your email</h2>
          <p className="text-text-secondary text-sm mb-6">
            We sent a password reset link to <span className="font-medium text-text-primary">{email}</span>.
          </p>
          <button onClick={() => navigate('/login')} className="btn btn-primary w-full">
            Return to Login
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-error-light border border-error/20 text-error text-sm px-4 py-3 rounded-xl animate-fade-in">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Email address</label>
            <input
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full mt-4"
            disabled={isLoading || !email.trim()}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}
    </div>
  )
}
