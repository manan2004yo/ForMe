// ============================================================
// FORME — Landing Page
// ============================================================

import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/userStore'
import { useAuthStore } from '@/store/authStore'
import { ArrowRight, Zap, Shield, Target, ChevronRight } from 'lucide-react'

const FEATURES = [
  {
    icon: '🥗',
    title: 'Indian Food Intelligence',
    desc: 'Track roti, dal, sabzi, dahi and 300+ Indian foods with real portion sizes — katori, glass, piece.'
  },
  {
    icon: '💪',
    title: 'Science-Based Training',
    desc: 'Progressive overload plans tailored to your gym, home or hybrid setup. Built for Indian schedules.'
  },
  {
    icon: '📊',
    title: 'Body Recomposition Engine',
    desc: 'Precise BMR, TDEE, and macro targets. Track fat loss and muscle gain with your actual numbers.'
  },
  {
    icon: '💰',
    title: 'Budget-Aware Planning',
    desc: 'Meal plans that fit your ₹2,000–₹8,000/month food budget. Hostel, home, or office — covered.'
  },
]

const STATS = [
  { value: '300+', label: 'Indian Foods' },
  { value: '150+', label: 'Exercises' },
  { value: '7', label: 'Split Types' },
  { value: '∞', label: 'Plans' },
]

export function LandingPage() {
  const navigate = useNavigate()
  const { loadDemoProfile } = useUserStore()
  const { setDemoUser } = useAuthStore()

  const handleDemo = () => {
    setDemoUser()
    loadDemoProfile()
    navigate('/')
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-light via-bg to-bg pointer-events-none" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />

        <div className="relative max-w-lg mx-auto px-6 pt-16 pb-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12 animate-fade-in">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-accent">
              <span className="text-white font-heading font-bold text-lg">F</span>
            </div>
            <span className="font-heading font-bold text-2xl text-text-primary tracking-tight">FORME</span>
          </div>

          {/* Hero Text */}
          <div className="animate-slide-up">
            <div className="badge badge-accent mb-4">
              <Zap size={10} />
              Built for India
            </div>
            <h1 className="font-heading font-bold text-4xl text-text-primary leading-[1.15] mb-4">
              Fitness that{' '}
              <span className="gradient-text">actually fits</span>
              {' '}your life
            </h1>
            <p className="text-text-secondary text-lg leading-relaxed mb-8">
              Track Indian food, build muscle, lose fat — with a plan that understands hostel mess, 
              family dinners, and your ₹3,000/month budget.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/signup')}
                className="btn btn-accent btn-xl w-full"
                id="cta-signup"
              >
                Get Started Free
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="btn btn-secondary btn-xl w-full"
                id="cta-login"
              >
                Sign In
              </button>
              <button
                onClick={handleDemo}
                className="btn btn-ghost btn-md w-full text-text-tertiary"
                id="cta-demo"
              >
                Explore with Demo Profile
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-text-primary text-white py-5">
        <div className="max-w-lg mx-auto px-6">
          <div className="grid grid-cols-4 gap-2 text-center">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <div className="font-heading font-bold text-xl text-accent">{value}</div>
                <div className="text-xs text-white/60 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-lg mx-auto px-6 py-12">
        <h2 className="font-heading font-bold text-2xl text-text-primary text-center mb-8">
          Everything you need
        </h2>
        <div className="flex flex-col gap-4">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className="card p-5 animate-slide-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex gap-4">
                <div className="text-3xl flex-shrink-0">{feature.icon}</div>
                <div>
                  <h3 className="font-heading font-semibold text-text-primary mb-1">{feature.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="max-w-lg mx-auto px-6 pb-12 text-center">
        <div className="card p-8 gradient-bg-warm">
          <div className="text-3xl mb-3">🚀</div>
          <h3 className="font-heading font-bold text-xl text-text-primary mb-2">Ready to transform?</h3>
          <p className="text-text-secondary text-sm mb-6">Join thousands of Indians building their best body.</p>
          <button
            onClick={() => navigate('/signup')}
            className="btn btn-accent btn-lg w-full"
            id="cta-footer-signup"
          >
            Start for Free
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
