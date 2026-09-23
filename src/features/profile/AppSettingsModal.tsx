import { useUserStore } from '@/store/userStore'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'
import { ArrowLeft, Bell, Moon } from 'lucide-react'
import { useState } from 'react'

export function AppSettingsModal({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState(true)
  const { setTheme } = useUserStore()

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 bg-[#0a0a0a] overflow-y-auto"
    >
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/80 backdrop-blur-md px-4 py-4 flex items-center gap-3 border-b border-white/5">
        <button onClick={onClose} className="p-2 -ml-2 text-white/50 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold text-white tracking-tight">App Settings</h2>
      </div>

      <div className="p-5 space-y-6">
        <div>
          <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-4">Preferences</h3>
          
          <div className="bg-[#121212] border border-white/5 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-white/70" />
                <div>
                  <span className="font-medium text-white block">Push Notifications</span>
                  <span className="text-xs text-white/50">Reminders for meals & workouts</span>
                </div>
              </div>
              <button 
                onClick={() => setNotifications(!notifications)}
                className={clsx(
                  "w-12 h-6 rounded-full transition-colors relative",
                  notifications ? "bg-accent" : "bg-white/10"
                )}
              >
                <div className={clsx(
                  "w-5 h-5 rounded-full bg-black absolute top-0.5 transition-transform",
                  notifications ? "translate-x-6" : "translate-x-0.5 bg-white/50"
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Moon size={20} className="text-white/70" />
                <div>
                  <span className="font-medium text-white block">App Theme</span>
                  <span className="text-xs text-white/50">Dark Mode only for now</span>
                </div>
              </div>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 text-white/50">
                Dark
              </span>
            </div>

          </div>
        </div>
      </div>
    </motion.div>
  )
}
