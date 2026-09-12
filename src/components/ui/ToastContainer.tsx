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
      className="fixed z-[200] flex flex-col gap-2"
      style={{ bottom: '96px', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)', maxWidth: '400px' }}
    >
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type]
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-elevated animate-slide-up ${STYLES[toast.type]}`}
          >
            <Icon size={18} className="flex-shrink-0" />
            <span className="flex-1 text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
