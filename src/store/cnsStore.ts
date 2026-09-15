import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { db } from '@/lib/firebase/config'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export type CnsStatus = 'Optimal' | 'Moderate Fatigue' | 'Fried'

export interface CnsLog {
  date: string // YYYY-MM-DD
  sleepHours: number // 0-24
  fatigueLevel: number // 1-10
  sorenessLevel: number // 1-10
  totalLoad: number
  status: CnsStatus
}

interface CnsState {
  logs: Record<string, CnsLog>
  addLog: (uid: string, date: string, log: Omit<CnsLog, 'totalLoad' | 'status'>) => Promise<void>
  getTodayLog: () => CnsLog | null
  getCurrentStatus: () => CnsStatus
  fetchLogs: (uid: string) => Promise<void>
}

// Calculate the load score
const calculateCnsStatus = (sleep: number, fatigue: number, soreness: number): { totalLoad: number, status: CnsStatus } => {
  let sleepScore = 0
  if (sleep < 6) sleepScore = 3
  else if (sleep <= 7.5) sleepScore = 1

  let fatigueScore = 0
  if (fatigue >= 8) fatigueScore = 3
  else if (fatigue >= 4) fatigueScore = 1

  let sorenessScore = 0
  if (soreness >= 8) sorenessScore = 3
  else if (soreness >= 4) sorenessScore = 1

  const totalLoad = sleepScore + fatigueScore + sorenessScore

  let status: CnsStatus = 'Optimal'
  if (totalLoad >= 6) status = 'Fried'
  else if (totalLoad >= 3) status = 'Moderate Fatigue'

  return { totalLoad, status }
}

const getTodayDateString = () => new Date().toISOString().split('T')[0]

export const useCnsStore = create<CnsState>()(
  persist(
    (set, get) => ({
      logs: {},
      addLog: async (uid: string, date: string, rawLog: Omit<CnsLog, 'totalLoad' | 'status'>) => {
        const { totalLoad, status } = calculateCnsStatus(rawLog.sleepHours, rawLog.fatigueLevel, rawLog.sorenessLevel)
        
        const completeLog: CnsLog = {
          ...rawLog,
          totalLoad,
          status
        }

        // Update local state immediately
        set((state) => ({
          logs: {
            ...state.logs,
            [date]: completeLog
          }
        }))

        // Sync to Firestore
        if (uid !== 'demo') {
          try {
            await setDoc(doc(db, 'users', uid, 'cns', date), completeLog)
          } catch (error) {
            console.error('Failed to sync CNS log to Firestore:', error)
          }
        }
      },
      getTodayLog: () => {
        const today = getTodayDateString()
        return get().logs[today] || null
      },
      getCurrentStatus: () => {
        const todayLog = get().getTodayLog()
        if (!todayLog) return 'Optimal' // Default if not logged
        return todayLog.status
      },
      fetchLogs: async (uid: string) => {
        if (uid === 'demo') return
        try {
          const today = getTodayDateString()
          const docRef = doc(db, 'users', uid, 'cns', today)
          const docSnap = await getDoc(docRef)
          if (docSnap.exists()) {
            set((state) => ({
              logs: {
                ...state.logs,
                [today]: docSnap.data() as CnsLog
              }
            }))
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
