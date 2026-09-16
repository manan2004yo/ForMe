import { useIntegrationStore, type Platform } from '@/store/integrationStore'
import { ArrowLeft, Check, RefreshCw, Smartphone, Activity, Heart, Watch } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui'

const PLATFORMS = [
  { id: 'apple_health', name: 'Apple Health', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { id: 'google_fit', name: 'Google Fit', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'oura', name: 'Oura Ring', icon: Watch, color: 'text-slate-200', bg: 'bg-slate-700' },
  { id: 'garmin', name: 'Garmin Connect', icon: Smartphone, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  { id: 'fitbit', name: 'Fitbit', icon: Activity, color: 'text-teal-500', bg: 'bg-teal-500/10' },
] as const

export function IntegrationsPage() {
  const navigate = useNavigate()
  const { connectedPlatforms, isSyncing, connectPlatform, disconnectPlatform, syncData, dailyActivity } = useIntegrationStore()

  const handleToggle = async (platformId: Platform, isConnected: boolean) => {
    if (isConnected) {
      disconnectPlatform(platformId)
    } else {
      await connectPlatform(platformId)
    }
  }

  return (
    <div className="page bg-bg min-h-screen">
      <header className="page-header flex items-center justify-between mb-8 animate-fade-in">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full bg-bg-surface2 flex items-center justify-center text-text-primary hover:bg-bg-surface transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-display text-text-primary">Integrations</h1>
        </div>
        {connectedPlatforms.length > 0 && (
          <Button onClick={syncData} disabled={isSyncing} variant="secondary" size="sm" className="rounded-pill">
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            <span className="ml-2">{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </Button>
        )}
      </header>

      <div className="space-y-4 animate-slide-up">
        {PLATFORMS.map((platform) => {
          const isConnected = connectedPlatforms.includes(platform.id as Platform)
          const Icon = platform.icon

          return (
            <div key={platform.id} className="bg-bg-surface2 border border-border rounded-2xl p-5 flex items-center justify-between transition-all hover:border-accent/50">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${platform.bg}`}>
                  <Icon size={24} className={platform.color} />
                </div>
                <div>
                  <h3 className="text-body font-bold text-text-primary">{platform.name}</h3>
                  <p className="text-caption text-text-secondary">
                    {isConnected ? 'Connected & Syncing' : 'Not Connected'}
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={() => handleToggle(platform.id as Platform, isConnected)}
                disabled={isSyncing}
                variant={isConnected ? 'secondary' : 'primary'}
                className={`rounded-pill transition-colors ${isConnected ? 'bg-status-good/10 text-status-good border-transparent hover:bg-status-good/20 hover:text-status-good' : ''}`}
                size="sm"
              >
                {isConnected ? (
                  <><Check size={16} className="mr-1" /> Connected</>
                ) : 'Connect'}
              </Button>
            </div>
          )
        })}
      </div>

      {connectedPlatforms.length > 0 && dailyActivity && (
        <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-accent/20 to-bg-surface border border-accent/30 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Check size={18} className="text-accent" />
            <h3 className="text-body font-bold text-text-primary">Sync Active</h3>
          </div>
          <p className="text-caption text-text-secondary mb-4">
            Your connected devices are syncing steps and calorie data to FORME.
          </p>
          <div className="flex gap-6 text-sm">
            <div>
              <div className="text-text-tertiary">Last Synced</div>
              <div className="font-semibold text-text-primary">
                {new Date(dailyActivity.lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div>
              <div className="text-text-tertiary">Steps Today</div>
              <div className="font-semibold text-text-primary">
                {dailyActivity.steps.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
