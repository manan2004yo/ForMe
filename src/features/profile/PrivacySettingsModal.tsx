import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { useUserStore } from '@/store/userStore'
import { useFoodLogStore } from '@/store/foodLogStore'
import { reauthenticateWithPassword } from '@/lib/firebase/authService'
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
  // Step 2: if auth/requires-recent-login → show password input to re-auth
  // Step 3: re-auth → retry delete
  const attemptDelete = async (withReauth = false) => {
    setIsDeleting(true)
    try {
      if (withReauth) {
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
                For your security, enter your password to confirm account deletion.
              </p>

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

              {reauthError && (
                <p className="text-sm text-red-400 mb-3">{reauthError}</p>
              )}

              <button
                onClick={() => attemptDelete(true)}
                disabled={isDeleting || !reauthPassword.trim()}
                className="w-full py-3.5 rounded-2xl bg-red-500 text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
              >
                {isDeleting ? 'Deleting...' : 'Confirm & Delete Account'}
              </button>

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
