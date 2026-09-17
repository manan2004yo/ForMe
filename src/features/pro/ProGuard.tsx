import { useAuthStore } from '@/store/authStore'
import { ReactNode } from 'react'
import { FormeProPaywall } from './FormeProPaywall'

interface ProGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

export function ProGuard({ children, fallback }: ProGuardProps) {
  const { isPro } = useAuthStore()

  if (!isPro) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-4">
        {fallback ? fallback : <FormeProPaywall />}
      </div>
    )
  }

  return <>{children}</>
}
