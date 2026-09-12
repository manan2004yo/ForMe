import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Send, Loader2, Info } from 'lucide-react'
import { useUserStore } from '@/store/userStore'
import { useFoodLogStore } from '@/store/foodLogStore'
import { askForme, type AIContext } from '@/lib/ai/modelRouter'
import { v4 as uuidv4 } from 'uuid'
import { clsx } from 'clsx'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  confidence?: 'high' | 'moderate' | 'low'
  actions?: { label: string; action: string }[]
}

export function AskFormeAssistant({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: "Hi! I'm FORME. Ask me what to eat, if you can have a specific food, or how to train today." }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { profile, metrics } = useUserStore()
  const { todayTotals } = useFoodLogStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) scrollToBottom()
  }, [messages, isOpen])

  if (!isOpen) return null

  const handleSend = async () => {
    if (!input.trim() || isTyping) return

    const userQuery = input.trim()
    setInput('')
    setMessages(prev => [...prev, { id: uuidv4(), role: 'user', content: userQuery }])
    setIsTyping(true)

    try {
      const context: AIContext = {
        profile,
        metrics,
        todayFood: todayTotals(),
        todayWorkout: null
      }

      const response = await askForme(userQuery, context, 'mock')
      
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: response.message,
        confidence: response.confidence,
        actions: response.suggestedActions
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now."
      }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <>
      {/* Backdrop for mobile */}
      <div 
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm sm:hidden transition-all duration-300 animate-fade-in" 
        onClick={onClose}
      />

      {/* Chat Window */}
      <div className="fixed bottom-0 right-0 sm:bottom-[88px] sm:right-4 z-[70] w-full sm:w-[380px] h-[85dvh] sm:h-[600px] bg-bg flex flex-col sm:rounded-3xl rounded-t-3xl border border-border shadow-floating transition-transform animate-slide-up overflow-hidden">
        
        {/* Ambient Glow behind header */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-accent opacity-5 blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between p-5 border-b border-border bg-bg-surface/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent-light shadow-sm flex items-center justify-center border border-accent/20">
              <Sparkles size={18} className="text-accent" />
            </div>
            <div>
              <h2 className="text-body font-bold text-text-primary">Ask FORME</h2>
              <div className="text-micro text-accent uppercase tracking-wider font-semibold mt-0.5">Personal AI</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:bg-bg-surface2 hover:text-text-primary transition-colors active:scale-95">
            <X size={18} />
          </button>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 min-h-0 relative">
          {messages.map(msg => (
            <div key={msg.id} className={clsx("flex w-full", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={clsx(
                "max-w-[85%] px-4 py-3 text-sm shadow-sm animate-fade-in",
                msg.role === 'user' 
                  ? 'bg-text-primary text-bg rounded-2xl rounded-br-sm' 
                  : 'bg-bg-surface2 text-text-primary rounded-2xl rounded-bl-sm border border-border'
              )}>
                <div className="leading-relaxed">{msg.content}</div>
                
                {msg.confidence && msg.role === 'assistant' && (
                  <div className="mt-3 flex items-center gap-1.5 text-micro text-text-tertiary">
                    <Info size={12} />
                    Confidence: <span className={clsx("capitalize font-semibold", msg.confidence === 'high' ? 'text-status-good' : 'text-status-warning')}>{msg.confidence}</span>
                  </div>
                )}

                {msg.actions && msg.role === 'assistant' && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {msg.actions.map(action => (
                      <button key={action.action} className="px-3 py-1.5 bg-bg-surface border border-accent/20 rounded-pill text-accent hover:bg-accent-light hover:border-accent cursor-pointer transition-all text-xs font-semibold shadow-sm active:scale-95">
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-bg-surface2 text-text-primary rounded-2xl rounded-bl-sm border border-border px-5 py-4 flex items-center gap-3 shadow-sm">
                <Loader2 size={16} className="animate-spin text-accent" />
                <span className="text-xs font-medium text-text-secondary">FORME is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-2" />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-bg shrink-0">
          <div className="relative flex items-center shadow-sm rounded-full bg-bg-surface border border-border focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/10 transition-all">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..."
              className="w-full bg-transparent pl-5 pr-14 py-3.5 text-sm text-text-primary focus:outline-none placeholder:text-text-tertiary"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="absolute right-2 w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center disabled:bg-bg-surface2 disabled:text-text-tertiary transition-all active:scale-90"
            >
              <Send size={16} className={input.trim() ? "translate-x-[-1px] translate-y-[1px]" : ""} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
