import { useUserStore, type ActiveContext } from '@/store/userStore';
import { Home, MapPin, Stethoscope, Users, UtensilsCrossed } from 'lucide-react';

const CONTEXTS: { id: ActiveContext; label: string; icon: any; color: string; desc: string }[] = [
  { id: 'normal', label: 'Normal Routine', icon: Home, color: 'text-text-primary bg-bg-surface2', desc: 'Standard caloric and protein targets.' },
  { id: 'travel', label: 'Travel Mode', icon: MapPin, color: 'text-blue-600 bg-blue-100', desc: 'Maintenance calories. Lower protein target.' },
  { id: 'restaurant', label: 'Restaurant', icon: UtensilsCrossed, color: 'text-orange-600 bg-orange-100', desc: 'Maintenance calories. Relaxed tracking.' },
  { id: 'family_dinner', label: 'Family Dinner', icon: Users, color: 'text-purple-600 bg-purple-100', desc: 'Maintenance calories. Guilt-free.' },
  { id: 'recovery', label: 'Recovery / Sick', icon: Stethoscope, color: 'text-emerald-600 bg-emerald-100', desc: 'Slight surplus for healing. High protein.' },
]

export function ContextSelector() {
  const { activeContext, setContext } = useUserStore()
  
  const active = CONTEXTS.find(c => c.id === activeContext) || CONTEXTS[0]

  return (
    <div className="card p-4 mb-5 border-border overflow-visible relative group cursor-pointer z-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Current Context</h2>
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded flex items-center justify-center ${active.color}`}>
              <active.icon size={12} />
            </div>
            <span className="font-heading font-semibold text-text-primary">{active.label}</span>
          </div>
          <p className="text-xs text-text-tertiary mt-1">{active.desc}</p>
        </div>
        <div className="text-accent text-xs font-medium">Change</div>
      </div>
      
      {/* Dropdown on hover */}
      <div className="absolute top-full left-0 right-0 mt-2 card border border-border shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col overflow-hidden bg-bg">
        {CONTEXTS.map(ctx => (
          <button
            key={ctx.id}
            onClick={() => setContext(ctx.id)}
            className={`flex items-center gap-3 p-3 text-left transition-colors hover:bg-bg-surface2 ${activeContext === ctx.id ? 'bg-accent/5' : ''}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ctx.color}`}>
              <ctx.icon size={16} />
            </div>
            <div>
              <div className={`text-sm font-semibold ${activeContext === ctx.id ? 'text-accent' : 'text-text-primary'}`}>{ctx.label}</div>
              <div className="text-xs text-text-tertiary">{ctx.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
