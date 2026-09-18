import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Trash2, X } from 'lucide-react'
import { useWorkoutSessionStore } from '@/store/workoutSessionStore'
import { useUserStore, toDisplayWeight } from '@/store/userStore'

interface EndWorkoutSheetProps {
  isOpen: boolean
  onClose: () => void
}

export function EndWorkoutSheet({ isOpen, onClose }: EndWorkoutSheetProps) {
  const { session, endSession, discardSession, getTotalVolume } = useWorkoutSessionStore()
  const { weightUnit } = useUserStore()

  if (!session) return null

  const completedSets = session.exercises.reduce(
    (total, ex) => total + ex.sets.filter(s => s.isComplete).length, 0
  )
  const totalVolume = getTotalVolume()

  async function handleFinish() {
    onClose()
    await endSession()
  }

  function handleDiscard() {
    discardSession()
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[90] bg-[#111] border-t border-white/10 rounded-t-3xl p-6 pb-10"
          >
            <div className="flex justify-center mb-6">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <h2 className="text-xl font-bold text-white text-center mb-1">Finish Workout?</h2>
            <p className="text-white/40 text-sm text-center mb-6">{session.label}</p>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white/5 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-white tabular-nums">{session.exercises.length}</p>
                <p className="text-xs text-white/40 mt-1">Exercises</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-white tabular-nums">{completedSets}</p>
                <p className="text-xs text-white/40 mt-1">Sets</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-white tabular-nums">
                  {toDisplayWeight(totalVolume, weightUnit).toLocaleString()}
                </p>
                <p className="text-xs text-white/40 mt-1">Volume ({weightUnit})</p>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-accent text-black font-bold text-base mb-3 active:scale-95 transition-all"
            >
              <Trophy size={18} /> Save Workout
            </button>

            <button
              onClick={handleDiscard}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/10 text-red-400 font-semibold text-sm active:scale-95 transition-all"
            >
              <Trash2 size={16} /> Discard Session
            </button>

            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white/30 font-medium text-sm mt-1"
            >
              <X size={14} /> Keep Training
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
