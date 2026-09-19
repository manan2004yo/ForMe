// ============================================================
// FORME — Set Count Picker
// ============================================================
// Shown immediately after exercise selection.
// Asks how many sets before creating the exercise card.
// ============================================================

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { ExerciseEntry } from '@/lib/data/exerciseDatabase'
import clsx from 'clsx'

interface SetCountPickerProps {
  exercise: ExerciseEntry | null
  onConfirm: (exercise: ExerciseEntry, setCount: number) => void
  onClose: () => void
}

const SET_OPTIONS = [1, 2, 3, 4, 5, 6]

export function SetCountPicker({ exercise, onConfirm, onClose }: SetCountPickerProps) {
  if (!exercise) return null

  return (
    <AnimatePresence>
      {exercise && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[75] bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[80] bg-[#111] border-t border-white/10 rounded-t-3xl px-5 pb-10 pt-4"
          >
            {/* Handle */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Exercise name */}
            <div className="mb-6">
              <p className="text-xs text-white/30 font-bold uppercase tracking-wider mb-1">
                Adding
              </p>
              <h2 className="text-xl font-bold text-white">{exercise.name}</h2>
              <p className="text-sm text-white/40 capitalize mt-0.5">
                {exercise.primaryMuscle.replace('_', ' ')} · {exercise.type}
              </p>
            </div>

            {/* Set count question */}
            <p className="text-sm font-semibold text-white/60 mb-4">
              How many sets?
            </p>

            {/* Set count options */}
            <div className="grid grid-cols-6 gap-2 mb-4">
              {SET_OPTIONS.map(count => (
                <button
                  key={count}
                  onClick={() => onConfirm(exercise, count)}
                  className="flex items-center justify-center h-14 rounded-2xl bg-white/5 hover:bg-accent/20 hover:text-accent border border-white/5 hover:border-accent/40 text-white font-bold text-lg transition-all active:scale-95"
                >
                  {count}
                </button>
              ))}
            </div>

            {/* Custom / more sets */}
            <button
              onClick={() => onConfirm(exercise, 4)}
              className="w-full py-3 rounded-2xl bg-white/5 text-white/40 text-sm font-semibold hover:text-white transition-all"
            >
              Start with 4, add more during session
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
