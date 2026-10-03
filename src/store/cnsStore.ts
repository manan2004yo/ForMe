import { db } from '@/lib/firebase/config'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CnsLog {
  date: string // YYYY-MM-DD
  sleepHours: number // 0-24
  fatigueLevel: number // 1-10
  sorenessLevel: number // 1-10
}

interface CnsState {
  logs: Record<string, CnsLog>
  addLog: (uid: string, date: string, log: CnsLog) => Promise<void>
  getTodayLog: () => CnsLog | null
  fetchLogs: (uid: string) => Promise<void>
}

function getTodayDateString() {
  return new Date().toISOString().split('T')[0]
}

export const useCnsStore = create<CnsState>()(
  persist(
    (set, get) => ({
      logs: {},
      addLog: async (uid: string, date: string, log: CnsLog) => {
        const cleanLog = Object.fromEntries(
          Object.entries(log).filter(([_key, value]) => value !== undefined)
        ) as CnsLog

        set((state) => ({
          logs: {
            ...state.logs,
            [date]: cleanLog
          }
        }))

        if (uid) {
          try {
            await setDoc(doc(db, 'users', uid, 'cns', date), cleanLog)
          } catch (error) {
            console.error('Failed to sync recovery signals to Firestore:', error)
          }
        }
      },
      getTodayLog: () => {
        const today = getTodayDateString()
        return get().logs[today] || null
      },
      fetchLogs: async (uid: string) => {
        if (uid === 'demo') return
        try {
          const today = getTodayDateString()
          const docRef = doc(db, 'users', uid, 'cns', today)
          const docSnap = await getDoc(docRef)
          if (docSnap.exists()) {
            const data = docSnap.data()
            if (
              typeof data.sleepHours === 'number' &&
              typeof data.fatigueLevel === 'number' &&
              typeof data.sorenessLevel === 'number'
            ) {
              set((state) => ({
                logs: {
                  ...state.logs,
                  [today]: {
                    date: today,
                    sleepHours: data.sleepHours,
                    fatigueLevel: data.fatigueLevel,
                    sorenessLevel: data.sorenessLevel,
                  }
                }
              }))
            }
          }
        } catch (error) {
          console.error('Error fetching CNS logs:', error)
        }
      }
    }),
    {
      name: 'forme-cns-storage',
    }
  )
)
