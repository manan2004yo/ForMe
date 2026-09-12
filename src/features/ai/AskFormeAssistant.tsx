import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Send, Loader2, Info } from 'lucide-react'
import { useUserStore } from '@/store/userStore'
import { useFoodLogStore } from '@/store/foodLogStore'
import { askForme, type AIContext } from '@/lib/ai/modelRouter'
import { v4 as uuidv4 } from 'uuid'

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
    if (isOpen) {
      scrollToBottom()
    }
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
        todayWorkout: null // TODO: Hook up to training store
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
    <div className="fixed inset-0 z-50 flex flex-col sm:p-4 pointer-events-none">
      {/* Backdrop for mobile */}
      <div 
        className="absolute inset-0 bg-black/20 sm:hidden pointer-events-auto transition-opacity" 
        onClick={onClose}
      />

      <div className="flex-1 sm:flex-none" />

      {/* Chat Window */}
      <div className="bg-bg w-full h-[85vh] sm:h-[600px] sm:w-[400px] sm:rounded-2xl sm:shadow-2xl flex flex-col pointer-events-auto border-t sm:border border-border/50 self-end transition-transform animate-slide-up sm:animate-fade-in relative z-10 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-bg-surface">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center">
              <Sparkles size={16} className="text-accent" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-text-primary text-sm">Ask FORME</h2>
              <div className="text-[10px] text-text-tertiary">Personal AI Assistant</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-text-secondary hover:bg-bg-surface2 rounded-xl transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === 'user' 
                  ? 'bg-text-primary text-bg rounded-br-sm' 
                  : 'bg-bg-surface2 text-text-primary rounded-bl-sm border border-border/50'
              }`}>
                {msg.content}
                
                {/* Confidence Badge */}
                {msg.confidence && msg.role === 'assistant' && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-text-tertiary">
                    <Info size={10} />
                    Confidence: <span className="capitalize">{msg.confidence}</span>
                  </div>
                )}

                {/* Suggested Actions */}
                {msg.actions && msg.role === 'assistant' && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.actions.map(action => (
                      <button key={action.action} className="badge badge-accent bg-accent/10 text-accent hover:bg-accent/20 cursor-pointer transition-colors text-xs py-1.5 px-3">
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-bg-surface2 text-text-primary rounded-2xl rounded-bl-sm border border-border/50 px-4 py-3 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-accent" />
                <span className="text-xs text-text-tertiary">FORME is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-bg">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything..."
              className="w-full bg-bg-surface2 border border-border/50 rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-accent/50 transition-colors placeholder:text-text-tertiary"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="absolute right-2 p-2 rounded-full text-accent disabled:text-text-tertiary disabled:opacity-50 hover:bg-accent/10 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
