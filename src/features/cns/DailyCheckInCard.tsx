import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Battery, Activity, Check, ChevronRight } from 'lucide-react'
import { useCnsStore } from '@/store/cnsStore'
import { useAuthStore } from '@/store/authStore'
import clsx from 'clsx'

export function DailyCheckInCard() {
  const { user } = useAuthStore()
  const { getTodayLog, addLog } = useCnsStore()
  
  const todayLog = getTodayLog()
  const [isExpanded, setIsExpanded] = useState(!todayLog)
  const [step, setStep] = useState(1)

  const [sleep, setSleep] = useState(7)
  const [fatigue, setFatigue] = useState(5)
  const [soreness, setSoreness] = useState(5)

  if (todayLog && !isExpanded) return null

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
    else handleComplete()
  }

  const handleComplete = async () => {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    await addLog(user.uid || (user as any).id || 'demo', today, {
      date: today,
      sleepHours: sleep,
      fatigueLevel: fatigue,
      sorenessLevel: soreness
    })
    setIsExpanded(false)
  }

  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 mb-6 shadow-xl relative overflow-hidden"
        >
          {/* Background Glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/20 blur-3xl rounded-full" />
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-accent/20 text-accent">
              <Activity size={20} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-white leading-tight">Daily Check-in</h3>
              <p className="text-white/50 text-xs">Calibrate your AI engine</p>
            </div>
          </div>

          <div className="min-h-[140px] flex flex-col justify-center">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between text-sm text-white/70">
                  <span className="flex items-center gap-2"><Moon size={16}/> Hours Slept</span>
                  <span className="font-mono text-accent">{sleep}h</span>
                </div>
                <input 
                  type="range" min="3" max="12" step="0.5" 
                  value={sleep} onChange={(e) => setSleep(Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between text-sm text-white/70">
                  <span className="flex items-center gap-2"><Battery size={16}/> Overall Fatigue</span>
                  <span className="font-mono text-accent">{fatigue}/10</span>
                </div>
                <input 
                  type="range" min="1" max="10" step="1" 
                  value={fatigue} onChange={(e) => setFatigue(Number(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-xs text-white/40">
                  <span>Energetic</span>
                  <span>Exhausted</span>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between text-sm text-white/70">
                  <span className="flex items-center gap-2"><Activity size={16}/> Muscle Soreness</span>
                  <span className="font-mono text-accent">{soreness}/10</span>
                </div>
                <input 
                  type="range" min="1" max="10" step="1" 
                  value={soreness} onChange={(e) => setSoreness(Number(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-xs text-white/40">
                  <span>Fresh</span>
                  <span>Very Sore</span>
                </div>
              </motion.div>
            )}
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-1.5">
              {[1, 2, 3].map(i => (
                <div key={i} className={clsx("h-1.5 rounded-full transition-all", step === i ? "w-6 bg-accent" : "w-1.5 bg-white/20")} />
              ))}
            </div>
            <button 
              onClick={handleNext}
              className="flex items-center gap-1 bg-white text-black px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              {step === 3 ? 'Save' : 'Next'} 
              {step === 3 ? <Check size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
