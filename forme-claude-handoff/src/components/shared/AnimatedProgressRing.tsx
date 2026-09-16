import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { AnimatedNumber } from './AnimatedNumber';

interface AnimatedProgressRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  unit?: string;
  className?: string;
  colorClass?: string;
  glow?: boolean;
}

export function AnimatedProgressRing({
  value,
  max,
  size = 200,
  strokeWidth = 14,
  label = 'Calories',
  unit = 'kcal',
  className,
  colorClass = 'text-accent',
  glow = true
}: AnimatedProgressRingProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const safeMax = Math.max(max, 1);
  const rawPct = value / safeMax;
  const clampedPct = Math.min(rawPct, 1);
  const overPct = Math.max(0, rawPct - 1);
  
  const radius = (size / 2) - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  
  // Animation delay/overshoot effect handled via CSS transition
  const dashOffset = isMounted ? circumference * (1 - clampedPct) : circumference;
  const overDashOffset = isMounted ? circumference * (1 - overPct) : circumference;

  return (
    <div className={clsx('relative flex items-center justify-center', className)} style={{ width: size, height: size }}>
      
      {/* Ambient Glow */}
      {glow && (
        <div 
          className={clsx('absolute inset-0 rounded-full blur-3xl opacity-20 dark:opacity-10 transition-opacity duration-1000', colorClass, !isMounted && 'opacity-0')} 
          style={{ transform: 'scale(0.8)' }}
        />
      )}

      {/* SVG Ring */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 drop-shadow-sm">
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          className="stroke-border"
          strokeWidth={strokeWidth}
        />
        
        {/* Main Fill */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          className={clsx('transition-all ease-[cubic-bezier(0.175,0.885,0.32,1.275)] duration-1000', colorClass)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          stroke="currentColor"
        />

        {/* Overflow Fill (if exceeding 100%) */}
        {rawPct > 1 && (
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            className="transition-all ease-[cubic-bezier(0.175,0.885,0.32,1.275)] duration-1000 delay-500 text-status-warning"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={overDashOffset}
            stroke="currentColor"
          />
        )}
      </svg>

      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="flex items-baseline gap-1">
          <AnimatedNumber value={value} className="text-hero text-text-primary" />
        </div>
        <div className="flex flex-col items-center mt-1">
          <span className="text-label text-text-secondary">{label}</span>
          <span className="text-caption">/ {max} {unit}</span>
        </div>
      </div>
    </div>
  );
}
