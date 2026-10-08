import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from './authStore'
import { setDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

export interface SyncOperation {
  queueId: string
  ownerUid: string
  operation: 'set' | 'delete'
  documentPath: string // e.g. 'users/123/foodLogs/456'
  payload?: any // data for 'set'
  queuedAt: number
  retryCount: number
  lastError?: string
}

interface SyncState {
  queue: SyncOperation[]
  isProcessing: boolean
  
  // Actions
  enqueue: (op: Omit<SyncOperation, 'queueId' | 'queuedAt' | 'retryCount'>) => void
  remove: (queueId: string) => void
  updateError: (queueId: string, error: string) => void
  processQueue: () => Promise<void>
  clearQueueForUser: (uid: string) => void
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      queue: [],
      isProcessing: false,

      enqueue: (op) => {
        set((state) => {
          // If there is already an operation for this exact documentPath, we overwrite it.
          // This ensures we only sync the latest state, and prevents infinite queue bloat.
          const existingIndex = state.queue.findIndex(q => q.documentPath === op.documentPath)
          
          const newOp: SyncOperation = {
            ...op,
            queueId: crypto.randomUUID(),
            queuedAt: Date.now(),
            retryCount: 0,
          }

          if (existingIndex >= 0) {
            const newQueue = [...state.queue]
            newQueue[existingIndex] = newOp
            return { queue: newQueue }
          }

          return { queue: [...state.queue, newOp] }
        })
        
        // Trigger processing attempt immediately if online
        if (navigator.onLine) {
          get().processQueue()
        }
      },

      remove: (queueId) => {
        set((state) => ({ queue: state.queue.filter(q => q.queueId !== queueId) }))
      },

      updateError: (queueId, error) => {
        set((state) => ({
          queue: state.queue.map(q => 
            q.queueId === queueId 
              ? { ...q, retryCount: q.retryCount + 1, lastError: error }
              : q
          )
        }))
      },

      clearQueueForUser: (uid) => {
        set((state) => ({
          queue: state.queue.filter(q => q.ownerUid !== uid)
        }))
      },

      processQueue: async () => {
        const { isProcessing, queue, remove, updateError } = get()
        if (isProcessing || queue.length === 0 || !navigator.onLine) return

        const activeUser = useAuthStore.getState().user
        if (!activeUser) return

        set({ isProcessing: true })

        try {
          // We iterate over a snapshot of the queue
          const queueSnapshot = [...get().queue]
          // Sort by queuedAt (oldest first)
          queueSnapshot.sort((a, b) => a.queuedAt - b.queuedAt)

          for (const op of queueSnapshot) {
            if (!navigator.onLine) break // Stop if we go offline during processing

            // Owner Isolation: strictly enforce the queue item belongs to the active user
            if (op.ownerUid !== activeUser.uid) {
              continue // Leave it in the queue for when that user logs in
            }

            try {
              if (op.operation === 'set') {
                await setDoc(doc(db, op.documentPath), op.payload)
              } else if (op.operation === 'delete') {
                await deleteDoc(doc(db, op.documentPath))
              }
              // Success! Remove from queue.
              remove(op.queueId)
            } catch (error: any) {
              console.warn('SyncQueue operation failed:', error)
              const errorMessage = error?.message || 'Unknown error'
              updateError(op.queueId, errorMessage)

              // If it's a permission/auth error, we should stop the queue loop for now
              if (errorMessage.toLowerCase().includes('permission') || errorMessage.toLowerCase().includes('unauthenticated')) {
                break
              }
            }
          }
        } finally {
          set({ isProcessing: false })
        }
      }
    }),
    {
      name: 'forme-sync-queue',
      partialize: (state) => ({ queue: state.queue }), // Only persist the queue, not isProcessing
    }
  )
)
