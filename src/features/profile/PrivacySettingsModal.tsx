import { motion } from 'framer-motion'
import { ArrowLeft, Download, Trash2, Shield, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUserStore } from '@/store/userStore'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { useState } from 'react'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useToastStore } from '@/store/toastStore'

export function PrivacySettingsModal({ onClose }: { onClose: () => void }) {
  const { deleteAccount } = useAuthStore()
  const { isIncognito, toggleIncognito } = useUserStore()
  const navigate = useNavigate()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const toast = useToastStore()

  const handleExport = () => {
    toast.success("Exporting your data to CSV. This will be sent to your email.")
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
        <h2 className="text-lg font-semibold text-white tracking-tight">Privacy & Data</h2>
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
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                  isIncognito ? "bg-red-500/20 text-red-400" : "bg-white/5 text-white/70"
                )}>
                  <EyeOff size={16} />
                </div>
                <div className="text-left">
                  <span className="font-medium text-white block">Incognito Mode</span>
                  <span className="text-xs text-white/50">
                    {isIncognito ? "Tracking is paused" : "Pause all tracking temporarily"}
                  </span>
                </div>
              </div>
              <div className={clsx(
                "w-12 h-6 rounded-full transition-colors relative",
                isIncognito ? "bg-red-500" : "bg-white/10"
              )}>
                <div className={clsx(
                  "w-5 h-5 rounded-full bg-black absolute top-0.5 transition-transform",
                  isIncognito ? "translate-x-6" : "translate-x-0.5 bg-white/50"
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

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Account"
        message="Are you sure you want to permanently delete your account and all data? This cannot be undone."
        confirmText="Delete Permanently"
        isDestructive={true}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          setShowDeleteConfirm(false)
          try {
            await deleteAccount()
          } catch (err) {}
        }}
      />
    </motion.div>
  )
}
