import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSyncStore } from '../src/store/syncStore'
import { useAuthStore } from '../src/store/authStore'

vi.mock('../src/lib/firebase/config', () => ({
  db: {}
}))

vi.mock('firebase/firestore', () => ({
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
}))

describe('SyncQueue', () => {
  beforeEach(() => {
    useSyncStore.setState({ queue: [], isProcessing: false })
    useAuthStore.setState({ user: { uid: 'user1' } as any, isInitialized: true })
  })

  it('enqueues an operation and gives it a queueId', () => {
    useSyncStore.getState().enqueue({
      ownerUid: 'user1',
      operation: 'set',
      documentPath: 'test/path',
      payload: { a: 1 }
    })
    const q = useSyncStore.getState().queue
    expect(q).toHaveLength(1)
    expect(q[0].queueId).toBeDefined()
    expect(q[0].retryCount).toBe(0)
  })

  it('overwrites a pending operation for the exact same document path', () => {
    useSyncStore.getState().enqueue({
      ownerUid: 'user1',
      operation: 'set',
      documentPath: 'test/path',
      payload: { a: 1 }
    })
    
    useSyncStore.getState().enqueue({
      ownerUid: 'user1',
      operation: 'set',
      documentPath: 'test/path',
      payload: { b: 2 } // updated intent
    })

    const q = useSyncStore.getState().queue
    expect(q).toHaveLength(1)
    expect(q[0].payload.b).toBe(2)
  })
})
