import { useCnsStore } from '@/store/cnsStore'
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'

export function CnsStatusBadge({ className }: { className?: string }) {
  const { getCurrentStatus } = useCnsStore()
  const status = getCurrentStatus()

  const config = {
    'Optimal': {
      color: 'text-success bg-success/10 border-success/20',
      icon: CheckCircle2,
      label: 'Optimal'
    },
    'Moderate Fatigue': {
      color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
      icon: Activity,
      label: 'Fatigued'
    },
    'Fried': {
      color: 'bg-error text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-error/50',
      icon: Activity,
      label: 'High Recovery Strain'
    }
  }

  const { color, icon: Icon, label } = config[status]

  return (
    <div className={clsx("flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium", color, className)}>
      <Icon size={14} />
      {label}
    </div>
  )
}
