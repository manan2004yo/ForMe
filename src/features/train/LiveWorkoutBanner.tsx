import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Dumbbell, CheckCircle2, User, X } from 'lucide-react'

// Mock data for a friend's live workout
const FRIEND_WORKOUT = {
  name: 'Alex',
  workoutName: 'Pull Day (Heavy)',
  currentExercise: 'Lat Pulldown',
  completedSets: 2,
  totalSets: 4,
  duration: '45m'
}

export function LiveWorkoutBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const [pulse, setPulse] = useState(false)

  // Simulate real-time set completion ping
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true)
      setTimeout(() => setPulse(false), 2000)
    }, 15000) // Pulse every 15 seconds to simulate activity
    
    return () => clearInterval(interval)
  }, [])

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="mb-6 relative group"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/30 to-blue-500/30 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
        <div className="relative bg-[#121212] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <User size={20} className="text-emerald-400" />
              </div>
              <motion.div 
                animate={{ scale: pulse ? [1, 1.5, 1] : 1, opacity: pulse ? [1, 0.5, 1] : 1 }}
                transition={{ duration: 1.5 }}
                className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#121212]"
              />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold text-sm tracking-wide">LIVE NOW</span>
                <span className="text-white/30 text-xs">•</span>
                <span className="text-white/70 text-xs font-medium">{FRIEND_WORKOUT.duration}</span>
              </div>
              <h3 className="text-white font-semibold text-sm mt-0.5">{FRIEND_WORKOUT.name} is training</h3>
              <p className="text-white/50 text-xs mt-1 flex items-center gap-1.5">
                <Dumbbell size={12} /> {FRIEND_WORKOUT.workoutName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-white/50 mb-1">Current Exercise</div>
              <div className="text-sm font-medium text-white">{FRIEND_WORKOUT.currentExercise}</div>
              <div className="flex items-center justify-end gap-1 mt-1 text-xs text-emerald-400">
                <CheckCircle2 size={12} /> {FRIEND_WORKOUT.completedSets}/{FRIEND_WORKOUT.totalSets} sets
              </div>
            </div>
            <div className="h-10 w-px bg-white/10 hidden sm:block"></div>
            <button 
              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-colors"
            >
              Hype
            </button>
            <button 
              onClick={() => setIsVisible(false)}
              className="text-white/30 hover:text-white p-1 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
