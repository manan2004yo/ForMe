import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export function SplashIntro() {
  const [isVisible, setIsVisible] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'brand' | 'glitch' | 'slice'>('idle')
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Only show the splash screen once per session
    const hasSeenIntro = sessionStorage.getItem('forme_intro_seen')
    if (!hasSeenIntro) {
      setIsVisible(true)
    }
  }, [])

  const handleFinish = () => {
    sessionStorage.setItem('forme_intro_seen', 'true')
    setIsVisible(false)
  }

  // Fallback
  useEffect(() => {
    if (isVisible) {
      const fallback = setTimeout(() => {
        handleFinish()
      }, 15000)
      return () => clearTimeout(fallback)
    }
  }, [isVisible])

  // Track video progress
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const { currentTime, duration } = videoRef.current
      if (!duration) return
      
      const timeLeft = duration - currentTime
      
      if (timeLeft <= 0.4 && phase !== 'slice') {
        setPhase('slice')
        // Automatically hide component shortly after slice starts
        setTimeout(handleFinish, 500)
      } else if (timeLeft <= 0.6 && timeLeft > 0.4 && phase !== 'glitch') {
        setPhase('glitch')
      } else if (timeLeft <= 2.8 && timeLeft > 0.6 && phase === 'idle') {
        setPhase('brand')
      }
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash-screen"
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
          // If the slice triggers, we want the whole container to stay while the internals animate.
          // The final exit just cleans up instantly since the slice covers the exit.
          exit={{ opacity: 0, pointerEvents: 'none', transition: { duration: 0.1 } }}
        >
          {/* Skip Button */}
          <button 
            onClick={handleFinish}
            aria-label="Close intro video"
            className="absolute top-safe right-4 z-50 p-3 bg-black/40 backdrop-blur-md rounded-full text-white/50 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{ marginTop: 'max(env(safe-area-inset-top), 16px)' }}
          >
            <X size={20} />
          </button>

          {/* The Katana Slice layers */}
          <AnimatePresence>
            {phase !== 'slice' && (
              <motion.div 
                className="absolute inset-0 w-full h-full"
                exit={{ 
                  clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 100%)', // Becomes top triangle
                  y: '-100vh', 
                  x: '50vw',
                  opacity: 0,
                  transition: { duration: 0.6, ease: [0.8, 0, 0.2, 1] } 
                }}
              >
                <video
                  ref={videoRef}
                  src="/intro.mp4"
                  autoPlay
                  muted
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                  className={`w-full h-full object-cover transition-all ${
                    phase === 'glitch' ? 'video-glitch' : ''
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
                
                {/* Branding Overlay */}
                {phase === 'brand' || phase === 'glitch' ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
                    <div className={`font-heading font-black text-white text-[6rem] md:text-[10rem] leading-none tracking-tighter ${phase === 'brand' ? 'glitch-text' : 'glitch-text-stable'}`}>
                      ForMe
                    </div>
                    {/* The tagline drops in */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: 0.3 }}
                      className="mt-2 text-lg md:text-2xl font-sans font-bold tracking-[0.25em] uppercase text-white drop-shadow-md"
                    >
                      UNLEASH YOUR ULTIMATE FORME
                    </motion.div>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>

          {/* The bottom slice clone - only visible when slicing */}
          <AnimatePresence>
            {phase === 'slice' && (
              <>
                <motion.div 
                  className="absolute inset-0 w-full h-full bg-black" // fallback background clone
                  initial={{ clipPath: 'polygon(0 100%, 100% 0, 100% 100%, 0 100%)' }}
                  animate={{ 
                    y: '100vh', 
                    x: '-50vw',
                    opacity: 0,
                    transition: { duration: 0.6, ease: [0.8, 0, 0.2, 1] } 
                  }}
                >
                    <video
                      src="/intro.mp4"
                      className="w-full h-full object-cover"
                    />
                </motion.div>
                <div className="slash-line" />
              </>
            )}
          </AnimatePresence>

        </motion.div>
      )}
    </AnimatePresence>
  )
}
