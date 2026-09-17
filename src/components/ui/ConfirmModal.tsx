import { Portal } from '@/components/layout/Portal'
import { clsx } from 'clsx'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  isDestructive?: boolean
}

export function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  onConfirm, 
  onCancel, 
  isDestructive = false 
}: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <Portal>
      <div className="modal-backdrop" onClick={onCancel}>
        <div 
          className="modal-content max-w-sm w-full mx-4" 
          onClick={e => e.stopPropagation()}
        >
          <div className="p-5">
            <h2 className="font-heading font-bold text-lg text-text-primary mb-2">{title}</h2>
            <p className="text-sm text-text-secondary mb-6">{message}</p>
            
            <div className="flex gap-3 w-full">
              <button 
                onClick={onCancel}
                className="flex-1 btn btn-ghost py-3"
              >
                {cancelText}
              </button>
              <button 
                onClick={() => {
                  onConfirm()
                }}
                className={clsx(
                  "flex-1 py-3 rounded-xl font-semibold transition-all",
                  isDestructive 
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20" 
                    : "btn-accent"
                )}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}
