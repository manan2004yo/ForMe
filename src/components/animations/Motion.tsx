import { motion, type Transition, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'

// Apple-style cubic-bezier for buttery smooth reveals
const appleEase = [0.16, 1, 0.3, 1] as const
// Standard spring for interactive bouncy feels
const interactionSpring: Transition = { type: 'spring', stiffness: 400, damping: 25 }

// ─── Fade & Slide Up on Scroll ──────────────────────────────────
export function FadeUpReveal({ 
  children, 
  delay = 0, 
  className = '' 
}: { 
  children: ReactNode, 
  delay?: number,
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.8, ease: appleEase, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Staggered Group for Lists/Cards ─────────────────────────────
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // delay between each child
    }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: appleEase }
  }
}

export function StaggerGroup({ children, className = '' }: { children: ReactNode, className?: string }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-20px' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className = '' }: { children: ReactNode, className?: string }) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  )
}

// ─── Interactive Wrapper (for buttons/cards) ──────────────────────
export function InteractivePress({ children, className = '', scale = 0.96 }: { children: ReactNode, className?: string, scale?: number }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale }}
      transition={interactionSpring}
      className={className}
    >
      {children}
    </motion.div>
  )
}
