// ============================================================
// FORME — Profile Page
// User info, body stats, settings, logout
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUserStore } from '@/store/userStore'
import { useToastStore } from '@/store/toastStore'
import {
  User, Settings, Shield, LogOut, ChevronRight, Edit3,
  Scale, Target, Utensils, Dumbbell, Trophy, Zap, X, Check, Smartphone
} from 'lucide-react'

const GOAL_LABELS: Record<string, string> = {
  build_muscle: '💪 Build Muscle',
  lose_fat: '🔥 Lose Fat',
  body_recomposition: '⚡ Body Recomp',
  get_lean: '✂️ Get Lean',
  improve_fitness: '🏃 Improve Fitness',
  hybrid: '🎯 Hybrid',
}

const COMPLEXITY_LABELS: Record<string, string> = {
  easy: '🌱 Easy Mode',
  smart: '⚡ Smart Mode',
  precision: '🔬 Precision Mode',
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { profile, metrics, isDemoMode, saveProfile } = useUserStore()
  const toast = useToastStore()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editWeight, setEditWeight] = useState('')
  const [editHeight, setEditHeight] = useState('')
  const [editAge, setEditAge] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  if (!profile || !metrics) return null

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      navigate('/landing')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const openEditModal = () => {
    setEditName(profile.name)
    setEditWeight(profile.weightKg.toString())
    setEditHeight(profile.heightCm.toString())
    setEditAge(profile.age.toString())
    setShowEditModal(true)
  }

  const handleSaveProfile = async () => {
    if (!editName.trim()) return
    setIsSavingEdit(true)
    try {
      await saveProfile({
        name: editName.trim(),
        weightKg: parseFloat(editWeight) || profile.weightKg,
        heightCm: parseFloat(editHeight) || profile.heightCm,
        age: parseInt(editAge) || profile.age,
      })
      toast.success('Profile updated successfully!')
      setShowEditModal(false)
    } finally {
      setIsSavingEdit(false)
    }
  }

  const avatarLetter = profile.name?.[0]?.toUpperCase() || 'U'

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <h1 className="font-heading font-bold text-2xl text-text-primary">Profile 👤</h1>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-heading font-bold text-xl text-text-primary">Edit Profile</h2>
                <button onClick={() => setShowEditModal(false)} className="btn btn-ghost p-2 rounded-xl">
                  <X size={18} className="text-text-tertiary" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">Display Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-1.5 block">Weight (kg)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={editWeight}
                      onChange={e => setEditWeight(e.target.value)}
                      step="0.1"
                      min="30"
                      max="300"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-1.5 block">Height (cm)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={editHeight}
                      onChange={e => setEditHeight(e.target.value)}
                      min="100"
                      max="250"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">Age</label>
                  <input
                    type="number"
                    className="input-field"
                    value={editAge}
                    onChange={e => setEditAge(e.target.value)}
                    min="10"
                    max="100"
                  />
                </div>

                <div className="text-xs text-text-tertiary bg-bg-surface2 rounded-xl p-3">
                  💡 Updating weight recalculates your TDEE, BMI, and macro targets automatically.
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowEditModal(false)} className="btn btn-secondary btn-md flex-1">
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSavingEdit || !editName.trim()}
                  className="btn btn-accent btn-md flex-1"
                  id="save-profile"
                >
                  {isSavingEdit ? 'Saving...' : <><Check size={15} /> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Avatar & Name */}
      <div className="card p-5 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center text-white font-heading font-bold text-2xl shadow-accent flex-shrink-0">
            {avatarLetter}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-heading font-bold text-xl text-text-primary truncate">
              {profile.name}
            </div>
            <div className="text-sm text-text-secondary truncate">{profile.email}</div>
            {isDemoMode && (
              <div className="badge badge-accent text-xs mt-1">Demo Mode</div>
            )}
          </div>
          <button onClick={openEditModal} className="btn btn-ghost p-2 rounded-xl" id="edit-profile-btn">
            <Edit3 size={18} className="text-text-secondary" />
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="font-heading font-bold text-lg text-text-primary">{profile.weightKg} kg</div>
            <div className="text-xs text-text-tertiary">Weight</div>
          </div>
          <div>
            <div className="font-heading font-bold text-lg text-text-primary">{profile.heightCm} cm</div>
            <div className="text-xs text-text-tertiary">Height</div>
          </div>
          <div>
            <div className="font-heading font-bold text-lg text-text-primary">{profile.age}y</div>
            <div className="text-xs text-text-tertiary">Age</div>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="card p-4 mb-4">
        <h2 className="font-heading font-semibold text-text-primary mb-3">Your Numbers</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'BMR', value: `${metrics.bmr} kcal`, icon: Zap, desc: 'Basal metabolic rate' },
            { label: 'TDEE', value: `${metrics.tdee} kcal`, icon: Scale, desc: 'Total daily energy' },
            { label: 'Cal Target', value: `${metrics.caloricTarget} kcal`, icon: Target, desc: metrics.caloricStrategy },
            { label: 'Protein', value: `${metrics.proteinTarget}g`, icon: Trophy, desc: 'Daily goal' },
          ].map(({ label, value, icon: Icon, desc }) => (
            <div key={label} className="bg-bg-surface2 rounded-xl p-3">
              <Icon size={14} className="text-accent mb-1" />
              <div className="font-heading font-bold text-text-primary">{value}</div>
              <div className="text-xs text-text-secondary">{label}</div>
              <div className="text-[10px] text-text-tertiary capitalize">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Details */}
      <div className="card p-4 mb-4">
        <h2 className="font-heading font-semibold text-text-primary mb-3">Your Setup</h2>
        <div className="flex flex-col gap-3">
          {[
            { icon: Target, label: 'Goal', value: GOAL_LABELS[profile.fitnessGoal] || profile.fitnessGoal },
            { icon: Utensils, label: 'Diet', value: profile.dietType.replace(/_/g, ' '), suffix: profile.eatsEggs ? '· eats eggs' : '' },
            { icon: Dumbbell, label: 'Training', value: `${profile.trainingDays.length}x/week · ${profile.trainingLocation}` },
            { icon: Settings, label: 'Mode', value: COMPLEXITY_LABELS[profile.complexityMode] || profile.complexityMode },
          ].map(({ icon: Icon, label, value, suffix }) => (
            <div key={label} className="flex items-center gap-3 py-2">
              <Icon size={16} className="text-text-tertiary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-text-tertiary">{label}</div>
                <div className="text-sm font-medium text-text-primary capitalize">
                  {value} {suffix && <span className="text-text-tertiary font-normal">{suffix}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="card overflow-hidden mb-4">
        {[
          { icon: Smartphone, label: 'Connected Apps & Devices', action: () => navigate('/profile/integrations') },
          { icon: User, label: 'Edit Profile', action: () => {} },
          { icon: Settings, label: 'App Settings', action: () => {} },
          { icon: Shield, label: 'Privacy', action: () => {} },
        ].map(({ icon: Icon, label, action }, i) => (
          <button
            key={label}
            onClick={action}
            className={`flex items-center gap-3 w-full px-4 py-4 text-left hover:bg-bg-surface2 transition-colors ${
              i > 0 ? 'border-t border-border' : ''
            }`}
          >
            <Icon size={18} className="text-text-secondary" />
            <span className="flex-1 text-sm font-medium text-text-primary">{label}</span>
            <ChevronRight size={16} className="text-text-tertiary" />
          </button>
        ))}
      </div>

      {/* Logout */}
      {!isDemoMode ? (
        showLogoutConfirm ? (
          <div className="card p-4 mb-4 border-error/20 animate-slide-up">
            <p className="text-sm text-text-secondary mb-3">Are you sure you want to sign out?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="btn btn-secondary btn-md flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="btn btn-md flex-1 bg-error text-white hover:bg-red-700"
                id="confirm-logout"
              >
                {isLoggingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="card w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-error-light transition-colors mb-4"
            id="logout-button"
          >
            <LogOut size={18} className="text-error" />
            <span className="text-sm font-medium text-error">Sign Out</span>
          </button>
        )
      ) : (
        <div className="card p-4 mb-4 gradient-bg-warm border-accent/20 text-center">
          <p className="text-sm text-text-secondary mb-3">
            You're in demo mode. Create an account to save your data.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="btn btn-accent btn-md w-full"
          >
            Create Free Account
          </button>
        </div>
      )}

      <div className="text-center text-xs text-text-tertiary pb-4">
        FORME v0.1.0 · Made with ❤️ for India
      </div>
    </div>
  )
}
