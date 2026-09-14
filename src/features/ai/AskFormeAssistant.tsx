// ============================================================
// FORME - Contextual AI Coach
// ============================================================

import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
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
  const location = useLocation()
  const { profile, metrics } = useUserStore()
  const { todayTotals } = useFoodLogStore()
  
  const getContextualGreeting = () => {
    const path = location.pathname
    if (path.includes('eat')) {
      return {
        message: "Hi! I see you're looking at your Food Log. Need help finding a specific Indian food or calculating macros?",
        actions: [{ label: 'Find high protein lunch', action: 'Suggest a high protein Indian lunch' }]
      }
    }
    if (path.includes('train')) {
      return {
        message: "Hey! Ready to plan your workouts? I can suggest exercises for specific muscle groups or help you structure a split.",
        actions: [{ label: 'Suggest back exercises', action: 'What are good back exercises for a home gym?' }]
      }
    }
    if (path.includes('plan')) {
      return {
        message: "Planning ahead? I can help you review your target macros against your planned meals.",
        actions: [{ label: 'Review my macros', action: 'Am I hitting my protein target?' }]
      }
    }
    return {
      message: "Hi! I'm FORME Coach. I can help you with nutrition, workouts, and analyzing your progress.",
      actions: [{ label: 'What should I eat?', action: 'What should I eat right now based on my goals?' }]
    }
  }

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = getContextualGreeting()
      setMessages([{
        id: uuidv4(),
        role: 'assistant',
        content: greeting.message,
        actions: greeting.actions
      }])
    }
  }, [isOpen])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) scrollToBottom()
  }, [messages, isOpen])

  if (!isOpen) return null

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isTyping) return

    const userQuery = text.trim()
    setInput('')
    setMessages(prev => [...prev, { id: uuidv4(), role: 'user', content: userQuery }])
    setIsTyping(true)

    try {
      const context: AIContext = {
        profile,
        metrics,
        todayFood: todayTotals(),
        todayWorkout: null,
      }

      // Append current page to context dynamically
      const enhancedQuery = `[Context: User is currently on the ${location.pathname} page] ${userQuery}`

      const response = await askForme(enhancedQuery, context, 'mock')
      
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
      <div 
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm sm:hidden transition-all duration-300 animate-fade-in" 
        onClick={onClose}
      />
      
      <div className={clsx(
        "fixed z-[70] flex flex-col overflow-hidden transition-all duration-300 ease-spring shadow-2xl",
        "inset-x-0 bottom-0 h-[85vh] sm:h-auto sm:top-24 sm:bottom-6 sm:right-6 sm:w-[400px] sm:left-auto bg-[#121212] border border-white/10 sm:rounded-3xl rounded-t-3xl",
        isOpen ? "translate-y-0 opacity-100" : "translate-y-full sm:translate-y-8 opacity-0 pointer-events-none"
      )}>
        <header className="px-6 py-4 border-b border-white/5 bg-[#121212] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">FORME Coach</h2>
              <p className="text-xs text-white/50">Context-Aware AI</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-[#0a0a0a]">
          {messages.map(msg => (
            <div key={msg.id} className={clsx("flex flex-col max-w-[85%]", msg.role === 'user' ? "self-end" : "self-start")}>
              <div className={clsx(
                "p-4 text-sm shadow-md",
                msg.role === 'user' 
                  ? 'bg-accent text-white rounded-2xl rounded-br-sm' 
                  : 'bg-[#121212] border border-white/5 text-white rounded-2xl rounded-bl-sm'
              )}>
                <div className="leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                
                {msg.actions && msg.role === 'assistant' && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {msg.actions.map(action => (
                      <button 
                        key={action.action}
                        onClick={() => handleSend(action.action)}
                        className="px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-xl text-accent hover:bg-accent/20 transition-all text-xs font-semibold"
                      >
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
              <div className="bg-[#121212] border border-white/5 text-white rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-3">
                <Loader2 size={16} className="animate-spin text-accent" />
                <span className="text-xs font-medium text-white/50">Coach is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-2" />
        </div>

        <div className="p-4 border-t border-white/5 bg-[#121212] shrink-0">
          <div className="relative flex items-center rounded-full bg-white/5 border border-white/10 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything..."
              className="w-full bg-transparent pl-5 pr-14 py-3 text-sm text-white focus:outline-none placeholder:text-white/30"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="absolute right-1 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send size={14} className={input.trim() ? "translate-x-[-1px] translate-y-[1px]" : ""} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
