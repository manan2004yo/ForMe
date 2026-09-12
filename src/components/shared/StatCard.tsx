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
        // Base
        'bg-bg-surface border border-border transition-all duration-300',
        // Padding
        padding === 'none' && 'p-0',
        padding === 'sm' && 'p-3',
        padding === 'md' && 'p-5',
        padding === 'lg' && 'p-6',
        // Variants
        variant === 'hero' && 'rounded-hero shadow-floating relative overflow-hidden',
        (variant === 'standard' || variant === 'insight') && 'rounded-xl shadow-card',
        // Interactive state (tactile press)
        isInteractive && 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 active:shadow-card',
        className
      )}
      role={props.onClick ? 'button' : undefined}
      tabIndex={props.onClick ? 0 : undefined}
      {...props}
    >
      {/* Subtle Glow for Hero */}
      {variant === 'hero' && (
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-accent opacity-5 blur-3xl rounded-full pointer-events-none" />
      )}
      
      {children}
    </div>
  );
}
