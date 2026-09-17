import { motion } from 'framer-motion'
import { ArrowLeft, Bell, Moon, Sun, Smartphone, Activity, Loader2, Music } from 'lucide-react'
import { useSpotifyStore } from '@/store/spotifyStore'
import { useState } from 'react'
import { clsx } from 'clsx'
import { useIntegrationStore, type Platform } from '@/store/integrationStore'

export function AppSettingsModal({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState(true)
  const [theme, setTheme] = useState('dark')
  const { isConnected: isSpotifyConnected, isConnecting: isSpotifyConnecting, connect: connectSpotify, disconnect: disconnectSpotify } = useSpotifyStore()


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
                {theme === 'dark' ? <Moon size={20} className="text-white/70" /> : <Sun size={20} className="text-white/70" />}
                <div>
                  <span className="font-medium text-white block">App Theme</span>
                  <span className="text-xs text-white/50">Current: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                </div>
              </div>
              <select 
                value={theme}
                onChange={e => setTheme(e.target.value)}
                className="bg-black border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
            </div>

            <button 
              onClick={() => isSpotifyConnected ? disconnectSpotify() : connectSpotify()}
              className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center">
                  <Music size={16} />
                </div>
                <div className="text-left">
                  <span className="font-medium text-white block">Spotify</span>
                  <span className="text-xs text-white/40">Performance Tracking</span>
                </div>
              </div>
              <span className={clsx(
                "text-xs font-semibold px-2 py-1 rounded-lg transition-colors flex items-center gap-1",
                isSpotifyConnected ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/50"
              )}>
                {isSpotifyConnecting && <Loader2 size={12} className="animate-spin" />}
                {isSpotifyConnected ? 'Connected' : 'Connect'}
              </span>
            </button>

          </div>
        </div>

      </div>
    </motion.div>
  )
}
