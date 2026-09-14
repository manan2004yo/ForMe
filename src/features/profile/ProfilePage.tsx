// ============================================================
// FORME - Premium Profile Page
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUserStore } from '@/store/userStore'
import { LogOut, Target, Edit3, Check, X, Shield, Settings, User } from 'lucide-react'
import { PageTransition } from '@/components/layout/PageTransition'

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { profile, isDemoMode } = useUserStore()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  if (!profile) return null

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <PageTransition>
      <div className="page relative">
        <header className="page-header mb-8">
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight">
            Profile
          </h1>
          <p className="text-sm text-white/50 font-medium tracking-wide mt-2">
            Manage your account and preferences
          </p>
        </header>

        {isDemoMode && (
          <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <Shield size={20} className="text-accent flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-accent font-medium text-sm">Demo Mode Active</h3>
              <p className="text-xs text-accent/70 mt-1">
                You are currently viewing a read-only demo. Sign up to save your data permanently.
              </p>
            </div>
          </div>
        )}

        {/* User Card */}
        <div className="bg-[#121212] border border-white/5 rounded-3xl p-6 mb-6 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-3xl font-heading font-bold text-white uppercase shadow-inner">
            {profile.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{profile.name}</h2>
            <div className="text-sm text-white/50 mt-1 capitalize">{profile.dietType} Diet • {profile.fitnessGoal.replace('_', ' ')}</div>
            <div className="text-xs text-white/30 mt-1">{user?.email || 'demo@example.com'}</div>
          </div>
          <button className="p-3 bg-white/5 rounded-xl text-white/50 hover:text-white transition-colors">
            <Edit3 size={18} />
          </button>
        </div>

        {/* Settings Links */}
        <div className="bg-[#121212] border border-white/5 rounded-3xl overflow-hidden mb-8">
          <div className="p-4 border-b border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/70">
                <Target size={18} />
              </div>
              <div>
                <div className="text-sm font-medium text-white">Adjust Goals</div>
                <div className="text-xs text-white/50 mt-0.5">Change target weight or macros</div>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/70">
                <User size={18} />
              </div>
              <div>
                <div className="text-sm font-medium text-white">Account Details</div>
                <div className="text-xs text-white/50 mt-0.5">Manage email and password</div>
              </div>
            </div>
          </div>

          <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/70">
                <Settings size={18} />
              </div>
              <div>
                <div className="text-sm font-medium text-white">Preferences</div>
                <div className="text-xs text-white/50 mt-0.5">Units, theme, and notifications</div>
              </div>
            </div>
          </div>
        </div>

        {/* Logout */}
        {showLogoutConfirm ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 flex flex-col items-center text-center">
            <h3 className="text-red-400 font-medium mb-4">Are you sure you want to sign out?</h3>
            <div className="flex gap-4 w-full">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleLogout}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-4 bg-[#121212] border border-white/5 text-red-400 rounded-3xl font-medium hover:bg-red-500/5 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        )}

      </div>
    </PageTransition>
  )
}
