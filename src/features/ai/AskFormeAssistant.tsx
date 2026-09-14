// ============================================================
// FORME - Contextual AI Coach
// ============================================================

import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Sparkles, X, Send, Loader2, Info } from 'lucide-react'
import { useUserStore } from '@/store/userStore'
import { useAuthStore } from '@/store/authStore'
import { useTrainStore } from '@/store/trainStore'
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
  const { user } = useAuthStore()
  const { currentPlan } = useTrainStore()
  const { todayTotals } = useFoodLogStore()
  
  const getContextualGreeting = () => {
    const path = location.pathname
    const todayIndex = new Date().getDay()
    const isRestDay = currentPlan[todayIndex]?.isRestDay

    if (path.includes('eat')) {
      return {
        message: "Hi! Need help with your food log? I can suggest meals to hit your remaining macros.",
        actions: [{ label: 'Suggest a high-protein dinner under 600 kcal', action: 'Suggest a high-protein dinner under 600 kcal.' }]
      }
    }
    if (path.includes('train')) {
      if (isRestDay) {
        return {
          message: "It's a rest day! Need recovery tips?",
          actions: [{ label: 'How should I recover today?', action: 'How should I recover today?' }]
        }
      }
      return {
        message: "Ready to train? I can help you pick sets and reps or swap exercises.",
        actions: [{ label: 'Help me choose sets and reps for bench press', action: 'Help me choose sets and reps for bench press.' }]
      }
    }
    if (path.includes('plan')) {
      return {
        message: "Planning your meals? I can help you balance your macros.",
        actions: [{ label: 'How much protein is left today?', action: 'How much protein is left today?' }]
      }
    }
    return {
      message: "Hi! I'm FORME Coach. What can I help you with today?",
      actions: [{ label: 'Review my progress', action: 'Review my progress.' }, { label: 'Adjust my goals', action: 'How should I adjust my goals?' }]
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
        <header className="px-6 py-4 border-b border-white/5 bg-[#121212] flex flex-col shrink-0 gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                <Sparkles size={16} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">FORME Coach</h2>
                <p className="text-xs text-white/50">Context-Aware AI</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  const greeting = getContextualGreeting()
                  setMessages([{ id: uuidv4(), role: 'assistant', content: greeting.message, actions: greeting.actions }])
                }}
                className="text-xs font-semibold text-white/50 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all active:scale-95"
              >
                Clear
              </button>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors active:scale-95"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          {user?.email === 'demo@forme.fit' && (
            <div className="flex items-center justify-center gap-1.5 bg-orange-500/10 text-orange-400 py-1.5 rounded text-xs font-medium border border-orange-500/20">
              <Info size={12} />
              <span>Responses are based on Demo Profile data.</span>
            </div>
          )}
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
