import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
      transition={{ 
        duration: 0.35, 
        ease: [0.16, 1, 0.3, 1] // Apple-like spring/ease
      }}
      className="h-full"
    >
      {children}
    </motion.div>
  )
}
