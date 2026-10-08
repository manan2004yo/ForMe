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

import { getTodayDateString } from '@/lib/dateUtils'

export const useCnsStore = create<CnsState>()(
  persist(
    (set, get) => ({
      logs: {},
      addLog: async (uid: string, date: string, log: CnsLog) => {
        const cleanLog = Object.fromEntries(
          Object.entries(log).filter(([_key, value]) => value !== undefined)
        ) as CnsLog

        const v2Key = `v2_${date}`

        set((state) => ({
          logs: {
            ...state.logs,
            [v2Key]: cleanLog
          }
        }))

        if (uid) {
          try {
            await setDoc(doc(db, 'users', uid, 'cns_v2', date), cleanLog)
          } catch (error) {
            console.error('Failed to sync recovery signals to Firestore:', error)
          }
        }
      },
      getTodayLog: () => {
        const today = getTodayDateString()
        return get().logs[`v2_${today}`] || get().logs[today] || null
      },
      fetchLogs: async (uid: string) => {
        if (uid === 'demo') return
        try {
          const today = getTodayDateString()
          let v2Data = null
          let legacyData = null

          const docRefV2 = doc(db, 'users', uid, 'cns_v2', today)
          const docSnapV2 = await getDoc(docRefV2)
          if (docSnapV2.exists()) {
            v2Data = docSnapV2.data()
          }
          
          const docRef = doc(db, 'users', uid, 'cns', today)
          const docSnap = await getDoc(docRef)
          if (docSnap.exists()) {
            legacyData = docSnap.data()
          }
          
          set((state) => {
            const newLogs = { ...state.logs }
            
            if (legacyData && typeof legacyData.sleepHours === 'number') {
              newLogs[today] = {
                date: today,
                sleepHours: legacyData.sleepHours,
                fatigueLevel: legacyData.fatigueLevel,
                sorenessLevel: legacyData.sorenessLevel,
              }
            }
            
            if (v2Data && typeof v2Data.sleepHours === 'number') {
              newLogs[`v2_${today}`] = {
                date: today,
                sleepHours: v2Data.sleepHours,
                fatigueLevel: v2Data.fatigueLevel,
                sorenessLevel: v2Data.sorenessLevel,
              }
            }
            
            return { logs: newLogs }
          })
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
