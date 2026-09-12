// ============================================================
// FORME — App Shell with Bottom Navigation
// ============================================================

import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Home, UtensilsCrossed, CalendarDays, Dumbbell, TrendingUp, User, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { AskFormeAssistant } from '@/features/ai/AskFormeAssistant'

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

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <main className="flex-1">
        {children}
      </main>

      {/* Toast Notifications */}
      <ToastContainer />
      
      {/* Ask FORME FAB */}
      <button 
        onClick={() => setIsAssistantOpen(true)}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-text-primary text-bg shadow-xl shadow-black/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        aria-label="Ask FORME"
      >
        <Sparkles size={24} />
      </button>

      <AskFormeAssistant 
        isOpen={isAssistantOpen} 
        onClose={() => setIsAssistantOpen(false)} 
      />
      <nav className="bottom-nav">
        <div className="flex items-center justify-around px-2 pt-2 pb-2">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`nav-item flex-1 ${isActive ? 'active' : ''}`}
                aria-label={label}
              >
                <div className={`relative p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-accent-light' : ''}`}>
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className={`transition-all duration-200 ${isActive ? 'text-accent' : 'text-text-tertiary'}`}
                  />
                  {isActive && (
                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
                  )}
                </div>
                <span className={`text-[10px] font-medium transition-all duration-200 ${isActive ? 'text-accent' : 'text-text-tertiary'}`}>
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
