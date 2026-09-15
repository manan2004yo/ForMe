// ============================================================
// FORME - Premium App Shell (Sidebar & Bottom Nav)
// ============================================================

import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Flame, BookOpen, Activity, TrendingUp, User, Sparkles } from 'lucide-react'
import { clsx } from 'clsx'
import { AskFormeAssistant } from '@/features/ai/AskFormeAssistant'
import { useState } from 'react'
import { useUserStore } from '@/store/userStore'
import { ShieldAlert } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/eat', label: 'Food Log', icon: Flame },
  { path: '/plan', label: 'Diet Plan', icon: BookOpen },
  { path: '/train', label: 'Workouts', icon: Activity },
  { path: '/progress', label: 'Progress', icon: TrendingUp },
  { path: '/profile', label: 'Profile', icon: User },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const { isIncognito } = useUserStore()

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-white selection:bg-accent/30 selection:text-white">
      {isIncognito && (
        <div className="bg-red-500/20 border-b border-red-500/30 px-4 py-2 flex items-center justify-center gap-2 text-red-400 z-50 sticky top-0">
          <ShieldAlert size={16} />
          <span className="text-xs font-semibold tracking-wide uppercase">Incognito Mode Active — Data syncing paused</span>
        </div>
      )}
      <div className="flex flex-1">
        {/* --- DESKTOP SIDEBAR --- */}
        <aside className="hidden md:flex flex-col w-64 border-r border-white/5 bg-[#121212] sticky top-0 h-[100dvh] overflow-y-auto">
        <div className="p-8">
          <h1 className="font-heading font-bold tracking-widest text-xl text-white cursor-pointer hover:text-accent transition-colors" onClick={() => navigate('/')}>FORME</h1>
        </div>

        <nav className="flex-1 px-4 flex flex-col gap-2 mt-4">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={clsx(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-95",
                  isActive 
                    ? "bg-white/10 text-white shadow-sm" 
                    : "text-white/50 hover:text-white hover:bg-white/5"
                )}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={20} className={isActive ? 'text-accent' : ''} />
                {label}
              </button>
            )
          })}
        </nav>

        <div className="p-6">
          <button 
            onClick={() => setIsAssistantOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20 outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95"
          >
            <Sparkles size={18} />
            Ask FORME
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 relative flex flex-col pb-24 md:pb-0 min-w-0">
        <div className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-12">
          {children}
        </div>
      </main>

      {/* --- MOBILE BOTTOM NAV --- */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#121212]/90 backdrop-blur-lg border-t border-white/5 z-40 safe-bottom">
        <div className="flex items-center justify-around px-2 py-3">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={clsx(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-95",
                  isActive ? "text-accent" : "text-white/40 hover:text-white/70"
                )}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium tracking-wide mt-1">{label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* --- FLOATING FAB FOR MOBILE --- */}
      <button
        onClick={() => setIsAssistantOpen(true)}
        className="md:hidden fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-accent text-white shadow-lg shadow-accent/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label="Ask FORME Assistant"
      >
        <Sparkles size={24} />
      </button>

      <AskFormeAssistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
      </div>
    </div>
  )
}
