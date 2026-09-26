import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { useUserStore } from '@/store/userStore'
import { useFoodLogStore } from '@/store/foodLogStore'
import { reauthenticateWithPassword, reauthenticateWithGoogleProvider, getCurrentUser } from '@/lib/firebase/authService'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Download, EyeOff, Eye, Lock, Shield, Trash2 } from 'lucide-react'
import { useState } from 'react'

export function PrivacySettingsModal({ onClose }: { onClose: () => void }) {
  const { deleteAccount } = useAuthStore()
  const { isIncognito, toggleIncognito } = useUserStore()
  const toast = useToastStore()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showReauth, setShowReauth] = useState(false)
  const [reauthPassword, setReauthPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [reauthError, setReauthError] = useState('')

  const currentUser = getCurrentUser()
  const isGoogleAuth = currentUser?.providerData?.some(p => p.providerId === 'google.com')

  const handleExport = () => {
    const { entries } = useFoodLogStore.getState()
    if (!entries || entries.length === 0) {
      toast.error('No food data to export.')
      return
    }

    let csvContent = 'data:text/csv;charset=utf-8,Date,Meal,Food Item,Calories,Protein,Carbs,Fats\n'
    entries.forEach(entry => {
      entry.foods.forEach(item => {
        const row = [
          entry.date,
          entry.meal,
          `"${item.foodName.replace(/"/g, '""')}"`,
          Math.round(item.nutrition.calories),
          item.nutrition.protein,
          item.nutrition.carbs,
          item.nutrition.fat,
        ].join(',')
        csvContent += row + '\n'
      })
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `forme_nutrition_export_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('CSV export downloaded successfully.')
  }

  // Step 1: first confirm
  // Step 2: if auth/requires-recent-login → show password/Google re-auth
  // Step 3: re-auth → retry delete
  const attemptDelete = async (withReauth = false, useGoogle = false) => {
    setIsDeleting(true)
    try {
      if (withReauth) {
        if (useGoogle) {
          try {
            await reauthenticateWithGoogleProvider()
          } catch (err) {
            setReauthError('Google sign-in failed. Please try again.')
            setIsDeleting(false)
            return
          }
        } else {
          if (!reauthPassword.trim()) {
            setReauthError('Please enter your password.')
            setIsDeleting(false)
            return
          }
          try {
            await reauthenticateWithPassword(reauthPassword)
          } catch {
            setReauthError('Incorrect password. Please try again.')
            setIsDeleting(false)
            return
          }
        }
      }
      await deleteAccount()
      // deleteAccount redirects to '/' on success, so we never reach here
    } catch (err: any) {
      if (err?.code === 'auth/requires-recent-login') {
        // First attempt failed — need password
        setShowDeleteConfirm(false)
        setShowReauth(true)
      } else {
        toast.error('Failed to delete account. Please try again.')
        setShowDeleteConfirm(false)
        setShowReauth(false)
      }
    } finally {
      setIsDeleting(false)
    }
  }

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
        <h2 className="text-lg font-semibold text-white tracking-tight">Privacy &amp; Data</h2>
      </div>

      <div className="p-5 space-y-6">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 flex items-start gap-4">
          <Shield size={24} className="text-blue-400 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-white font-medium mb-1">Your Data is Secure</h3>
            <p className="text-sm text-white/60">FORME encrypts your personal health data. We never sell your data to third-party advertisers.</p>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-4">Data Management</h3>
          <div className="bg-[#121212] border border-white/5 rounded-2xl overflow-hidden space-y-1 p-2">
            <button
              onClick={toggleIncognito}
              className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                  isIncognito ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/70'
                )}>
                  <EyeOff size={16} />
                </div>
                <div className="text-left">
                  <span className="font-medium text-white block">Incognito Mode</span>
                  <span className="text-xs text-white/50">
                    {isIncognito ? 'Tracking is paused' : 'Pause all tracking temporarily'}
                  </span>
                </div>
              </div>
              <div className={clsx(
                'w-12 h-6 rounded-full transition-colors relative',
                isIncognito ? 'bg-red-500' : 'bg-white/10'
              )}>
                <div className={clsx(
                  'w-5 h-5 rounded-full bg-black absolute top-0.5 transition-transform',
                  isIncognito ? 'translate-x-6' : 'translate-x-0.5 bg-white/50'
                )} />
              </div>
            </button>

            <button onClick={handleExport} className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 text-white/70 flex items-center justify-center">
                  <Download size={16} />
                </div>
                <div className="text-left">
                  <span className="font-medium text-white block">Export My Data</span>
                  <span className="text-xs text-white/50">Download all your logs in CSV format</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-medium text-red-400/50 uppercase tracking-wider mb-4">Danger Zone</h3>
          <div className="bg-[#121212] border border-red-500/10 rounded-2xl overflow-hidden p-2">
            <button onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center gap-3 p-3 hover:bg-red-500/10 rounded-xl transition-colors text-left group">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center group-hover:bg-red-500/20">
                <Trash2 size={16} />
              </div>
              <div>
                <span className="font-medium text-red-400 block">Delete Account</span>
                <span className="text-xs text-red-400/50">Permanently erase all your data</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Step 1: Confirm deletion */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Account"
        message="Are you sure you want to permanently delete your account and all data? This cannot be undone."
        confirmText={isDeleting ? 'Deleting...' : 'Delete Permanently'}
        isDestructive={true}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => attemptDelete(false)}
      />

      {/* Step 2: Re-auth password input (appears when Firebase needs fresh login) */}
      <AnimatePresence>
        {showReauth && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowReauth(false); setReauthPassword('') }}
              className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[90] bg-[#0f0f0f] border-t border-white/10 rounded-t-3xl p-6"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}
            >
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              <div className="flex items-center gap-3 mb-2">
                <Lock size={18} className="text-red-400" />
                <h3 className="text-white font-bold text-lg">Confirm Your Identity</h3>
              </div>
              <p className="text-sm text-white/50 mb-5">
                For your security, please confirm your identity to delete your account.
              </p>

              {isGoogleAuth ? (
                <div className="mb-3">
                  <button
                    onClick={() => attemptDelete(true, true)}
                    disabled={isDeleting}
                    className="w-full bg-white text-black font-bold py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    {isDeleting ? 'Deleting...' : 'Re-authenticate with Google'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative mb-3">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Your password"
                      value={reauthPassword}
                      onChange={e => { setReauthPassword(e.target.value); setReauthError('') }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white text-sm focus:outline-none focus:border-red-400/50 transition-all"
                      autoFocus
                    />
                    <button
                      onClick={() => setShowPassword(s => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  
                  <button
                    onClick={() => attemptDelete(true, false)}
                    disabled={isDeleting || !reauthPassword.trim()}
                    className="w-full py-3.5 rounded-2xl bg-red-500 text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all mb-3"
                  >
                    {isDeleting ? 'Deleting...' : 'Confirm & Delete Account'}
                  </button>
                </>
              )}

              {reauthError && (
                <p className="text-sm text-red-400 mb-3">{reauthError}</p>
              )}

              <button
                onClick={() => { setShowReauth(false); setReauthPassword('') }}
                className="w-full py-3 mt-2 text-white/40 text-sm font-medium"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
