// ============================================================
// FORME — App Shell with Bottom Navigation
// Premium Extreme Redesign
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

  return (
    <div className="min-h-dvh flex flex-col relative z-0">
      
      {/* Ambient Animated Background */}
      <div className="ambient-bg-container">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
      </div>

      {/* Main Content Area */}
      <main className="page animate-fade-in">
        {children}
      </main>

      {/* Global Notifications */}
      <ToastContainer />
      
      {/* Ask FORME FAB */}
      <div className="fixed bottom-8 right-8 z-40">
        <div className="absolute inset-0 bg-accent blur-xl rounded-full opacity-40 animate-pulse-glow" />
        <button 
          onClick={() => setIsAssistantOpen(true)}
          className="relative w-[56px] h-[56px] rounded-full bg-text-primary text-bg shadow-floating flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-accent hover:text-white group"
          aria-label="Ask FORME"
        >
          <Sparkles size={24} className="group-hover:animate-pulse" />
        </button>
      </div>

      <AskFormeAssistant 
        isOpen={isAssistantOpen} 
        onClose={() => setIsAssistantOpen(false)} 
      />
      
    </div>
  )
}
