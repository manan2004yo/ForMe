// ============================================================
// FORME — Toast Component
// Global notification toasts
// ============================================================

import { useEffect } from 'react'
import { useToastStore } from '@/store/toastStore'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

const STYLES = {
  success: 'bg-success text-white',
  error: 'bg-error text-white',
  info: 'bg-text-primary text-white',
  warning: 'bg-warning text-white',
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div
      className="fixed z-[200] flex flex-col gap-3 pointer-events-none"
      style={{ bottom: '100px', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '340px' }}
    >
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type]
        
        // Premium Toast Styling
        const premiumStyles = {
          success: 'bg-bg-surface border-success/30 text-text-primary shadow-floating',
          error: 'bg-bg-surface border-error/30 text-text-primary shadow-floating',
          info: 'bg-bg-surface border-accent/30 text-text-primary shadow-floating',
          warning: 'bg-bg-surface border-warning/30 text-text-primary shadow-floating',
        }
        
        const iconStyles = {
          success: 'text-status-good',
          error: 'text-status-bad',
          info: 'text-accent',
          warning: 'text-status-warning',
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-pill border animate-slide-up mx-4 ${premiumStyles[toast.type]}`}
          >
            <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-bg-surface2 ${iconStyles[toast.type]}`}>
              <Icon size={18} strokeWidth={2.5} />
            </div>
            <span className="flex-1 text-sm font-semibold text-text-primary">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-text-tertiary hover:bg-bg-surface2 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
