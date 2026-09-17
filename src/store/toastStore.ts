// ============================================================
// FORME — Toast Notification Store
// ============================================================

import { v4 as uuidv4 } from 'uuid'
import { create } from 'zustand'

export interface ToastItem {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration: number
}

interface ToastState {
  toasts: ToastItem[]
  addToast: (message: string, type?: ToastItem['type'], duration?: number) => void
  removeToast: (id: string) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (message, type = 'info', duration = 3000) => {
    const id = uuidv4()
    set(s => ({ toasts: [...s.toasts, { id, type, message, duration }] }))
    setTimeout(() => {
      get().removeToast(id)
    }, duration)
  },

  removeToast: (id) => {
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
  },

  success: (message) => get().addToast(message, 'success'),
  error: (message) => get().addToast(message, 'error', 4000),
  info: (message) => get().addToast(message, 'info'),
  warning: (message) => get().addToast(message, 'warning'),
}))
