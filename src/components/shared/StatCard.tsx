import React from 'react';
import { clsx } from 'clsx';

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'hero' | 'standard' | 'interactive' | 'insight';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function StatCard({ 
  variant = 'standard', 
  padding = 'md', 
  className, 
  children, 
  ...props 
}: StatCardProps) {
  const isInteractive = variant === 'interactive' || props.onClick;

  return (
    <div 
      className={clsx(
        // Padding
        padding === 'none' && 'p-0',
        padding === 'sm' && 'p-3',
        padding === 'md' && 'p-5',
        padding === 'lg' && 'p-6',
        // Variants
        variant === 'hero' && 'glass-panel-intense relative overflow-hidden',
        (variant === 'standard' || variant === 'insight') && 'glass-panel',
        // Interactive state (tactile press)
        isInteractive && 'card-pressable cursor-pointer',
        className
      )}
      role={props.onClick ? 'button' : undefined}
      tabIndex={props.onClick ? 0 : undefined}
      {...props}
    >
      {/* Subtle Glow for Hero */}
      {variant === 'hero' && (
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-accent opacity-20 blur-[50px] rounded-full pointer-events-none" />
      )}
      
      {children}
    </div>
  );
}
