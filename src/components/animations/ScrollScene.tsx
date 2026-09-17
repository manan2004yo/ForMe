import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ReactNode, useRef } from 'react'

interface ScrollSceneProps {
  children: ReactNode
  className?: string
  /** The depth scale to start from when entering (e.g. 0.9) */
  initialScale?: number
  /** The depth scale to end at when fully visible (e.g. 1) */
  targetScale?: number
  /** How much to translate in Y as it appears (e.g. 40px) */
  yOffset?: number
}

/**
 * Wraps a dashboard section to act as a 3D scene.
 * As the user scrolls to it, it emerges from depth (scales up, translates Y, fades in).
 */
export function ScrollScene({
  children,
  className = '',
  initialScale = 0.94,
  targetScale = 1,
  yOffset = 40
}: ScrollSceneProps) {
  const ref = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 95%", "center center"] // Start animation when top enters 95% of viewport, finish when center hits center
  })

  // Smooth the scroll progress so it feels cinematic and elastic
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 20,
    restDelta: 0.001
  })

  // Map progress to 3D properties
  const scale = useTransform(smoothProgress, [0, 1], [initialScale, targetScale])
  const y = useTransform(smoothProgress, [0, 1], [yOffset, 0])
  const opacity = useTransform(smoothProgress, [0, 0.5, 1], [0, 0.8, 1])
  // Adding a tiny bit of rotation for that deep 3D feel as it enters
  const rotateX = useTransform(smoothProgress, [0, 1], [4, 0])

  return (
    <div ref={ref} className={`perspective-1000 ${className}`}>
      <motion.div
        style={{
          scale,
          y,
          opacity,
          rotateX,
          transformStyle: "preserve-3d"
        }}
        className="w-full will-change-transform"
      >
        {children}
      </motion.div>
    </div>
  )
}
