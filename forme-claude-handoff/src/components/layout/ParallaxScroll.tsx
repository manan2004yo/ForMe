import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, type ReactNode } from 'react'

export function ParallaxLayer({ 
  children, 
  offset = 50, 
  className = '' 
}: { 
  children: ReactNode, 
  offset?: number, 
  className?: string 
}) {
  const ref = useRef(null)
  
  // Track scroll position of this specific element
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })

  // Map scroll progress (0 to 1) to vertical pixel movement
  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset])

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }} className="w-full h-full">
        {children}
      </motion.div>
    </div>
  )
}
