import { LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className
}: EmptyStateProps) {
  return (
    <div className={clsx("flex flex-col items-center justify-center text-center px-6 py-12 rounded-2xl border border-white/5 bg-white/5", className)}>
      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 text-white/40 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.02)]">
        <Icon size={32} />
      </div>
      <h3 className="text-xl text-white font-semibold mb-2">{title}</h3>
      <p className="text-sm text-white/50 max-w-sm mb-6 leading-relaxed">{description}</p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-accent text-black rounded-xl font-bold hover:bg-accent/90 transition-all active:scale-95 shadow-[0_0_15px_rgba(45,212,191,0.2)] focus:outline-none focus:ring-2 focus:ring-white"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
