import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export function SplashIntro() {
  const [isVisible, setIsVisible] = useState(false)
  const [showBranding, setShowBranding] = useState(false)
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

  // Force a fallback timeout just in case video fails to load
  useEffect(() => {
    if (isVisible) {
      const fallback = setTimeout(() => {
        handleFinish()
      }, 15000) // 15 seconds absolute max
      return () => clearTimeout(fallback)
    }
  }, [isVisible])

  // Track video progress to trigger branding animations towards the end
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const { currentTime, duration } = videoRef.current
      // If we are within 2.5 seconds of the end, show branding
      if (duration && (duration - currentTime <= 2.5)) {
        setShowBranding(true)
      }
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash-screen"
          initial={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          // Animate style transition: Scale up, blur out, and fade away
          exit={{ 
            opacity: 0, 
            scale: 1.1, 
            filter: 'blur(20px)',
            transition: { duration: 1.5, ease: [0.16, 1, 0.3, 1] } 
          }}
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
        >
          {/* Skip Button */}
          <button 
            onClick={handleFinish}
            className="absolute top-safe right-4 z-50 p-3 bg-black/40 backdrop-blur-md rounded-full text-white/50 hover:text-white transition-colors"
            style={{ marginTop: 'max(env(safe-area-inset-top), 16px)' }}
          >
            <X size={20} />
          </button>

          {/* Cinematic CSS Filters on Video */}
          <video
            ref={videoRef}
            src="/intro.mp4"
            autoPlay
            muted
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleFinish}
            className="w-full h-full object-cover saturate-150 contrast-125 brightness-90"
          >
            Your browser does not support the video tag.
          </video>
          
          {/* subtle gradient overlay so the skip button is always visible */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

          {/* Branding Overlay */}
          <AnimatePresence>
            {showBranding && (
              <motion.div 
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20"
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Glowing F */}
                <div className="font-heading font-black text-white text-[12rem] leading-none tracking-tighter drop-shadow-[0_0_40px_rgba(255,255,255,0.6)]">
                  F
                </div>
                {/* Tagline */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-2 text-xl md:text-2xl font-sans tracking-[0.2em] uppercase text-white/90 drop-shadow-md"
                >
                  Design Your Forme
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
        </motion.div>
      )}
    </AnimatePresence>
  )
}
