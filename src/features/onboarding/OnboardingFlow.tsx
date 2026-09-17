// ============================================================
// FORME — Multi-Step Onboarding Flow
// ============================================================

import { useAuthStore } from '@/store/authStore'
import { useUserStore } from '@/store/userStore'
import type { ActivityLevel, ComplexityMode, CookingAbility, DietType, EatingEnvironment, FitnessGoal, Gender, TrainingExperience, TrainingLocation, UserProfile, WorkoutDuration } from '@/types'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const STEPS = [
  'Your Body',
  'Your Goal',
  'Diet & Food',
  'Training',
  'Lifestyle',
  'Done!',
]

const GOAL_OPTIONS: { value: FitnessGoal; label: string; emoji: string; desc: string }[] = [
  { value: 'build_muscle', label: 'Build Muscle', emoji: '💪', desc: 'Gain size and strength' },
  { value: 'lose_fat', label: 'Lose Fat', emoji: '🔥', desc: 'Reduce body fat, stay lean' },
  { value: 'body_recomposition', label: 'Body Recomp', emoji: '⚡', desc: 'Build muscle & lose fat simultaneously' },
  { value: 'get_lean', label: 'Get Lean', emoji: '✂️', desc: 'Cut while preserving muscle' },
  { value: 'improve_fitness', label: 'Improve Fitness', emoji: '🏃', desc: 'Better health and endurance' },
]

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Desk job, no exercise' },
  { value: 'lightly_active', label: 'Lightly Active', desc: '1-3 days/week light activity' },
  { value: 'moderately_active', label: 'Moderately Active', desc: '3-5 days/week moderate exercise' },
  { value: 'very_active', label: 'Very Active', desc: '6-7 days/week hard exercise' },
  { value: 'extremely_active', label: 'Extremely Active', desc: 'Physical job + daily training' },
]

interface StepBodyProps {
  data: Partial<UserProfile>
  onChange: (updates: Partial<UserProfile>) => void
}

function StepBody({ data, onChange }: StepBodyProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-text-secondary mb-1.5 block">Age</label>
          <input
            type="number"
            className="input-field"
            placeholder="25"
            min={13} max={80}
            value={data.age || ''}
            onChange={e => onChange({ age: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-text-secondary mb-1.5 block">Gender</label>
          <div className="flex gap-2">
            {(['male', 'female', 'other'] as Gender[]).map(g => (
              <button
                key={g}
                type="button"
                onClick={() => onChange({ gender: g })}
                className={`flex-1 py-3 rounded-xl text-xs font-medium border transition-all ${
                  data.gender === g
                    ? 'bg-accent text-white border-accent'
                    : 'bg-bg-surface border-border text-text-secondary hover:border-accent'
                }`}
              >
                {g === 'male' ? '♂️ M' : g === 'female' ? '♀️ F' : '⚧ X'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-text-secondary mb-1.5 block">Height (cm)</label>
          <input
            type="number"
            className="input-field"
            placeholder="170"
            min={130} max={220}
            value={data.heightCm || ''}
            onChange={e => onChange({ heightCm: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-text-secondary mb-1.5 block">Weight (kg)</label>
          <input
            type="number"
            className="input-field"
            placeholder="65"
            min={30} max={250}
            step="0.5"
            value={data.weightKg || ''}
            onChange={e => onChange({ weightKg: parseFloat(e.target.value) })}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-text-secondary mb-2 block">Activity Level</label>
        <div className="flex flex-col gap-2">
          {ACTIVITY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ activityLevel: opt.value })}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                data.activityLevel === opt.value
                  ? 'bg-accent-light border-accent'
                  : 'bg-bg-surface border-border hover:border-accent/50'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                data.activityLevel === opt.value ? 'border-accent bg-accent' : 'border-border'
              }`}>
                {data.activityLevel === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div>
                <div className="text-sm font-medium text-text-primary">{opt.label}</div>
                <div className="text-xs text-text-tertiary">{opt.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function StepGoal({ data, onChange }: StepBodyProps) {
  return (
    <div className="flex flex-col gap-3">
      {GOAL_OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange({ fitnessGoal: opt.value })}
          className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
            data.fitnessGoal === opt.value
              ? 'bg-accent-light border-accent shadow-soft'
              : 'bg-bg-surface border-border hover:border-accent/50'
          }`}
        >
          <span className="text-3xl">{opt.emoji}</span>
          <div className="flex-1">
            <div className="font-semibold text-text-primary">{opt.label}</div>
            <div className="text-sm text-text-secondary">{opt.desc}</div>
          </div>
          {data.fitnessGoal === opt.value && (
            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
              <Check size={12} className="text-white" />
            </div>
          )}
        </button>
      ))}

      <div>
        <label className="text-sm font-medium text-text-secondary mb-2 block">Experience Level</label>
        <div className="flex gap-2">
          {(['beginner', 'intermediate', 'advanced'] as TrainingExperience[]).map(exp => (
            <button
              key={exp}
              type="button"
              onClick={() => onChange({ trainingExperience: exp })}
              className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all capitalize ${
                data.trainingExperience === exp
                  ? 'bg-accent text-white border-accent'
                  : 'bg-bg-surface border-border text-text-secondary hover:border-accent'
              }`}
            >
              {exp}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function StepDiet({ data, onChange }: StepBodyProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="text-sm font-medium text-text-secondary mb-2 block">Diet Type</label>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: 'vegetarian', label: '🥦 Vegetarian' },
            { value: 'non_vegetarian', label: '🍗 Non-Veg' },
            { value: 'vegan', label: '🌱 Vegan' },
            { value: 'jain', label: '🙏 Jain' },
          ] as { value: DietType; label: string }[]).map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ dietType: opt.value })}
              className={`py-3 px-4 rounded-xl text-sm font-medium border transition-all text-center ${
                data.dietType === opt.value
                  ? 'bg-accent text-white border-accent'
                  : 'bg-bg-surface border-border text-text-secondary hover:border-accent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-text-secondary mb-2 block">What do you eat?</label>
        <div className="flex flex-col gap-2">
          {[
            { key: 'eatsEggs', label: '🥚 Eggs' },
            { key: 'eatsMeat', label: '🍖 Meat (Chicken, Mutton)' },
            { key: 'eatsFish', label: '🐟 Fish / Seafood' },
            { key: 'eatsDairy', label: '🥛 Dairy (Milk, Dahi, Paneer)' },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ [key]: !data[key as keyof UserProfile] } as Partial<UserProfile>)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                data[key as keyof UserProfile]
                  ? 'bg-success-light border-success/30 text-success'
                  : 'bg-bg-surface border-border text-text-secondary'
              }`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                data[key as keyof UserProfile] ? 'border-success bg-success' : 'border-border-strong'
              }`}>
                {data[key as keyof UserProfile] && <Check size={10} className="text-white" />}
              </div>
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-text-secondary mb-1.5 block">Monthly Food Budget (₹)</label>
        <input
          type="number"
          className="input-field"
          placeholder="3000"
          min={500}
          step={500}
          value={data.monthlyFoodBudget || ''}
          onChange={e => onChange({ monthlyFoodBudget: parseInt(e.target.value) })}
        />
        <p className="text-xs text-text-tertiary mt-1">Your typical spending on food per month</p>
      </div>

      <div>
        <label className="text-sm font-medium text-text-secondary mb-2 block">Eating Environment</label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'home', label: '🏠 Home' },
            { value: 'hostel', label: '🏫 Hostel' },
            { value: 'office', label: '🏢 Office' },
            { value: 'tiffin', label: '🍱 Tiffin' },
            { value: 'restaurant', label: '🍽️ Resto' },
            { value: 'combination', label: '🔀 Mix' },
          ] as { value: EatingEnvironment; label: string }[]).map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ eatingEnvironment: opt.value })}
              className={`py-3 px-2 rounded-xl text-xs font-medium border transition-all text-center ${
                data.eatingEnvironment === opt.value
                  ? 'bg-accent text-white border-accent'
                  : 'bg-bg-surface border-border text-text-secondary hover:border-accent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function StepTraining({ data, onChange }: StepBodyProps) {
  const toggleDay = (day: number) => {
    const current = data.trainingDays || []
    const updated = current.includes(day) ? current.filter(d => d !== day) : [...current, day]
    onChange({ trainingDays: updated.sort() })
  }

  const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="text-sm font-medium text-text-secondary mb-2 block">Training Location</label>
        <div className="flex gap-2">
          {([
            { value: 'gym', label: '🏋️ Gym' },
            { value: 'home', label: '🏠 Home' },
            { value: 'hybrid', label: '🔀 Hybrid' },
          ] as { value: TrainingLocation; label: string }[]).map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ trainingLocation: opt.value })}
              className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all ${
                data.trainingLocation === opt.value
                  ? 'bg-accent text-white border-accent'
                  : 'bg-bg-surface border-border text-text-secondary hover:border-accent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-text-secondary mb-2 block">Training Days</label>
        <div className="flex gap-2">
          {DAY_LABELS.map((day, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              className={`flex-1 aspect-square rounded-xl text-sm font-medium border transition-all ${
                (data.trainingDays || []).includes(i)
                  ? 'bg-accent text-white border-accent'
                  : 'bg-bg-surface border-border text-text-secondary hover:border-accent'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
        <p className="text-xs text-text-tertiary mt-1.5">
          {(data.trainingDays || []).length} days selected
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-text-secondary mb-2 block">Session Duration</label>
        <div className="grid grid-cols-3 gap-2">
          {(['20-30', '30-45', '45-60', '60-90', '90+'] as WorkoutDuration[]).map(dur => (
            <button
              key={dur}
              type="button"
              onClick={() => onChange({ workoutDuration: dur })}
              className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                data.workoutDuration === dur
                  ? 'bg-accent text-white border-accent'
                  : 'bg-bg-surface border-border text-text-secondary hover:border-accent'
              }`}
            >
              {dur} min
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function StepLifestyle({ data, onChange }: StepBodyProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="text-sm font-medium text-text-secondary mb-2 block">Cooking Ability</label>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: 'none', label: '❌ No cooking' },
            { value: 'basic', label: '🍳 Basic' },
            { value: 'regular', label: '👨‍🍳 Regular' },
            { value: 'enjoys', label: '🧑‍🍳 Enjoys cooking' },
          ] as { value: CookingAbility; label: string }[]).map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ cookingAbility: opt.value })}
              className={`py-3 px-3 rounded-xl text-sm font-medium border transition-all text-center ${
                data.cookingAbility === opt.value
                  ? 'bg-accent text-white border-accent'
                  : 'bg-bg-surface border-border text-text-secondary hover:border-accent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-text-secondary mb-2 block">Meals per day</label>
        <div className="flex gap-2">
          {[2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => onChange({ mealFrequency: n })}
              className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${
                data.mealFrequency === n
                  ? 'bg-accent text-white border-accent'
                  : 'bg-bg-surface border-border text-text-secondary hover:border-accent'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-text-secondary mb-2 block">App Complexity Mode</label>
        <div className="flex flex-col gap-2">
          {([
            { value: 'easy', label: 'Easy 🌱', desc: 'Simple tracking, no macro math' },
            { value: 'smart', label: 'Smart ⚡', desc: 'Balanced detail with guidance' },
            { value: 'precision', label: 'Precision 🔬', desc: 'Full macro tracking, advanced data' },
          ] as { value: ComplexityMode; label: string; desc: string }[]).map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ complexityMode: opt.value })}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                data.complexityMode === opt.value
                  ? 'bg-accent-light border-accent'
                  : 'bg-bg-surface border-border hover:border-accent/50'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                data.complexityMode === opt.value ? 'border-accent bg-accent' : 'border-border'
              }`}>
                {data.complexityMode === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div>
                <div className="text-sm font-medium text-text-primary">{opt.label}</div>
                <div className="text-xs text-text-tertiary">{opt.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function StepDone({ data }: { data: Partial<UserProfile> }) {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-8">
      <div className="w-24 h-24 rounded-full bg-success-light flex items-center justify-center animate-scale-in">
        <Check size={40} className="text-success" />
      </div>
      <div>
        <h2 className="font-heading font-bold text-2xl text-text-primary mb-2">
          You're all set, {data.name?.split(' ')[0] || 'Champion'}! 🎉
        </h2>
        <p className="text-text-secondary leading-relaxed">
          Your personalized plan is ready. We've calculated your targets and built a meal plan based on your preferences.
        </p>
      </div>

      <div className="w-full card p-4 gradient-bg-warm text-left">
        <div className="text-sm font-medium text-text-secondary mb-3">Your starting point</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-base">⚖️</span>
            <span className="text-text-primary">{data.weightKg}kg, {data.heightCm}cm</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">🎯</span>
            <span className="text-text-primary capitalize">{data.fitnessGoal?.replace(/_/g, ' ')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">🏋️</span>
            <span className="text-text-primary capitalize">{data.trainingLocation}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">🥗</span>
            <span className="text-text-primary capitalize">{data.dietType?.replace(/_/g, '-')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const DEFAULT_ONBOARDING: Partial<UserProfile> = {
  age: undefined as any,
  gender: 'male',
  heightCm: undefined as any,
  weightKg: undefined as any,
  activityLevel: 'moderately_active',
  fitnessGoal: 'body_recomposition',
  trainingExperience: 'beginner',
  dietType: 'vegetarian',
  eatsEggs: true,
  eatsMeat: false,
  eatsFish: false,
  eatsDairy: true,
  monthlyFoodBudget: 3000,
  eatingEnvironment: 'home',
  trainingLocation: 'gym',
  trainingDays: [1, 3, 5],
  gymClosedDays: [0],
  workoutDuration: '45-60',
  cookingAbility: 'basic',
  mealFrequency: 3,
  complexityMode: 'smart',
  availableEquipment: [],
  foodAvailability: [],
  allergies: '',
  physicalLimitations: '',
  preferredKatoriGrams: 150,
}

export function OnboardingFlow() {
  const { user, logout } = useAuthStore()
  const { saveProfile } = useUserStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<Partial<UserProfile>>({
    ...DEFAULT_ONBOARDING,
    id: user?.uid || 'demo',
    email: user?.email || '',
    name: user?.displayName || '',
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleChange = (updates: Partial<UserProfile>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      // Save and complete
      setIsSaving(true)
      try {
        await saveProfile({
          ...data as UserProfile,
          onboardingComplete: true,
        })
        navigate('/')
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1)
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="min-h-dvh bg-bg flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <div className="px-6 pt-10 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-heading font-bold text-sm">F</span>
          </div>
          <span className="font-heading font-bold text-lg text-text-primary">FORME</span>
          <div className="ml-auto flex items-center gap-4">
            <button 
              onClick={() => logout()}
              className="text-xs font-medium text-text-tertiary hover:text-error transition-colors"
            >
              Sign Out
            </button>
            <div className="text-sm text-text-tertiary">
              {step + 1} / {STEPS.length}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-bg-surface2 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step title */}
        <div className="mb-1">
          <div className="text-xs font-medium text-accent uppercase tracking-wider mb-1">
            Step {step + 1} of {STEPS.length}
          </div>
          <h1 className="font-heading font-bold text-2xl text-text-primary">{STEPS[step]}</h1>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 px-6 py-2 overflow-y-auto">
        <div className="animate-fade-in" key={step}>
          {step === 0 && <StepBody data={data} onChange={handleChange} />}
          {step === 1 && <StepGoal data={data} onChange={handleChange} />}
          {step === 2 && <StepDiet data={data} onChange={handleChange} />}
          {step === 3 && <StepTraining data={data} onChange={handleChange} />}
          {step === 4 && <StepLifestyle data={data} onChange={handleChange} />}
          {step === 5 && <StepDone data={data} />}
        </div>
      </div>

      {/* Navigation */}
      <div className="px-6 py-6 flex gap-3">
        {step > 0 && (
          <button
            onClick={handleBack}
            className="btn btn-secondary btn-lg px-6"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={isSaving}
          className="btn btn-accent btn-lg flex-1"
          id={`onboarding-next-step-${step}`}
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : step === STEPS.length - 1 ? (
            <>
              Let's Go! 🚀
            </>
          ) : (
            <>
              Continue
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
