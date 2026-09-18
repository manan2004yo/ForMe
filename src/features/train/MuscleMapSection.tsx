import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMuscleRecoveryStore } from '@/store/muscleRecoveryStore'
import { useAuthStore } from '@/store/authStore'
import { MuscleMapSVG } from './components/MuscleMapSVG'
import { MuscleDetailModal } from './components/MuscleDetailModal'
import { MuscleRecoveryTimeline } from './components/MuscleRecoveryTimeline'
import type { MuscleGroup } from '@/types'
import clsx from 'clsx'

export function MuscleMapSection() {
  const { user } = useAuthStore()
  const { syncFromLogs, isLoading } = useMuscleRecoveryStore()
  const [view, setView] = useState<'front' | 'back'>('front')
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null)

  useEffect(() => {
    if (user?.uid) {
      syncFromLogs(user.uid)
    }
  }, [user?.uid])

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Recovery Map</h2>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5">
          {(['front', 'back'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={clsx(
                'px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize',
                view === v
                  ? 'bg-white text-black'
                  : 'text-white/40 hover:text-white'
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4">
        {[
          { label: 'Fatigued', color: '#EF4444' },
          { label: 'Recovering', color: '#F97316' },
          { label: 'Fresh', color: '#10B981' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }}
            />
            <span className="text-[11px] text-white/40 font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* SVG map */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {isLoading ? (
            <div className="h-[320px] rounded-2xl bg-white/5 animate-pulse max-w-[220px] mx-auto" />
          ) : (
            <MuscleMapSVG view={view} onMuscleClick={setSelectedMuscle} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Recovery timeline */}
      <div>
        <h3 className="text-xs font-bold text-white/30 uppercase tracking-wider mb-3">
          Muscle Recovery Status
        </h3>
        <MuscleRecoveryTimeline onMuscleClick={setSelectedMuscle} />
      </div>

      {/* Muscle detail modal */}
      <MuscleDetailModal
        muscle={selectedMuscle}
        onClose={() => setSelectedMuscle(null)}
      />
    </div>
  )
}
