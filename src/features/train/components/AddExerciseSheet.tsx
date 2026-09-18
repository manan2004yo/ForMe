import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search } from 'lucide-react'
import { useTrainStore } from '@/store/trainStore'
import { useWorkoutSessionStore } from '@/store/workoutSessionStore'
import type { ExerciseEntry } from '@/lib/data/exerciseDatabase'

interface AddExerciseSheetProps {
  isOpen: boolean
  onClose: () => void
}

export function AddExerciseSheet({ isOpen, onClose }: AddExerciseSheetProps) {
  const { searchExercises } = useTrainStore()
  const { addExercise } = useWorkoutSessionStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ExerciseEntry[]>([])

  useEffect(() => {
    setResults(searchExercises(query))
  }, [query])

  function handleSelect(exercise: ExerciseEntry) {
    addExercise(exercise)
    setQuery('')
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-[#111] border-t border-white/10 rounded-t-3xl"
            style={{ maxHeight: '80vh' }}
          >
            <div className="flex flex-col h-full" style={{ maxHeight: '80vh' }}>
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3">
                <h2 className="text-lg font-bold text-white">Add Exercise</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/5 text-white/50 hover:text-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search */}
              <div className="px-5 pb-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search exercises or muscle groups..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent transition-all"
                  />
                </div>
              </div>

              {/* Results */}
              <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-1">
                {results.slice(0, 40).map(exercise => (
                  <button
                    key={exercise.id}
                    onClick={() => handleSelect(exercise)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 transition-all text-left"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{exercise.name}</p>
                      <p className="text-xs text-white/40 capitalize mt-0.5">
                        {exercise.primaryMuscle.replace('_', ' ')} · {exercise.type}
                      </p>
                    </div>
                    <span className="text-xs text-white/20 font-medium ml-2 shrink-0 capitalize">
                      {exercise.equipment[0]?.replace('_', ' ') ?? 'bodyweight'}
                    </span>
                  </button>
                ))}

                {results.length === 0 && query.length > 0 && (
                  <div className="text-center py-12">
                    <p className="text-white/30 text-sm">No exercises found for "{query}"</p>
                    <p className="text-white/20 text-xs mt-1">Try a muscle group or equipment type</p>
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
