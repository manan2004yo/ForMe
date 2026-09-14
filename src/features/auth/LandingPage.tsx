// ============================================================
// FORME - Premium Landing Page
// ============================================================

import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUserStore } from '@/store/userStore'
import { ArrowRight, Activity, Flame, Shield } from 'lucide-react'

export function LandingPage() {
  const navigate = useNavigate()
  const { loginDemo } = useAuthStore() as any // HACK: demo auth
  const { loadDemoProfile } = useUserStore()

  const handleDemo = () => {
    if (loginDemo) loginDemo()
    loadDemoProfile()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-accent/30 selection:text-white flex flex-col font-sans">
      
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-6 md:px-12 md:py-8 w-full max-w-7xl mx-auto">
        <div className="font-heading font-bold tracking-widest text-xl text-white">FORME</div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/login')} 
            className="text-sm font-medium text-white/70 hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md px-2 py-1"
          >
            Sign In
          </button>
          <button 
            onClick={() => navigate('/signup')} 
            className="text-sm font-medium bg-white text-black px-5 py-2.5 rounded-full hover:bg-white/90 transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto mt-12 md:mt-24 mb-24">
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-medium tracking-wide text-white/80">India-first fitness platform</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-heading font-bold leading-[1.1] tracking-tight text-white mb-6">
          Track everything.<br />
          <span className="text-white/40">Sacrifice nothing.</span>
        </h1>

        <p className="text-lg md:text-xl text-white/50 max-w-2xl mb-12 leading-relaxed">
          The intelligent tracking platform designed around real Indian life. 
          Home food, hostel meals, gym routines, and precise body metrics - all in one premium workspace.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button 
            onClick={() => navigate('/signup')} 
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Create Free Account
            <ArrowRight size={20} />
          </button>
          
          <button 
            onClick={handleDemo} 
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/5 text-white border border-white/10 px-8 py-4 rounded-xl font-medium text-lg hover:bg-white/10 transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Try Demo
          </button>
        </div>

        {/* Feature Preview (Abstract UI representation) */}
        <div className="mt-24 relative w-full aspect-video max-w-3xl rounded-2xl border border-white/10 bg-[#121212] shadow-2xl overflow-hidden flex items-center justify-center">
          {/* Subtle gradient glow behind the abstract UI */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,100,0,0.05),transparent_70%)]" />
          
          <div className="flex flex-col gap-6 w-full max-w-lg px-8">
            <div className="w-full h-12 rounded-xl bg-white/5 flex items-center px-4 border border-white/5">
              <div className="w-4 h-4 rounded-full bg-accent/20 mr-4" />
              <div className="h-2 w-32 bg-white/20 rounded-full" />
            </div>
            <div className="w-full flex gap-4">
              <div className="flex-1 h-32 rounded-xl bg-white/5 border border-white/5 p-4 flex flex-col justify-end">
                <div className="h-2 w-16 bg-white/20 rounded-full mb-2" />
                <div className="h-6 w-24 bg-white/80 rounded-full" />
              </div>
              <div className="flex-1 h-32 rounded-xl bg-white/5 border border-white/5 p-4 flex flex-col justify-end">
                <div className="h-2 w-16 bg-white/20 rounded-full mb-2" />
                <div className="h-6 w-24 bg-white/80 rounded-full" />
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-heading font-bold mb-6">Ready to transform?</h2>
        <button 
          onClick={() => navigate('/signup')} 
          className="text-sm font-medium bg-white text-black px-6 py-3 rounded-full hover:bg-white/90 transition-all mb-12 outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Start for Free
        </button>
        <p className="text-xs text-white/30 tracking-wide">&copy; {new Date().getFullYear()} FORME FITNESS. INDIA FIRST.</p>
      </footer>
    </div>
  )
}
