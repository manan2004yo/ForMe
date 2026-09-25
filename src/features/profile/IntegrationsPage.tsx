import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router'

export function IntegrationsPage() {
  const navigate = useNavigate()

  return (
    <div className="page bg-bg min-h-screen">
      <header className="page-header flex items-center justify-between mb-8 animate-fade-in">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/profile')} 
            className="w-10 h-10 rounded-full bg-bg-surface flex items-center justify-center text-text-primary hover:bg-bg-surface transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-heading font-bold text-white">Integrations</h1>
        </div>
      </header>
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
          <span className="text-3xl">🔌</span>
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Coming in a future update</h2>
        <p className="text-white/40 text-sm max-w-xs leading-relaxed">
          Health app integrations will be available soon. 
          Check back after the next major update.
        </p>
      </div>
    </div>
  )
}
