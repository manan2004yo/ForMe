import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, Calendar } from 'lucide-react'
import { getWorkoutLogs } from '@/lib/firebase/dataService'
import { useAuthStore } from '@/store/authStore'
import { useUserStore, toDisplayWeight } from '@/store/userStore'
import { format, parseISO } from 'date-fns'
import clsx from 'clsx'
import type { LoggedSet } from '@/types'

interface SessionHistory {
  date: string
  sets: LoggedSet[]
  totalVolume: number
  topSet: LoggedSet | null
}

interface ExerciseHistorySheetProps {
  isOpen: boolean
  onClose: () => void
  exerciseId: string
  exerciseName: string
}

export function ExerciseHistorySheet({
  isOpen,
  onClose,
  exerciseId,
  exerciseName,
}: ExerciseHistorySheetProps) {
  const { user } = useAuthStore()
  const { weightUnit } = useUserStore()
  const [history, setHistory] = useState<SessionHistory[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !user?.uid || !exerciseId) return

    setIsLoading(true)
    getWorkoutLogs(user.uid, 90)
      .then(logs => {
        const sessions: SessionHistory[] = []

        for (const log of logs) {
          const match = log.exercises.find(e => e.exerciseId === exerciseId)
          if (!match || match.sets.length === 0) continue

          const totalVolume = match.sets.reduce(
            (sum, s) => sum + ((s.weight ?? 0) * s.reps), 0
          )

          const topSet = match.sets.reduce<LoggedSet | null>((best, s) => {
            if (!best) return s
            const sVol = (s.weight ?? 0) * s.reps
            const bVol = (best.weight ?? 0) * best.reps
            return sVol > bVol ? s : best
          }, null)

          sessions.push({ date: log.date, sets: match.sets, totalVolume, topSet })
        }

        setHistory(sessions)
      })
      .finally(() => setIsLoading(false))
  }, [isOpen, user?.uid, exerciseId])

  const bestVolumeSession = history.reduce<SessionHistory | null>((best, s) => {
    if (!best || s.totalVolume > best.totalVolume) return s
    return best
  }, null)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-[#111] border-t border-white/10 rounded-t-3xl"
            style={{ maxHeight: '85vh' }}
          >
            <div className="flex flex-col" style={{ maxHeight: '85vh' }}>
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="flex items-start justify-between px-5 py-3 shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-white">{exerciseName}</h2>
                  <p className="text-xs text-white/40 mt-0.5">
                    {history.length} session{history.length !== 1 ? 's' : ''} in last 90 days
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/5 text-white/50 hover:text-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* All-time best */}
              {bestVolumeSession && (
                <div className="px-5 pb-3 shrink-0">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-accent/10 border border-accent/20">
                    <TrendingUp size={16} className="text-accent shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-accent">Best Session</p>
                      <p className="text-xs text-white/60 mt-0.5">
                        {toDisplayWeight(bestVolumeSession.totalVolume, weightUnit).toLocaleString()}{weightUnit} total volume
                        {bestVolumeSession.topSet?.weight && (
                          <> · Top set: {toDisplayWeight(bestVolumeSession.topSet.weight, weightUnit)}{weightUnit} × {bestVolumeSession.topSet.reps}</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* History timeline */}
              <div className="flex-1 overflow-y-auto px-5 pb-8">
                {isLoading && (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                    ))}
                  </div>
                )}

                {!isLoading && history.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar size={32} className="text-white/10 mx-auto mb-3" />
                    <p className="text-white/30 text-sm">No history yet</p>
                    <p className="text-white/20 text-xs mt-1">
                      Complete a set to start tracking progress
                    </p>
                  </div>
                )}

                {!isLoading && history.length > 0 && (
                  <div className="space-y-3">
                    {history.map((session, index) => {
                      const isPersonalBest = session === bestVolumeSession
                      const prevSession = history[index + 1]
                      const volumeDelta = prevSession
                        ? session.totalVolume - prevSession.totalVolume
                        : null

                      return (
                        <div
                          key={session.date}
                          className={clsx(
                            'p-4 rounded-2xl border transition-all',
                            isPersonalBest
                              ? 'bg-accent/5 border-accent/20'
                              : 'bg-white/3 border-white/5'
                          )}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">
                                {format(parseISO(session.date), 'MMM d, yyyy')}
                              </span>
                              {isPersonalBest && (
                                <span className="text-[10px] font-bold text-accent bg-accent/15 px-2 py-0.5 rounded-full">
                                  BEST
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {volumeDelta !== null && (
                                <span className={clsx(
                                  'text-[11px] font-semibold',
                                  volumeDelta > 0 ? 'text-green-400' : 'text-red-400'
                                )}>
                                  {volumeDelta > 0 ? '↑' : '↓'} {Math.abs(toDisplayWeight(volumeDelta, weightUnit)).toLocaleString()}{weightUnit}
                                </span>
                              )}
                              <span className="text-xs text-white/40 tabular-nums">
                                {toDisplayWeight(session.totalVolume, weightUnit).toLocaleString()}{weightUnit}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            {session.sets.map((s, i) => (
                              <span
                                key={i}
                                className="text-xs text-white/50 bg-white/5 px-2 py-1 rounded-lg tabular-nums"
                              >
                                {s.weight
                                  ? `${toDisplayWeight(s.weight, weightUnit)}${weightUnit}`
                                  : '—'
                                } × {s.reps}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
