import React from 'react'
import { useSyncStore } from '@/store/syncStore'
import { Cloud, CloudOff, AlertTriangle, RefreshCw } from 'lucide-react'
export function SyncStatusIndicator() {
  const queue = useSyncStore(s => s.queue)
  const isProcessing = useSyncStore(s => s.isProcessing)

  if (queue.length === 0) return null

  const hasFailed = queue.some(q => q.retryCount > 0 && q.lastError)

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-slate-800/50 text-slate-400 border border-white/5 shadow-sm backdrop-blur-sm transition-all duration-300">
      {hasFailed ? (
        <>
          <AlertTriangle className="w-4 h-4 text-amber-400/90" />
          <span className="hidden sm:inline text-amber-400/90">{queue.length} pending</span>
          <span className="sm:hidden text-amber-400/90">{queue.length}</span>
        </>
      ) : isProcessing ? (
        <>
          <RefreshCw className="w-4 h-4 text-teal-400 animate-spin" />
          <span className="hidden sm:inline text-teal-400">Syncing...</span>
        </>
      ) : (
        <>
          <Cloud className="w-4 h-4 text-slate-300" />
          <span className="hidden sm:inline">{queue.length} pending</span>
          <span className="sm:hidden">{queue.length}</span>
        </>
      )}
    </div>
  )
}
