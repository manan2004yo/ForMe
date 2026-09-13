import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export function SplashIntro() {
  const [isVisible, setIsVisible] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Only show the splash screen once per session
    const hasSeenIntro = sessionStorage.getItem('forme_intro_seen')
    if (!hasSeenIntro) {
      setIsVisible(true)
      // We don't set the token until it finishes or is skipped
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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
        >
          {/* Skip Button */}
          <button 
            onClick={handleFinish}
            className="absolute top-safe right-4 z-10 p-3 bg-black/40 backdrop-blur-md rounded-full text-white/50 hover:text-white transition-colors"
            style={{ marginTop: 'max(env(safe-area-inset-top), 16px)' }}
          >
            <X size={20} />
          </button>

          <video
            ref={videoRef}
            src="/intro.mp4"
            autoPlay
            muted
            playsInline
            onEnded={handleFinish}
            className="w-full h-full object-cover opacity-90"
          >
            Your browser does not support the video tag.
          </video>
          
          {/* subtle gradient overlay so the skip button is always visible */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent pointer-events-none" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
