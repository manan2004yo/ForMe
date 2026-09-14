// ============================================================
// FORME - Premium Profile Page
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUserStore } from '@/store/userStore'
import { useTrainStore } from '@/store/trainStore'
import { LogOut, Target, Edit3, Shield, User, Save, Flame, Activity, BookOpen } from 'lucide-react'
import { PageTransition } from '@/components/layout/PageTransition'
import { clsx } from 'clsx'
import type { UserProfile } from '@/types'
import { FormeProPaywall } from '../pro/FormeProPaywall'
import { Crown } from 'lucide-react'

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { profile, isDemoMode, saveProfile } = useUserStore()
  const { templates: trainTemplates } = useTrainStore()
  
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<UserProfile> | null>(null)
  const [showProPaywall, setShowProPaywall] = useState(false)
  const { isPro } = useAuthStore()

  if (!profile) return null

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleEditClick = () => {
    setEditForm(profile)
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (editForm) {
      await saveProfile(editForm)
    }
    setIsEditing(false)
  }

  if (showProPaywall) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/95">
        <FormeProPaywall onClose={() => setShowProPaywall(false)} />
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="page relative pb-24">
        <header className="page-header mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-white tracking-tight">
              Profile
            </h1>
            <p className="text-sm text-white/50 font-medium tracking-wide mt-2">
              Manage your personal details and goals
            </p>
          </div>
          {!isEditing ? (
            <button 
              onClick={handleEditClick}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-all active:scale-95 flex items-center gap-2"
            >
              <Edit3 size={16} /> Edit Profile
            </button>
          ) : (
            <button 
              onClick={handleSave}
              className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg text-sm font-medium transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-accent/20"
            >
              <Save size={16} /> Save Changes
            </button>
          )}
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
        <div className="bg-[#121212] border border-white/5 rounded-3xl p-6 mb-8 flex items-center gap-6 shadow-xl">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-3xl font-heading font-bold text-white uppercase shadow-inner">
            {profile.name.charAt(0)}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editForm?.name || ''}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white w-full sm:w-1/2 outline-none focus:ring-2 focus:ring-accent font-bold text-lg mb-2"
              />
            ) : (
              <h2 className="text-xl font-bold text-white">{profile.name}</h2>
            )}
            
            <div className="text-xs text-white/30 mb-2">{user?.email || 'demo@example.com'}</div>
            
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-medium bg-white/5 text-white/70 px-2 py-1 rounded capitalize">
                {profile.dietType}
              </span>
              <span className="text-xs font-medium bg-white/5 text-white/70 px-2 py-1 rounded capitalize">
                {profile.fitnessGoal.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Personal Details */}
          <div className="bg-[#121212] border border-white/5 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70">
                <User size={18} />
              </div>
              <h3 className="font-semibold text-white">Personal Details</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/50">Age</span>
                {isEditing ? (
                  <input type="number" value={editForm?.age || ''} onChange={e => setEditForm({...editForm, age: parseInt(e.target.value)})} className="bg-white/5 border border-white/10 rounded px-2 py-1 w-20 text-white outline-none focus:border-accent text-right text-sm" />
                ) : (
                  <span className="text-sm font-medium text-white">{profile.age} yrs</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/50">Height</span>
                {isEditing ? (
                  <input type="number" value={editForm?.heightCm || ''} onChange={e => setEditForm({...editForm, heightCm: parseInt(e.target.value)})} className="bg-white/5 border border-white/10 rounded px-2 py-1 w-20 text-white outline-none focus:border-accent text-right text-sm" />
                ) : (
                  <span className="text-sm font-medium text-white">{profile.heightCm} cm</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/50">Gender</span>
                {isEditing ? (
                  <select value={editForm?.gender || ''} onChange={e => setEditForm({...editForm, gender: e.target.value as any})} className="bg-white/5 border border-white/10 rounded px-2 py-1 w-24 text-white outline-none focus:border-accent text-right text-sm [&>option]:bg-[#121212]">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                ) : (
                  <span className="text-sm font-medium text-white capitalize">{profile.gender}</span>
                )}
              </div>
            </div>
          </div>

          {/* Goals & Preferences */}
          <div className="bg-[#121212] border border-white/5 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70">
                <Target size={18} />
              </div>
              <h3 className="font-semibold text-white">Goals & Diet</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/50">Fitness Goal</span>
                {isEditing ? (
                  <select value={editForm?.fitnessGoal || ''} onChange={e => setEditForm({...editForm, fitnessGoal: e.target.value as any})} className="bg-white/5 border border-white/10 rounded px-2 py-1 w-36 text-white outline-none focus:border-accent text-right text-sm [&>option]:bg-[#121212]">
                    <option value="lose_weight">Lose Weight</option>
                    <option value="build_muscle">Build Muscle</option>
                    <option value="body_recomposition">Recomp</option>
                    <option value="lean_bulk">Lean Bulk</option>
                  </select>
                ) : (
                  <span className="text-sm font-medium text-white capitalize">{profile.fitnessGoal.replace('_', ' ')}</span>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/50">Diet Type</span>
                {isEditing ? (
                  <select value={editForm?.dietType || ''} onChange={e => setEditForm({...editForm, dietType: e.target.value as any})} className="bg-white/5 border border-white/10 rounded px-2 py-1 w-32 text-white outline-none focus:border-accent text-right text-sm [&>option]:bg-[#121212]">
                    <option value="vegetarian">Vegetarian</option>
                    <option value="eggetarian">Eggetarian</option>
                    <option value="non_vegetarian">Non-Veg</option>
                    <option value="vegan">Vegan</option>
                  </select>
                ) : (
                  <span className="text-sm font-medium text-white capitalize">{profile.dietType}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Saved Templates */}
        <div className="bg-[#121212] border border-white/5 rounded-3xl p-6 shadow-xl mb-8">
          <h3 className="font-semibold text-white mb-6">Your Library</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
              <Activity size={24} className="text-accent mb-2" />
              <div className="text-xl font-bold text-white">{trainTemplates.length}</div>
              <div className="text-xs text-white/50">Workout Templates</div>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
              <BookOpen size={24} className="text-blue-400 mb-2" />
              <div className="text-xl font-bold text-white">0</div>
              <div className="text-xs text-white/50">Meal Templates</div>
            </div>
          </div>
        </div>

        {/* FORME PRO */}
        <div className="bg-gradient-to-r from-accent/20 to-accent/5 border border-accent/20 rounded-3xl p-6 shadow-xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
              <Crown className="text-accent" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">FORME PRO</h3>
              <p className="text-sm text-white/60">
                {isPro ? "You have unlocked all premium features." : "Unlock AI Periodization, Menu Hacker & more."}
              </p>
            </div>
          </div>
          {!isPro && (
            <button 
              onClick={() => setShowProPaywall(true)}
              className="px-6 py-3 bg-accent text-black font-bold rounded-xl whitespace-nowrap active:scale-95 transition-all shadow-[0_0_20px_rgba(45,212,191,0.3)]"
            >
              Upgrade Now
            </button>
          )}
        </div>

        {/* Logout */}
        {showLogoutConfirm ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 flex flex-col items-center text-center shadow-xl">
            <h3 className="text-red-400 font-medium mb-4">Are you sure you want to sign out?</h3>
            <div className="flex gap-4 w-full sm:w-auto">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="px-8 py-3 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors active:scale-95"
              >
                Cancel
              </button>
              <button 
                onClick={handleLogout}
                className="px-8 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 active:scale-95"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full sm:w-auto px-8 py-4 bg-[#121212] border border-white/5 text-red-400 rounded-2xl font-medium hover:bg-red-500/5 transition-colors flex items-center justify-center gap-2 active:scale-95 mx-auto"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        )}

      </div>
    </PageTransition>
  )
}
