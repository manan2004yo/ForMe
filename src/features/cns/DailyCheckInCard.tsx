import { useAuthStore } from '@/store/authStore'
import { useCnsStore } from '@/store/cnsStore'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, Battery, Check, ChevronRight, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'

export function DailyCheckInCard() {
  const { user } = useAuthStore()
  const { getTodayLog, addLog } = useCnsStore()
  
  const todayLog = getTodayLog()
  const [isExpanded, setIsExpanded] = useState(!todayLog)
  const [currentStep, setCurrentStep] = useState(0)

  const [answers, setAnswers] = useState<{
    sleepHours?: number
    fatigueLevel?: number
    sorenessLevel?: number
  }>({})

  const [sleep, setSleep] = useState(7)
  const [fatigue, setFatigue] = useState(5)
  const [soreness, setSoreness] = useState(5)

  useEffect(() => {
    if (currentStep === 0 && answers.sleepHours !== undefined) setSleep(answers.sleepHours)
    if (currentStep === 1 && answers.fatigueLevel !== undefined) setFatigue(answers.fatigueLevel)
    if (currentStep === 2 && answers.sorenessLevel !== undefined) setSoreness(answers.sorenessLevel)
  }, [currentStep, answers])

  if (todayLog && !isExpanded) return null

  const handleNext = () => {
    if (currentStep === 0) {
      setAnswers(prev => ({ ...prev, sleepHours: sleep }))
      setCurrentStep(1)
    } else if (currentStep === 1) {
      setAnswers(prev => ({ ...prev, fatigueLevel: fatigue }))
      setCurrentStep(2)
    } else {
      handleComplete()
    }
  }

  const handleComplete = async () => {
    if (!user) return
    if (navigator.vibrate) navigator.vibrate([60, 30, 60])
    const today = new Date().toISOString().split('T')[0]
    await addLog(user.uid || (user as any).id || 'demo', today, {
      date: today,
      sleepHours: answers.sleepHours ?? sleep,
      fatigueLevel: answers.fatigueLevel ?? fatigue,
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
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(s => s - 1)}
                className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm font-medium transition-all active:scale-95 mb-4"
              >
                ← Back
              </button>
            )}

            {currentStep === 0 && (
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

            {currentStep === 1 && (
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

            {currentStep === 2 && (
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
              {[0, 1, 2].map(i => (
                <div key={i} className={clsx("h-1.5 rounded-full transition-all", currentStep === i ? "w-6 bg-accent" : "w-1.5 bg-white/20")} />
              ))}
            </div>
            <button 
              onClick={handleNext}
              className="flex items-center gap-1 bg-white text-black px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              {currentStep === 2 ? 'Save' : 'Next'} 
              {currentStep === 2 ? <Check size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
