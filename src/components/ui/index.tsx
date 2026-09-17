import { clsx } from 'clsx'
import React from 'react'

// ─── Button ───────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading,
  leftIcon,
  rightIcon,
  fullWidth,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base = clsx(
    'btn inline-flex items-center justify-center gap-2 rounded-xl font-medium font-sans transition-all duration-200 cursor-pointer active:scale-[0.97]',
    variant === 'primary' && 'bg-text-primary text-text-inverse hover:opacity-90',
    variant === 'accent' && 'bg-accent text-white shadow-accent hover:bg-accent-dark',
    variant === 'secondary' && 'bg-bg-surface2 text-text-primary border border-border hover:bg-bg-surface3',
    variant === 'ghost' && 'bg-transparent text-text-secondary hover:bg-bg-surface2 hover:text-text-primary',
    size === 'sm' && 'px-3 py-1.5 text-sm',
    size === 'md' && 'px-5 py-2.5 text-sm',
    size === 'lg' && 'px-6 py-3 text-base',
    fullWidth && 'w-full',
    className,
  )

  return (
    <button className={base} disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  )
}

// ─── Card / StatCard ────────────────────────────────────────────

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'hero' | 'standard' | 'interactive' | 'insight';
  children: React.ReactNode
  className?: string
  hover?: boolean
  selected?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ 
  variant = 'standard',
  children, 
  className, 
  hover, 
  selected, 
  onClick, 
  padding = 'md',
  ...props 
}: CardProps) {
  const isInteractive = variant === 'interactive' || hover || onClick;
  
  const base = clsx(
    // Base surface & transition
    'bg-bg-surface border border-border transition-all duration-300 relative overflow-hidden',
    // Padding
    padding === 'none' && 'p-0',
    padding === 'sm' && 'p-3',
    padding === 'md' && 'p-5',
    padding === 'lg' && 'p-6',
    // Variants
    variant === 'hero' && 'rounded-hero shadow-floating',
    (variant === 'standard' || variant === 'insight') && 'rounded-xl shadow-card',
    // Selected state
    selected && 'border-accent bg-accent-light shadow-accent',
    // Interactive state (tactile press)
    isInteractive && 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 active:shadow-card',
    className
  )

  return (
    <div className={base} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined} {...props}>
      {variant === 'hero' && (
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-accent opacity-5 blur-3xl rounded-full pointer-events-none" />
      )}
      {children}
    </div>
  )
}

// ─── Input ────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  leftAddon?: React.ReactNode
  rightAddon?: React.ReactNode
}

export function Input({ label, hint, error, leftAddon, rightAddon, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && <label className="input-label">{label}</label>}
      <div className="relative">
        {leftAddon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
            {leftAddon}
          </div>
        )}
        <input
          className={clsx(
            'input',
            leftAddon && 'pl-10',
            rightAddon && 'pr-10',
            error && 'border-error focus:border-error focus:ring-error/10',
            className,
          )}
          {...props}
        />
        {rightAddon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary">
            {rightAddon}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-text-tertiary">{hint}</p>}
    </div>
  )
}

// ─── Textarea ─────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export function Textarea({ label, hint, error, className, ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && <label className="input-label">{label}</label>}
      <textarea
        className={clsx(
          'input resize-none',
          error && 'border-error',
          className,
        )}
        rows={3}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-text-tertiary">{hint}</p>}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────

interface BadgeProps {
  children: React.ReactNode
  variant?: 'accent' | 'success' | 'warning' | 'error' | 'neutral'
  size?: 'sm' | 'md'
}

export function Badge({ children, variant = 'neutral', size = 'md' }: BadgeProps) {
  return (
    <span className={clsx(
      'badge',
      size === 'sm' && 'text-[10px] px-2 py-0.5',
      variant === 'accent' && 'badge-accent',
      variant === 'success' && 'badge-success',
      variant === 'warning' && 'badge-warning',
      variant === 'error' && 'bg-error/10 text-error',
      variant === 'neutral' && 'bg-bg-surface2 text-text-secondary',
    )}>
      {children}
    </span>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────

interface ProgressBarProps {
  value: number // 0-100
  max?: number
  color?: string
  height?: 'xs' | 'sm' | 'md'
  animated?: boolean
  className?: string
}

export function ProgressBar({ value, max = 100, color, height = 'sm', animated, className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const over = value > max

  return (
    <div className={clsx(
      'progress-bar',
      height === 'xs' && 'h-1',
      height === 'sm' && 'h-2',
      height === 'md' && 'h-3',
      className,
    )}>
      <div
        className={clsx(
          'progress-fill',
          animated && 'transition-all duration-700',
          over ? 'bg-warning' : (color || 'bg-accent'),
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ─── Macro Ring (SVG donut) ───────────────────────────────────

interface MacroRingProps {
  calories: number
  target: number
  size?: number
}

export function MacroRing({ calories, target, size = 120 }: MacroRingProps) {
  const pct = Math.min(1, calories / Math.max(target, 1))
  const r = (size / 2) - 10
  const circ = 2 * Math.PI * r
  const dash = circ * pct
  const over = calories > target

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="#E8E7E3" strokeWidth="8"
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={over ? '#B45309' : '#C17B3F'}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ / 4}
        style={{ transition: 'stroke-dasharray 0.7s ease' }}
      />
      <text x="50%" y="48%" dominantBaseline="middle" textAnchor="middle"
        className="font-heading font-bold" fontSize="18" fill="#1A1A18">
        {calories}
      </text>
      <text x="50%" y="64%" dominantBaseline="middle" textAnchor="middle"
        fontSize="10" fill="#9B9B92">
        kcal
      </text>
    </svg>
  )
}

// ─── Segmented Control ────────────────────────────────────────

interface SegmentedControlProps<T extends string> {
  options: { label: string; value: T }[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function SegmentedControl<T extends string>({ options, value, onChange, className }: SegmentedControlProps<T>) {
  return (
    <div className={clsx('flex p-1 bg-bg-surface2 rounded-xl border border-border', className)}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={clsx(
            'flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all duration-150',
            value === opt.value
              ? 'bg-bg-surface text-text-primary shadow-soft'
              : 'text-text-tertiary hover:text-text-secondary',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
}

export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      {(label || description) && (
        <div>
          {label && <p className="text-sm font-medium text-text-primary">{label}</p>}
          {description && <p className="text-xs text-text-tertiary">{description}</p>}
        </div>
      )}
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0',
          checked ? 'bg-accent' : 'bg-border-strong'
        )}
      >
        <span className={clsx(
          'absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200',
          checked && 'translate-x-6'
        )} />
      </button>
    </div>
  )
}

// ─── Skeleton Loader ──────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return (
    <div 
      className={clsx(
        'bg-border-strong/30 rounded-md animate-pulse', 
        className
      )} 
    />
  )
}

// ─── Toast / Alert ────────────────────────────────────────────

interface AlertProps {
  type?: 'success' | 'error' | 'info' | 'warning'
  children: React.ReactNode
  className?: string
}

export { AnimatedCounter } from './AnimatedCounter'
export { ToastContainer } from './ToastContainer'

export function Alert({ type = 'info', children, className }: AlertProps) {
  const colors = {
    success: 'bg-success/10 border-success/20 text-success',
    error: 'bg-error/10 border-error/20 text-error',
    info: 'bg-accent-light border-accent/20 text-accent-dark',
    warning: 'bg-warning/10 border-warning/20 text-warning',
  }

  return (
    <div className={clsx(
      'rounded-xl border px-4 py-3 text-sm font-medium',
      colors[type],
      className,
    )}>
      {children}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6 animate-fade-in w-full max-w-sm mx-auto">
      {icon && (
        <div className="w-16 h-16 bg-bg-surface2 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm border border-border">
          {icon}
        </div>
      )}
      <h3 className="text-section text-text-primary mb-2">{title}</h3>
      {description && <p className="text-body text-text-secondary mb-8">{description}</p>}
      {action && <div className="w-full">{action}</div>}
    </div>
  )
}

// ─── Macro Display ────────────────────────────────────────────

interface MacroDisplayProps {
  calories: number; caloriesTarget?: number
  protein: number; proteinTarget?: number
  carbs: number; carbsTarget?: number
  fat: number; fatTarget?: number
  fiber?: number; fiberTarget?: number
  compact?: boolean
}

export function MacroDisplay({ calories, caloriesTarget, protein, proteinTarget, carbs, carbsTarget, fat, fatTarget, fiber, fiberTarget, compact }: MacroDisplayProps) {
  if (compact) {
    return (
      <div className="flex gap-3 flex-wrap">
        <MacroPill label="Cal" value={calories} target={caloriesTarget} color="accent" unit="kcal" />
        <MacroPill label="Protein" value={protein} target={proteinTarget} color="protein" unit="g" />
        <MacroPill label="Carbs" value={carbs} target={carbsTarget} color="carbs" unit="g" />
        <MacroPill label="Fat" value={fat} target={fatTarget} color="fat" unit="g" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <MacroCard label="Calories" value={calories} target={caloriesTarget} color="#C17B3F" unit="kcal" />
      <MacroCard label="Protein" value={protein} target={proteinTarget} color="#7C6AF4" unit="g" />
      <MacroCard label="Carbs" value={carbs} target={carbsTarget} color="#F4A26A" unit="g" />
      <MacroCard label="Fat" value={fat} target={fatTarget} color="#6ABFF4" unit="g" />
      {fiber !== undefined && (
        <MacroCard label="Fiber" value={fiber} target={fiberTarget} color="#6AF4A2" unit="g" />
      )}
    </div>
  )
}

function MacroCard({ label, value, target, color, unit }: {
  label: string; value: number; target?: number; color: string; unit: string
}) {
  const pct = target ? Math.min(100, (value / target) * 100) : 0
  return (
    <div className="card p-4">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-xs text-text-tertiary">{label}</span>
        {target && <span className="text-xs text-text-tertiary">{target}{unit}</span>}
      </div>
      <div className="text-xl font-bold font-heading text-text-primary">{value}<span className="text-xs font-normal text-text-tertiary ml-1">{unit}</span></div>
      {target && (
        <div className="mt-2 h-1.5 bg-bg-surface2 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
      )}
    </div>
  )
}

function MacroPill({ label, value, target, color, unit }: {
  label: string; value: number; target?: number; color: string; unit: string
}) {
  const colorClasses: Record<string, string> = {
    accent: 'bg-accent-light text-accent',
    protein: 'bg-[#EEE9FE] text-protein',
    carbs: 'bg-[#FEF2E7] text-carbs',
    fat: 'bg-[#E7F4FE] text-fat',
  }

  return (
    <div className={clsx('macro-pill', colorClasses[color] || 'bg-bg-surface2 text-text-secondary')}>
      <span className="font-semibold">{value}{unit}</span>
      <span className="opacity-70">{label}</span>
      {target && <span className="opacity-50">/{target}</span>}
    </div>
  )
}
