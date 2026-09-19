// ============================================================
// FORME — Goal Switcher
// ============================================================
// Makes goal switching feel immediate and prominent.
// The profile page edit flow still works — this is an additional
// quick-switch surface on the Progress dashboard.
// Calls saveProfile which triggers calculateBodyMetrics automatically.
// ============================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import { useUserStore } from '@/store/userStore'
import { useToastStore } from '@/store/toastStore'
import type { FitnessGoal } from '@/types'

const GOALS: { value: FitnessGoal; label: string; description: string; emoji: string }[] = [
  {
    value: 'lose_fat',
    label: 'Lose Fat',
    description: 'Caloric deficit · Higher cardio targets',
    emoji: '🔥',
  },
  {
    value: 'build_muscle',
    label: 'Build Muscle',
    description: 'Caloric surplus · Higher protein targets',
    emoji: '💪',
  },
  {
    value: 'body_recomposition',
    label: 'Recomposition',
    description: 'Maintenance calories · Balanced targets',
    emoji: '⚡',
  },
  {
    value: 'get_lean',
    label: 'Lean Bulk',
    description: 'Slight surplus · Maximum muscle, minimum fat',
    emoji: '📈',
  },
]

export function GoalSwitcher() {
  const { profile, metrics, saveProfile } = useUserStore()
  const toast = useToastStore()
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  if (!profile) return null

  const currentGoal = GOALS.find(g => g.value === profile.fitnessGoal) ?? GOALS[2]

  async function handleGoalSwitch(goal: FitnessGoal) {
    if (goal === profile!.fitnessGoal) {
      setIsOpen(false)
      return
    }

    setIsSaving(true)
    setIsOpen(false)

    try {
      await saveProfile({ fitnessGoal: goal })
      const newGoal = GOALS.find(g => g.value === goal)
      toast.success(`Goal updated to ${newGoal?.label}. Targets recalculated.`)
    } catch {
      toast.error('Failed to update goal. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="relative">
      {/* Current goal display / trigger */}
      <button
        onClick={() => setIsOpen(o => !o)}
        disabled={isSaving}
        className="w-full flex items-center justify-between px-4 py-4 rounded-2xl bg-white/5 border border-white/8 hover:bg-white/8 transition-all active:scale-98 disabled:opacity-50"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-xl">
            {currentGoal.emoji}
          </div>
          <div className="text-left">
            <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-0.5">
              Current Goal
            </p>
            <p className="text-base font-bold text-white">{currentGoal.label}</p>
            <p className="text-xs text-white/40 mt-0.5">{currentGoal.description}</p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={18} className="text-white/30" />
        </motion.div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full left-0 right-0 mt-2 z-20 bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
          >
            {GOALS.map(goal => {
              const isActive = goal.value === profile.fitnessGoal
              return (
                <button
                  key={goal.value}
                  onClick={() => handleGoalSwitch(goal.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all hover:bg-white/5 ${
                    isActive ? 'bg-accent/10' : ''
                  }`}
                >
                  <span className="text-xl shrink-0">{goal.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${isActive ? 'text-accent' : 'text-white'}`}>
                      {goal.label}
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">{goal.description}</p>
                  </div>
                  {isActive && (
                    <Check size={16} className="text-accent shrink-0" />
                  )}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Updated targets preview */}
      <AnimatePresence>
        {!isOpen && metrics && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 grid grid-cols-3 gap-2"
          >
            {[
              { label: 'Calories', value: Math.round(metrics.caloricTarget), unit: 'kcal' },
              { label: 'Protein', value: Math.round(metrics.proteinTarget), unit: 'g' },
              { label: 'Strategy', value: metrics.caloricStrategy === 'deficit' ? 'Cut' : metrics.caloricStrategy === 'surplus' ? 'Bulk' : 'Maintain', unit: '' },
            ].map(({ label, value, unit }) => (
              <div key={label} className="bg-white/3 rounded-xl p-3 text-center">
                <p className="text-sm font-bold text-white tabular-nums">{value}{unit}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{label}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
