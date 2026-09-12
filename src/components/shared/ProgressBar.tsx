import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';

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
    <div className={clsx('w-full bg-border rounded-pill overflow-hidden', heightClass, className)}>
      <div
        className={clsx(
          'h-full rounded-pill transition-all ease-out duration-700',
          over ? 'bg-status-warning' : colorClass
        )}
        style={{ width: isMounted ? `${pct}%` : '0%' }}
      />
    </div>
  );
}
