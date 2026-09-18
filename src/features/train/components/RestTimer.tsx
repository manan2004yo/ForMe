import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SkipForward, Plus, Minus } from 'lucide-react'
import { useWorkoutSessionStore } from '@/store/workoutSessionStore'

export function RestTimer() {
  const { restTimer, tickRestTimer, skipRestTimer, setExerciseRestDuration } = useWorkoutSessionStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!restTimer?.isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      tickRestTimer()
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [restTimer?.isActive, tickRestTimer])

  function handleAdjust(delta: number) {
    if (!restTimer) return
    const instanceId = restTimer.exerciseInstanceId
    const newTotal = Math.max(10, restTimer.totalSeconds + delta)
    const newRemaining = Math.max(0, restTimer.remainingSeconds + delta)
    if (instanceId) setExerciseRestDuration(instanceId, newTotal)
    useWorkoutSessionStore.setState({
      restTimer: {
        ...restTimer,
        totalSeconds: newTotal,
        remainingSeconds: newRemaining,
      }
    })
  }

  const progress = restTimer ? restTimer.remainingSeconds / restTimer.totalSeconds : 0

  const minutes = restTimer
    ? Math.floor(restTimer.remainingSeconds / 60).toString().padStart(2, '0')
    : '00'
  const seconds = restTimer
    ? (restTimer.remainingSeconds % 60).toString().padStart(2, '0')
    : '00'

  const timerColor =
    progress > 0.5 ? '#22c55e' : progress > 0.25 ? '#f59e0b' : '#ef4444'

  const circumference = 2 * Math.PI * 22

  return (
    <AnimatePresence>
      {restTimer?.isActive && (
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="absolute bottom-24 left-4 right-4 z-10"
        >
          <div
            className="rounded-2xl px-5 py-4 flex items-center gap-4 border border-white/10"
            style={{ background: 'rgba(20,20,20,0.95)', backdropFilter: 'blur(20px)' }}
          >
            {/* Progress arc */}
            <div className="relative shrink-0" style={{ width: 52, height: 52 }}>
              <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                <circle
                  cx="26" cy="26" r="22"
                  fill="none"
                  stroke={timerColor}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                  style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-bold tabular-nums" style={{ color: timerColor }}>
                  {minutes}:{seconds}
                </span>
              </div>
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Rest</p>
              <p className="text-xs text-white/40">Next set in {minutes}:{seconds}</p>
            </div>

            {/* Adjust buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleAdjust(-15)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all active:scale-95"
                aria-label="Minus 15 seconds"
              >
                <Minus size={14} />
              </button>
              <button
                onClick={() => handleAdjust(15)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all active:scale-95"
                aria-label="Plus 15 seconds"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Skip */}
            <button
              onClick={skipRestTimer}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all active:scale-95"
            >
              <SkipForward size={14} /> Skip
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
