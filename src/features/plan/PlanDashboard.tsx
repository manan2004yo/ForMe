// ============================================================
// FORME — Diet Plan Dashboard
// Shows AI-generated meal plan with budget + nutrition info
// ============================================================

import { useState, useEffect } from 'react'
import { useUserStore } from '@/store/userStore'
import { generateDietPlan, getEatNowRecommendation } from '@/lib/engines/dietEngine'
import { useFoodLogStore } from '@/store/foodLogStore'
import { RefreshCw, Clock, IndianRupee, ChevronDown, ChevronUp, Info } from 'lucide-react'
import type { DailyDietPlan, PlannedMeal } from '@/types'

const MEAL_COLORS: Record<string, string> = {
  breakfast: 'from-amber-50 to-orange-50 border-amber-200',
  lunch: 'from-green-50 to-emerald-50 border-green-200',
  snack: 'from-purple-50 to-violet-50 border-purple-200',
  dinner: 'from-blue-50 to-indigo-50 border-blue-200',
  pre_workout: 'from-orange-50 to-red-50 border-orange-200',
  post_workout: 'from-teal-50 to-cyan-50 border-teal-200',
}

const MEAL_EMOJIS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  snack: '🍎',
  dinner: '🌙',
  pre_workout: '⚡',
  post_workout: '💪',
}

function MealPlanCard({ meal, expanded, onToggle }: {
  meal: PlannedMeal
  expanded: boolean
  onToggle: () => void
}) {
  const gradient = MEAL_COLORS[meal.slot] || 'from-gray-50 to-gray-50 border-gray-200'

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${gradient} overflow-hidden`}>
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={onToggle}
      >
        <span className="text-2xl">{MEAL_EMOJIS[meal.slot]}</span>
        <div className="flex-1">
          <div className="font-semibold text-text-primary">{meal.label}</div>
          <div className="flex items-center gap-3 text-xs text-text-secondary mt-0.5">
            <span className="font-medium text-text-primary">{Math.round(meal.totals.calories)} kcal</span>
            <span>P:{Math.round(meal.totals.protein)}g</span>
            <span>C:{Math.round(meal.totals.carbs)}g</span>
            <span>F:{Math.round(meal.totals.fat)}g</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {meal.estimatedCost && (
            <span className="text-xs text-text-tertiary flex items-center gap-0.5">
              <IndianRupee size={10} />
              {meal.estimatedCost}
            </span>
          )}
          {expanded ? <ChevronUp size={16} className="text-text-tertiary" /> : <ChevronDown size={16} className="text-text-tertiary" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-black/5 animate-fade-in">
          <div className="flex flex-col gap-2 mt-3">
            {meal.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 bg-bg-surface2/30 rounded-2xl border border-dashed border-border-strong relative overflow-hidden group">
                <div className="absolute inset-0 bg-accent/5 blur-2xl group-hover:bg-accent/10 transition-colors animate-pulse-glow" />
                <span className="text-3xl mb-2 relative z-10 opacity-80 filter drop-shadow-sm">🍽️</span>
                <span className="text-sm font-semibold text-text-primary relative z-10">Slot is Empty</span>
                <p className="text-xs text-text-secondary text-center mt-1 max-w-[200px] relative z-10 leading-relaxed">
                  Head over to the <strong className="text-accent px-1 py-0.5 bg-accent/10 rounded">Eat</strong> tab to start logging meals.
                </p>
              </div>
            ) : (
              meal.items.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-medium text-text-primary">{item.foodName}</span>
                      <span className="text-xs text-text-tertiary">{Math.round(item.nutrition.calories)} kcal</span>
                    </div>
                    <div className="text-xs text-text-secondary">
                      {item.quantity} {item.unit}
                      {item.notes && <span className="text-text-tertiary ml-1">· {item.notes}</span>}
                    </div>
                    <div className="text-xs text-text-tertiary">
                      P:{Math.round(item.nutrition.protein)}g · C:{Math.round(item.nutrition.carbs)}g · F:{Math.round(item.nutrition.fat)}g · Fiber:{Math.round(item.nutrition.fiber)}g
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function PlanDashboard() {
  const { profile, metrics } = useUserStore()
  const { todayTotals } = useFoodLogStore()
  const [plan, setPlan] = useState<DailyDietPlan | null>(null)
  const [expandedMeal, setExpandedMeal] = useState<string | null>('breakfast')
  const [showInfo, setShowInfo] = useState(false)

  useEffect(() => {
    if (profile && metrics) {
      setPlan({
        id: `plan_${Date.now()}`,
        userId: profile.id,
        generatedAt: new Date().toISOString(),
        totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
        meals: [
          { slot: 'breakfast', label: 'Breakfast', items: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 } },
          { slot: 'lunch', label: 'Lunch', items: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 } },
          { slot: 'dinner', label: 'Dinner', items: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 } },
        ]
      })
    }
  }, [profile, metrics])

  if (!profile || !metrics || !plan) {
    return (
      <div className="page flex items-center justify-center">
        <div className="text-text-tertiary">Generating your plan...</div>
      </div>
    )
  }

  const totals = todayTotals()
  const eatNow = getEatNowRecommendation(totals, metrics, profile)

  const regenerate = () => {
    if (profile && metrics) {
      setPlan(generateDietPlan(profile, metrics))
    }
  }

  return (
    <div className="page animate-fade-in">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-primary">Your Meal Plan 📋</h1>
          <p className="text-text-secondary text-sm mt-1">Personalized for your goal & preferences</p>
        </div>
        <button onClick={regenerate} className="btn btn-ghost p-2 rounded-xl">
          <RefreshCw size={18} className="text-text-secondary" />
        </button>
      </div>

      {/* Plan Summary */}
      <div className="card p-4 mb-5">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="font-heading font-bold text-xl text-text-primary tabular-nums">
              {Math.round(plan.totals.calories)}
            </div>
            <div className="text-xs text-text-tertiary">kcal/day</div>
            <div className="text-xs text-success mt-0.5">
              target: {metrics.caloricTarget}
            </div>
          </div>
          <div>
            <div className="font-heading font-bold text-xl text-text-primary tabular-nums">
              {Math.round(plan.totals.protein)}g
            </div>
            <div className="text-xs text-text-tertiary">protein</div>
            <div className="text-xs text-success mt-0.5">
              target: {metrics.proteinTarget}g
            </div>
          </div>
          <div>
            <div className="font-heading font-bold text-xl text-text-primary tabular-nums flex items-center justify-center gap-0.5">
              <IndianRupee size={14} />
              {plan.estimatedDailyCost || '—'}
            </div>
            <div className="text-xs text-text-tertiary">daily cost</div>
            <div className="text-xs text-text-tertiary mt-0.5">
              /{Math.round((plan.estimatedDailyCost || 0) * 30)} / month
            </div>
          </div>
        </div>

        {/* Macro Bars */}
        <div className="mt-4 flex flex-col gap-1.5">
          {[
            { label: 'Protein', val: plan.totals.protein, target: metrics.proteinTarget, color: '#7C6AF4' },
            { label: 'Carbs', val: plan.totals.carbs, target: metrics.carbTarget, color: '#F4A26A' },
            { label: 'Fat', val: plan.totals.fat, target: metrics.fatTarget, color: '#6ABFF4' },
          ].map(({ label, val, target, color }) => (
            <div key={label} className="flex items-center gap-2 text-xs">
              <span className="w-12 text-text-secondary">{label}</span>
              <div className="flex-1 h-1.5 bg-bg-surface2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(100, (val / Math.max(1, target)) * 100)}%`, backgroundColor: color }}
                />
              </div>
              <span className="w-16 text-right text-text-tertiary tabular-nums">{Math.round(val)}/{target}g</span>
            </div>
          ))}
        </div>
      </div>

      {/* Eat Now Recommendation */}
      <div className="card p-4 mb-5 gradient-bg-warm border-accent/20">
        <div className="flex gap-3">
          <div className="text-2xl">🤔</div>
          <div>
            <div className="font-medium text-text-primary text-sm mb-1">What should you eat now?</div>
            <p className="text-sm text-text-secondary leading-relaxed">{eatNow}</p>
          </div>
        </div>
      </div>

      {/* Meal Plan Cards */}
      <div className="flex flex-col gap-3">
        {plan.meals.map((meal) => (
          <MealPlanCard
            key={meal.slot}
            meal={meal}
            expanded={expandedMeal === meal.slot}
            onToggle={() => setExpandedMeal(expandedMeal === meal.slot ? null : meal.slot)}
          />
        ))}
      </div>

      {/* Personalization info */}
      <div className="mt-5 card p-4">
        <button
          onClick={() => setShowInfo(s => !s)}
          className="flex items-center gap-2 w-full text-left"
        >
          <Info size={14} className="text-text-tertiary" />
          <span className="text-sm text-text-secondary flex-1">How is this plan made?</span>
          {showInfo ? <ChevronUp size={14} className="text-text-tertiary" /> : <ChevronDown size={14} className="text-text-tertiary" />}
        </button>
        {showInfo && (
          <div className="mt-3 text-sm text-text-secondary leading-relaxed animate-fade-in">
            <p>This plan is generated based on:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-text-tertiary">
              <li>Your {metrics.caloricStrategy} caloric target ({metrics.caloricTarget} kcal)</li>
              <li>Diet type: {profile.dietType.replace(/_/g, ' ')}</li>
              <li>Budget: ₹{profile.monthlyFoodBudget || 3000}/month</li>
              <li>Eating environment: {profile.eatingEnvironment}</li>
              <li>Cooking ability: {profile.cookingAbility}</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
