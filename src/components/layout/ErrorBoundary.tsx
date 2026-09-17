import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <div className="glass-panel p-8 max-w-md w-full text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <AlertTriangle size={32} />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-white/50 text-sm mb-8">
              A critical error occurred while loading this screen. Our systems have logged the issue.
            </p>

            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-95"
            >
              <RefreshCcw size={18} />
              Reload Application
            </button>
            
            {import.meta.env.DEV && this.state.error && (
              <div className="mt-6 p-4 bg-black/50 rounded-lg text-left overflow-auto w-full border border-white/5">
                <code className="text-red-400 text-xs font-mono break-all">
                  {this.state.error.message}
                </code>
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
