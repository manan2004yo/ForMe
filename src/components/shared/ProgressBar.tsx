import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx'
import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
  max?: number;
  colorClass?: string;
  heightClass?: string;
  className?: string;
}

export function ProgressBar({ 
  value, 
  max = 100, 
  colorClass = 'bg-accent', 
  heightClass = 'h-2',
  className 
}: ProgressBarProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const safeMax = Math.max(max, 1);
  const rawPct = value / safeMax;
  const pct = Math.min(100, Math.max(0, rawPct * 100));
  const over = rawPct > 1;

  return (
    <div className={clsx('w-full bg-bg-surface2 rounded-full overflow-hidden relative', heightClass, className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", stiffness: 60, damping: 15 }}
        className={clsx(
          'h-full rounded-full transition-colors duration-300',
          over ? 'bg-status-warning' : colorClass
        )}
      />
    </div>
  );
}
