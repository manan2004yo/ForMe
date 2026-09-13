import { ReactNode, MouseEvent } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

interface DepthCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  /** Adds extra depth separation visually */
  raised?: boolean
}

const springConfig = { stiffness: 400, damping: 30 }

/**
 * A highly interactive 3D card.
 * Tracks pointer position to create a subtle tilt effect.
 */
export function DepthCard({ children, className = '', onClick, raised = false }: DepthCardProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Spring animations for smooth return to center
  const mouseXSpring = useSpring(x, springConfig)
  const mouseYSpring = useSpring(y, springConfig)

  // Map mouse position to rotation (-3 to 3 degrees max)
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["3deg", "-3deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-3deg", "3deg"])

  // Add a very subtle lighting sheen based on pointer
  const sheenOpacity = useTransform(
    useSpring(useTransform(x, [-0.5, 0.5], [0, 1]), springConfig),
    [0, 1],
    [0, 0.15]
  )
  const sheenX = useTransform(mouseXSpring, [-0.5, 0.5], ["-100%", "100%"])

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    // Calculate relative pointer position (-0.5 to 0.5)
    const mouseX = (e.clientX - rect.left) / rect.width - 0.5
    const mouseY = (e.clientY - rect.top) / rect.height - 0.5
    
    x.set(mouseX)
    y.set(mouseY)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const Tag = onClick ? motion.button : motion.div

  return (
    <div className={`perspective-1000 ${className}`}>
      <Tag
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        // If it's a button, handle hover scale. Otherwise just subtle lift.
        whileHover={{ scale: onClick ? 1.02 : 1.01, z: 10 }}
        whileTap={onClick ? { scale: 0.98, z: -10 } : undefined}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={`relative w-full rounded-2xl overflow-hidden transition-shadow duration-500 will-change-transform text-left ${
          raised 
            ? 'bg-bg-surface/50 border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-md'
            : 'bg-bg-surface/30 border border-white/5 shadow-soft backdrop-blur-sm hover:bg-bg-surface/40'
        }`}
      >
        {/* Subtle sheen layer */}
        <motion.div 
          className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white to-transparent"
          style={{ opacity: sheenOpacity, x: sheenX, z: 1 }} // slightly in front
        />
        
        {/* Content container, pushed forward on Z-axis to separate from background */}
        <div 
          className="relative w-full h-full p-4 transform-style-3d"
          style={{ transform: "translateZ(20px)" }}
        >
          {children}
        </div>
      </Tag>
    </div>
  )
}
