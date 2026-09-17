import { Button } from '@/components/ui'
import { useSpotifyStore } from '@/store/spotifyStore'
import { ArrowLeft, Check, Music } from 'lucide-react'
import { useNavigate } from 'react-router'

export function IntegrationsPage() {
  const navigate = useNavigate()
  const { isConnected, isConnecting, connect, disconnect } = useSpotifyStore()

  const handleToggle = async (currentlyConnected: boolean) => {
    if (currentlyConnected) {
      disconnect()
    } else {
      await connect()
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
      </header>

      <div className="space-y-4 animate-slide-up">
        {/* Spotify Integration */}
        <div className="bg-bg-surface2 border border-border rounded-2xl p-5 flex items-center justify-between transition-all hover:border-accent/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-500/10">
              <Music size={24} className="text-green-500" />
            </div>
            <div>
              <h3 className="text-body font-bold text-text-primary">Spotify</h3>
              <p className="text-caption text-text-secondary">
                {isConnected ? 'Connected' : 'Not Connected'}
              </p>
            </div>
          </div>
          
          <Button 
            onClick={() => handleToggle(isConnected)}
            disabled={isConnecting}
            variant={isConnected ? 'secondary' : 'primary'}
            className={`rounded-pill transition-colors ${isConnected ? 'bg-status-good/10 text-status-good border-transparent hover:bg-status-good/20 hover:text-status-good' : ''}`}
            size="sm"
          >
            {isConnecting ? (
              'Connecting...'
            ) : isConnected ? (
              <><Check size={16} className="mr-1" /> Connected</>
            ) : 'Connect'}
          </Button>
        </div>


      </div>
    </div>
  )
}
