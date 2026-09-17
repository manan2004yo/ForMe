import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect } from 'react'

interface AnimatedCounterProps {
  value: number
  className?: string
  formatFn?: (val: number) => string
}

export function AnimatedCounter({ value, className = '', formatFn = (val) => Math.round(val).toString() }: AnimatedCounterProps) {
  const motionValue = useMotionValue(value)
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 150,
    mass: 1,
  })

  // Whenever the target value changes, update the motion value
  useEffect(() => {
    motionValue.set(value)
  }, [motionValue, value])

  const displayValue = useTransform(springValue, (current) => formatFn(current))

  return (
    <motion.span className={className}>
      {displayValue}
    </motion.span>
  )
}
