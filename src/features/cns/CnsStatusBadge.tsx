import { useCnsStore } from '@/store/cnsStore'
import clsx from 'clsx'
import { Activity, CheckCircle2 } from 'lucide-react'

export function CnsStatusBadge({ className }: { className?: string }) {
  const { getTodayLog } = useCnsStore()
  const todayLog = getTodayLog()

  const hasCheckIn = todayLog !== null
  const color = hasCheckIn
    ? 'text-success bg-success/10 border-success/20'
    : 'text-white/50 bg-white/5 border-white/10'
  const Icon = hasCheckIn ? CheckCircle2 : Activity
  const label = hasCheckIn ? 'Recovery check-in complete' : 'Recovery check-in needed'

  return (
    <div className={clsx("flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium", color, className)}>
      <Icon size={14} />
      {label}
    </div>
  )
}
