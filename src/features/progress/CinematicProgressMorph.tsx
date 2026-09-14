import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, Play, Pause } from 'lucide-react'

// Dummy images for "Before" and "Current"
const IMAGES = [
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=800&h=1000',
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=800&h=1000'
]

export function CinematicProgressMorph({ onClose }: { onClose: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [index, setIndex] = useState(0)

  // Toggle between before (0) and current (1)
  const togglePlay = () => {
    setIsPlaying(!isPlaying)
    if (!isPlaying) {
      setIndex(index === 0 ? 1 : 0)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      <div className="absolute top-0 inset-x-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
        <button onClick={onClose} className="p-2 text-white/50 hover:text-white transition-colors bg-black/20 rounded-full backdrop-blur-md">
          <X size={24} />
        </button>
        <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
          <span className="text-white font-semibold text-sm tracking-widest uppercase">
            {index === 0 ? 'Day 1' : 'Current'}
          </span>
        </div>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-[#0a0a0a]">
        <AnimatePresence mode="wait">
          <motion.img
            key={index}
            src={IMAGES[index]}
            initial={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full object-cover max-w-lg absolute inset-0 m-auto"
            alt="Progress Morph"
          />
        </AnimatePresence>
      </div>

      <div className="absolute bottom-10 inset-x-0 z-10 flex flex-col items-center gap-6">
        <div className="flex items-center gap-8">
          <button 
            onClick={() => setIndex(0)}
            className={`text-sm font-bold tracking-widest uppercase transition-colors ${index === 0 ? 'text-white' : 'text-white/30'}`}
          >
            Before
          </button>
          
          <button 
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-95"
          >
            {isPlaying ? <Pause size={24} className="fill-black" /> : <Play size={24} className="fill-black ml-1" />}
          </button>

          <button 
            onClick={() => setIndex(1)}
            className={`text-sm font-bold tracking-widest uppercase transition-colors ${index === 1 ? 'text-accent' : 'text-white/30'}`}
          >
            After
          </button>
        </div>
        
        <p className="text-xs text-white/50 tracking-wide font-medium bg-black/40 backdrop-blur-md px-4 py-2 rounded-full">
          Tap Play to view cinematic morph
        </p>
      </div>
    </motion.div>
  )
}
