// ============================================================
// FORME - Premium App Shell (Sidebar & Bottom Nav)
// ============================================================

import { useUserStore } from '@/store/userStore'
import { clsx } from 'clsx'
import { Activity, BookOpen, Flame, Home, ShieldAlert, TrendingUp, User } from 'lucide-react'

import { useLocation, useNavigate } from 'react-router-dom'

const PRIMARY_NAV_ITEMS = [
  { path: '/', label: 'Today', icon: Home },
  { path: '/train', label: 'Train', icon: Activity },
  { path: '/eat', label: 'Fuel', icon: Flame },
  { path: '/progress', label: 'Progress', icon: TrendingUp },
  { path: '/profile', label: 'Profile', icon: User },
]

const SECONDARY_NAV_ITEMS = [
  { path: '/plan', label: 'Legacy Plan', icon: BookOpen },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { isIncognito } = useUserStore()

  const isWorkoutRoute = location.pathname === '/train/active' || location.pathname === '/train/review'

  if (isWorkoutRoute) {
    return (
      <div className="flex flex-col min-h-dvh bg-bg text-white selection:bg-accent/30 selection:text-white">
        {isIncognito && (
          <div className="bg-red-500/20 border-b border-red-500/30 px-4 py-2 flex items-center justify-center gap-2 text-red-400 z-50 sticky top-0">
            <ShieldAlert size={16} />
            <span className="text-xs font-semibold tracking-wide uppercase">Incognito Mode Active — Data syncing paused</span>
          </div>
        )}
        {children}
      </div>
    )
  }

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
        <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-white/5 bg-[#0a0a0a] sticky top-0 h-[100dvh] overflow-y-auto shrink-0 z-10">
          <div className="p-6 lg:p-8">
            <h1 className="font-heading font-bold tracking-widest text-xl lg:text-2xl text-white cursor-pointer hover:text-accent transition-colors" onClick={() => navigate('/')}>
              FORME
            </h1>
          </div>

          <div className="flex-1 flex flex-col justify-between px-4 pb-6">
            <nav className="flex flex-col gap-2">
              {PRIMARY_NAV_ITEMS.map(({ path, label, icon: Icon }) => {
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

            <nav className="flex flex-col gap-2 mt-12 pt-6 border-t border-white/5">
              <span className="px-4 text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1">Tools</span>
              {SECONDARY_NAV_ITEMS.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path
                return (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    className={clsx(
                      "flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-95",
                      isActive 
                        ? "bg-white/10 text-white shadow-sm" 
                        : "text-white/40 hover:text-white hover:bg-white/5"
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
          </div>
        </aside>

        {/* --- MAIN CONTENT AREA --- */}
        <main className="flex-1 relative flex flex-col pb-24 md:pb-0 min-w-0 bg-[#0a0a0a]">
          {/* max-w-5xl (1024px) allows reasonable desktop expansion without stretching mobile elements to 1920px */}
          <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-10 lg:px-12 py-6 md:py-10">
            {children}
          </div>
        </main>

        {/* --- MOBILE BOTTOM NAV --- */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 z-40 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-around px-2 py-2">
            {PRIMARY_NAV_ITEMS.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={clsx(
                    "flex flex-col items-center justify-center gap-1 p-2 min-w-[64px] min-h-[48px] rounded-lg transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-95",
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

      </div>
    </div>
  )
}
