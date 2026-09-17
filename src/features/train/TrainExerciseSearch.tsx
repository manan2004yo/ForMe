// ============================================================
// FORME - Train Exercise Search
// ============================================================

import { EXERCISES } from '@/lib/engines/workoutEngine'
import { useTrainStore } from '@/store/trainStore'
import { Plus, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

const CATEGORIES = ['All', 'chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'core', 'full_body']

interface TrainExerciseSearchProps {
  dayIndex: number
  onClose: () => void
}

export function TrainExerciseSearch({ dayIndex, onClose }: TrainExerciseSearchProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const inputRef = useRef<HTMLInputElement>(null)
  const { addExerciseToDay } = useTrainStore()
  const [quickAdd, setQuickAdd] = useState<{exerciseId: string, sets: number, reps: number} | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const filteredExercises = useMemo(() => {
    return Object.entries(EXERCISES).filter(([, ex]) => {
      const matchesSearch = ex.name.toLowerCase().includes(query.toLowerCase())
      const matchesCategory = category === 'All' || ex.muscleGroup === category
      return matchesSearch && matchesCategory
    })
  }, [query, category])

  const handleAdd = (exerciseId: string) => {
    const ex = EXERCISES[exerciseId]
    setQuickAdd({
      exerciseId,
      sets: 3,
      reps: ex.repRange[0]
    })
  }

  const confirmAdd = () => {
    if (!quickAdd) return
    const ex = EXERCISES[quickAdd.exerciseId]
    
    addExerciseToDay(dayIndex, {
      exerciseId: quickAdd.exerciseId,
      exerciseName: ex.name,
      muscleGroup: ex.muscleGroup,
      sets: quickAdd.sets,
      repRange: [quickAdd.reps, quickAdd.reps + 2],
      restSeconds: ex.restSec,
      
      notes: '',
      difficulty: ex.difficulty as any
    })

    setQuickAdd(null)
    onClose()
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col pt-safe">
      <header className="p-4 border-b border-white/10 flex gap-3 items-center sticky top-0 bg-[#0a0a0a] z-10">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search exercises..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white/5 border-none rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-accent"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>
        <button onClick={onClose} className="p-3 text-white/70 hover:text-white">
          <X size={24} />
        </button>
      </header>

      <div className="overflow-x-auto hide-scrollbar border-b border-white/5">
        <div className="flex gap-2 p-4 w-max">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={"px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors capitalize " + (category === cat ? 'bg-white text-black' : 'bg-white/5 text-white/70 hover:bg-white/10')}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
        {filteredExercises.map(([id, ex]) => (
          <div key={id} className="bg-[#121212] border border-white/5 p-4 rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">{ex.name}</h3>
              <p className="text-xs text-white/50 capitalize">{ex.muscleGroup.replace('_', ' ')} • {ex.equipment.join(', ')}</p>
            </div>
            
            {quickAdd?.exerciseId === id ? (
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-white/40">Sets</span>
                  <input type="number" value={quickAdd.sets} onChange={e => setQuickAdd({...quickAdd, sets: Number(e.target.value) || 1})} className="w-12 bg-white/10 rounded px-1 py-1 text-white text-xs text-center outline-none" min="1" />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-white/40">Reps</span>
                  <input type="number" value={quickAdd.reps} onChange={e => setQuickAdd({...quickAdd, reps: Number(e.target.value) || 1})} className="w-12 bg-white/10 rounded px-1 py-1 text-white text-xs text-center outline-none" min="1" />
                </div>

                
                <button onClick={confirmAdd} className="bg-accent text-white p-2 rounded-lg hover:bg-accent/90 ml-1 mt-3">
                  <Plus size={16} />
                </button>
              </div>
            ) : (
              <button onClick={() => handleAdd(id)} className="p-2 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg">
                <Plus size={18} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
