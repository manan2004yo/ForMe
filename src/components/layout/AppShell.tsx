// ============================================================
// FORME — App Shell with Bottom Navigation
// Premium Redesign
// ============================================================

import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Home, UtensilsCrossed, CalendarDays, Dumbbell, TrendingUp, User, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { AskFormeAssistant } from '@/features/ai/AskFormeAssistant'
import { clsx } from 'clsx'

interface NavItem {
  path: string
  label: string
  icon: typeof Home
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/eat', label: 'Eat', icon: UtensilsCrossed },
  { path: '/plan', label: 'Plan', icon: CalendarDays },
  { path: '/train', label: 'Train', icon: Dumbbell },
  { path: '/progress', label: 'Progress', icon: TrendingUp },
  { path: '/profile', label: 'Me', icon: User },
]

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)

  // Find active index for sliding pill
  const activeIndex = NAV_ITEMS.findIndex(item => item.path === location.pathname)

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Main Content Area */}
      <main className="flex-1 pb-28 animate-fade-in relative z-0">
        {children}
      </main>

      {/* Global Notifications */}
      <ToastContainer />
      
      {/* Ask FORME FAB */}
      <div className="fixed bottom-[88px] right-4 z-40">
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-accent blur-xl rounded-full opacity-30 animate-pulse" />
        
        <button 
          onClick={() => setIsAssistantOpen(true)}
          className="relative w-[56px] h-[56px] rounded-full bg-text-primary text-bg shadow-floating flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 active:shadow-card hover:bg-accent hover:text-white group"
          aria-label="Ask FORME"
        >
          <Sparkles size={24} className="group-hover:animate-pulse" />
        </button>
      </div>

      <AskFormeAssistant 
        isOpen={isAssistantOpen} 
        onClose={() => setIsAssistantOpen(false)} 
      />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-bg-surface/90 backdrop-blur-xl border-t border-border shadow-[0_-4px_32px_rgba(0,0,0,0.04)] pb-safe-area">
        <div className="relative flex items-center justify-around px-2 pt-2 pb-2">
          {/* Sliding Pill Indicator */}
          {activeIndex !== -1 && (
            <div 
              className="absolute top-1 bottom-1 bg-bg-surface2 rounded-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                width: `calc(100% / ${NAV_ITEMS.length} - 8px)`,
                left: `calc((100% / ${NAV_ITEMS.length}) * ${activeIndex} + 4px)`,
              }}
            />
          )}

          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="relative z-10 flex flex-col items-center justify-center flex-1 py-1.5 transition-all duration-200 active:scale-95 cursor-pointer"
                aria-label={label}
              >
                <div className={clsx("relative p-1 rounded-xl transition-all duration-300", isActive && "text-accent scale-110", !isActive && "text-text-tertiary hover:text-text-secondary")}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="transition-all duration-300" />
                </div>
                <span className={clsx("text-[10px] font-semibold transition-all duration-300 mt-0.5", isActive ? 'text-text-primary' : 'text-text-tertiary')}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
