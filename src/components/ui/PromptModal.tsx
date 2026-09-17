import { Portal } from '@/components/layout/Portal'
import { useEffect, useRef, useState } from 'react'

interface PromptModalProps {
  isOpen: boolean
  title: string
  message: string
  placeholder?: string
  confirmText?: string
  cancelText?: string
  onSubmit: (value: string) => void
  onCancel: () => void
}

export function PromptModal({ 
  isOpen, 
  title, 
  message, 
  placeholder = '',
  confirmText = 'Submit', 
  cancelText = 'Cancel', 
  onSubmit, 
  onCancel 
}: PromptModalProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setValue('')
      // Small timeout to allow the modal to mount before focusing
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) {
      onSubmit(value.trim())
    }
  }

  return (
    <Portal>
      <div className="modal-backdrop" onClick={onCancel}>
        <div 
          className="modal-content max-w-sm w-full mx-4" 
          onClick={e => e.stopPropagation()}
        >
          <div className="p-5">
            <h2 className="font-heading font-bold text-lg text-text-primary mb-2">{title}</h2>
            <p className="text-sm text-text-secondary mb-4">{message}</p>
            
            <form onSubmit={handleSubmit}>
              <input 
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className="input-field w-full py-3 mb-6"
              />
              
              <div className="flex gap-3 w-full">
                <button 
                  type="button"
                  onClick={onCancel}
                  className="flex-1 btn btn-ghost py-3"
                >
                  {cancelText}
                </button>
                <button 
                  type="submit"
                  disabled={!value.trim()}
                  className="flex-1 btn btn-accent py-3"
                >
                  {confirmText}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Portal>
  )
}
