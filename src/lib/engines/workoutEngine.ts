// ============================================================
// FORME — Workout Plan Engine
// Generates personalized workout splits
// ============================================================

import type { UserProfile, WorkoutPlan, WorkoutDay, PlannedExercise, MuscleGroup, FitnessGoal } from '@/types'

// ─── Exercise Database ────────────────────────────────────────

const EXERCISES: Record<string, {
  name: string; muscleGroup: MuscleGroup; secondary: MuscleGroup[];
  equipment: string[]; isCompound: boolean; difficulty: string;
  instructions: string[]; homeAlternative?: string; repRange: [number, number]; restSec: number; rir: number
}> = {
  // CHEST
  bench_press: {
    name: 'Barbell Bench Press', muscleGroup: 'chest', secondary: ['triceps', 'shoulders'],
    equipment: ['barbell', 'bench'], isCompound: true, difficulty: 'intermediate',
    instructions: ['Lie on bench, grip bar slightly wider than shoulders', 'Lower the bar to mid-chest with control', 'Press up powerfully, lock out at top', 'Keep feet flat, back slightly arched'],
    homeAlternative: 'push_up',
    repRange: [6, 12], restSec: 120, rir: 2
  },
  dumbbell_press: {
    name: 'Dumbbell Chest Press', muscleGroup: 'chest', secondary: ['triceps', 'shoulders'],
    equipment: ['dumbbell', 'bench'], isCompound: true, difficulty: 'beginner',
    instructions: ['Hold dumbbells at chest level', 'Press up and slightly together', 'Lower with control to stretch chest'],
    homeAlternative: 'push_up',
    repRange: [8, 12], restSec: 90, rir: 2
  },
  incline_press: {
    name: 'Incline Dumbbell Press', muscleGroup: 'chest', secondary: ['shoulders', 'triceps'],
    equipment: ['dumbbell', 'bench'], isCompound: true, difficulty: 'intermediate',
    instructions: ['Set bench to 30-45 degrees', 'Press dumbbells up from upper chest', 'Control the descent'],
    repRange: [8, 12], restSec: 90, rir: 2
  },
  push_up: {
    name: 'Push-Up', muscleGroup: 'chest', secondary: ['triceps', 'shoulders'],
    equipment: ['bodyweight'], isCompound: true, difficulty: 'beginner',
    instructions: ['Hands slightly wider than shoulders', 'Body straight from head to heels', 'Lower chest to floor, press up'],
    repRange: [10, 20], restSec: 60, rir: 2
  },
  cable_fly: {
    name: 'Cable Fly', muscleGroup: 'chest', secondary: [],
    equipment: ['cable'], isCompound: false, difficulty: 'intermediate',
    instructions: ['Set cables at chest height', 'Bring hands together in arc motion', 'Feel chest stretch and contraction'],
    homeAlternative: 'dumbbell_fly',
    repRange: [12, 15], restSec: 60, rir: 2
  },
  dumbbell_fly: {
    name: 'Dumbbell Fly', muscleGroup: 'chest', secondary: [],
    equipment: ['dumbbell'], isCompound: false, difficulty: 'intermediate',
    instructions: ['Lie on bench, arms out with slight bend', 'Bring dumbbells together in arc', 'Feel chest stretch at bottom'],
    repRange: [12, 15], restSec: 60, rir: 2
  },
  // BACK
  lat_pulldown: {
    name: 'Lat Pulldown', muscleGroup: 'back', secondary: ['biceps'],
    equipment: ['cable'], isCompound: true, difficulty: 'beginner',
    instructions: ['Grip bar wider than shoulders', 'Pull to upper chest, elbows down', 'Squeeze lats at bottom'],
    homeAlternative: 'pull_up',
    repRange: [8, 12], restSec: 90, rir: 2
  },
  pull_up: {
    name: 'Pull-Up', muscleGroup: 'back', secondary: ['biceps'],
    equipment: ['pull_up_bar'], isCompound: true, difficulty: 'intermediate',
    instructions: ['Hang with arms fully extended', 'Pull chest to bar, elbows down', 'Control the descent'],
    repRange: [5, 12], restSec: 120, rir: 2
  },
  cable_row: {
    name: 'Seated Cable Row', muscleGroup: 'back', secondary: ['biceps'],
    equipment: ['cable'], isCompound: true, difficulty: 'beginner',
    instructions: ['Sit upright, pull handle to abdomen', 'Squeeze shoulder blades together', 'Control the return'],
    homeAlternative: 'dumbbell_row',
    repRange: [8, 12], restSec: 90, rir: 2
  },
  dumbbell_row: {
    name: 'Dumbbell Row', muscleGroup: 'back', secondary: ['biceps'],
    equipment: ['dumbbell'], isCompound: true, difficulty: 'beginner',
    instructions: ['Brace on bench, row dumbbell to hip', 'Elbow back, squeeze lat', 'Full stretch at bottom'],
    repRange: [8, 12], restSec: 90, rir: 2
  },
  deadlift: {
    name: 'Conventional Deadlift', muscleGroup: 'back', secondary: ['hamstrings', 'glutes', 'core'],
    equipment: ['barbell'], isCompound: true, difficulty: 'advanced',
    instructions: ['Bar over mid-foot, hip-width stance', 'Hinge at hips, flat back', 'Drive through heels, lock out hips', 'Control descent'],
    repRange: [4, 8], restSec: 180, rir: 2
  },
  // SHOULDERS
  overhead_press: {
    name: 'Overhead Press', muscleGroup: 'shoulders', secondary: ['triceps'],
    equipment: ['barbell', 'dumbbell'], isCompound: true, difficulty: 'intermediate',
    instructions: ['Press dumbbells/bar overhead', 'Fully lock out at top', 'Lower to shoulder level'],
    repRange: [6, 12], restSec: 120, rir: 2
  },
  lateral_raise: {
    name: 'Lateral Raise', muscleGroup: 'shoulders', secondary: [],
    equipment: ['dumbbell'], isCompound: false, difficulty: 'beginner',
    instructions: ['Raise arms out to sides to shoulder height', 'Slight bend in elbows', 'Control the descent'],
    repRange: [12, 20], restSec: 60, rir: 2
  },
  face_pull: {
    name: 'Face Pull', muscleGroup: 'shoulders', secondary: ['back'],
    equipment: ['cable', 'resistance_band'], isCompound: false, difficulty: 'beginner',
    instructions: ['Pull rope to face level, elbows high', 'External rotate at end', 'Great for shoulder health'],
    repRange: [15, 20], restSec: 60, rir: 2
  },
  arnold_press: {
    name: 'Arnold Press', muscleGroup: 'shoulders', secondary: ['triceps'],
    equipment: ['dumbbell'], isCompound: true, difficulty: 'intermediate',
    instructions: ['Start with palms facing you', 'Rotate palms forward as you press up', 'Full range of motion'],
    repRange: [8, 12], restSec: 90, rir: 2
  },
  // BICEPS
  barbell_curl: {
    name: 'Barbell Curl', muscleGroup: 'biceps', secondary: [],
    equipment: ['barbell'], isCompound: false, difficulty: 'beginner',
    instructions: ['Grip bar shoulder-width, curl up', 'Keep elbows at sides', 'Squeeze at top'],
    homeAlternative: 'dumbbell_curl',
    repRange: [8, 12], restSec: 60, rir: 2
  },
  dumbbell_curl: {
    name: 'Dumbbell Curl', muscleGroup: 'biceps', secondary: [],
    equipment: ['dumbbell'], isCompound: false, difficulty: 'beginner',
    instructions: ['Alternate or together', 'Supinate wrist at top', 'Full range of motion'],
    repRange: [10, 15], restSec: 60, rir: 2
  },
  hammer_curl: {
    name: 'Hammer Curl', muscleGroup: 'biceps', secondary: ['forearms'],
    equipment: ['dumbbell'], isCompound: false, difficulty: 'beginner',
    instructions: ['Neutral grip (thumbs up)', 'Curl up, keeping wrist neutral', 'Trains brachialis and forearms'],
    repRange: [10, 15], restSec: 60, rir: 2
  },
  // TRICEPS
  tricep_pushdown: {
    name: 'Tricep Pushdown', muscleGroup: 'triceps', secondary: [],
    equipment: ['cable'], isCompound: false, difficulty: 'beginner',
    instructions: ['Push rope/bar down until arms straight', 'Squeeze triceps at bottom', 'Control the return'],
    homeAlternative: 'dips',
    repRange: [10, 15], restSec: 60, rir: 2
  },
  skull_crusher: {
    name: 'Skull Crusher', muscleGroup: 'triceps', secondary: [],
    equipment: ['barbell', 'dumbbell', 'bench'], isCompound: false, difficulty: 'intermediate',
    instructions: ['Lower bar/dumbbells to forehead', 'Press back up keeping elbows in', 'Focus on tricep stretch'],
    repRange: [10, 14], restSec: 60, rir: 2
  },
  dips: {
    name: 'Dips', muscleGroup: 'triceps', secondary: ['chest', 'shoulders'],
    equipment: ['bodyweight'], isCompound: true, difficulty: 'intermediate',
    instructions: ['Lower body until arms at 90°', 'Press back up fully', 'Lean slightly forward for chest focus'],
    repRange: [8, 15], restSec: 90, rir: 2
  },
  // QUADS
  squat: {
    name: 'Barbell Back Squat', muscleGroup: 'quads', secondary: ['hamstrings', 'glutes'],
    equipment: ['barbell'], isCompound: true, difficulty: 'intermediate',
    instructions: ['Bar on traps, squat to parallel', 'Knees track toes', 'Drive through heels to stand'],
    homeAlternative: 'goblet_squat',
    repRange: [6, 12], restSec: 150, rir: 2
  },
  goblet_squat: {
    name: 'Goblet Squat', muscleGroup: 'quads', secondary: ['glutes', 'core'],
    equipment: ['dumbbell'], isCompound: true, difficulty: 'beginner',
    instructions: ['Hold dumbbell at chest', 'Squat deep between knees', 'Drive up through heels'],
    repRange: [10, 15], restSec: 90, rir: 2
  },
  leg_press: {
    name: 'Leg Press', muscleGroup: 'quads', secondary: ['glutes'],
    equipment: ['machine'], isCompound: true, difficulty: 'beginner',
    instructions: ['Feet shoulder-width on platform', 'Lower until 90°', 'Press through heels'],
    homeAlternative: 'goblet_squat',
    repRange: [10, 15], restSec: 90, rir: 2
  },
  leg_extension: {
    name: 'Leg Extension', muscleGroup: 'quads', secondary: [],
    equipment: ['machine'], isCompound: false, difficulty: 'beginner',
    instructions: ['Extend legs fully', 'Squeeze quads at top', 'Control descent'],
    repRange: [12, 15], restSec: 60, rir: 2
  },
  lunge: {
    name: 'Walking Lunge', muscleGroup: 'quads', secondary: ['hamstrings', 'glutes'],
    equipment: ['bodyweight', 'dumbbell'], isCompound: true, difficulty: 'beginner',
    instructions: ['Step forward, lower back knee', 'Keep front shin vertical', 'Drive through front heel'],
    repRange: [10, 15], restSec: 75, rir: 2
  },
  // HAMSTRINGS
  romanian_deadlift: {
    name: 'Romanian Deadlift', muscleGroup: 'hamstrings', secondary: ['glutes', 'back'],
    equipment: ['barbell', 'dumbbell'], isCompound: true, difficulty: 'intermediate',
    instructions: ['Hinge at hips, soft knees', 'Lower bar to mid-shin', 'Feel hamstring stretch', 'Drive hips forward to stand'],
    repRange: [8, 12], restSec: 120, rir: 2
  },
  leg_curl: {
    name: 'Lying Leg Curl', muscleGroup: 'hamstrings', secondary: [],
    equipment: ['machine'], isCompound: false, difficulty: 'beginner',
    instructions: ['Curl heels to glutes', 'Squeeze hamstrings at top', 'Lower with control'],
    homeAlternative: 'nordic_curl',
    repRange: [10, 15], restSec: 75, rir: 2
  },
  // GLUTES
  hip_thrust: {
    name: 'Barbell Hip Thrust', muscleGroup: 'glutes', secondary: ['hamstrings'],
    equipment: ['barbell', 'bench'], isCompound: true, difficulty: 'intermediate',
    instructions: ['Shoulders on bench, bar on hips', 'Drive hips to ceiling', 'Squeeze glutes at top'],
    homeAlternative: 'glute_bridge',
    repRange: [10, 15], restSec: 90, rir: 2
  },
  glute_bridge: {
    name: 'Glute Bridge', muscleGroup: 'glutes', secondary: ['hamstrings'],
    equipment: ['bodyweight'], isCompound: true, difficulty: 'beginner',
    instructions: ['Lie on back, feet flat', 'Drive hips up squeezing glutes', 'Hold 1-2 seconds at top'],
    repRange: [15, 20], restSec: 60, rir: 2
  },
  // CALVES
  calf_raise: {
    name: 'Calf Raise', muscleGroup: 'calves', secondary: [],
    equipment: ['machine', 'bodyweight'], isCompound: false, difficulty: 'beginner',
    instructions: ['Rise on toes as high as possible', 'Hold briefly at top', 'Lower fully for stretch'],
    repRange: [15, 25], restSec: 45, rir: 2
  },
  // CORE
  plank: {
    name: 'Plank', muscleGroup: 'core', secondary: [],
    equipment: ['bodyweight'], isCompound: false, difficulty: 'beginner',
    instructions: ['Forearms on floor, body straight', 'Squeeze core and glutes', 'Hold for time'],
    repRange: [30, 60], restSec: 60, rir: 2
  },
  crunch: {
    name: 'Crunch', muscleGroup: 'core', secondary: [],
    equipment: ['bodyweight'], isCompound: false, difficulty: 'beginner',
    instructions: ['Curl shoulders off floor', 'Exhale and squeeze at top', 'Do not pull neck'],
    repRange: [15, 25], restSec: 45, rir: 2
  },
  hanging_knee_raise: {
    name: 'Hanging Knee Raise', muscleGroup: 'core', secondary: [],
    equipment: ['pull_up_bar'], isCompound: false, difficulty: 'intermediate',
    instructions: ['Hang from bar', 'Bring knees to chest', 'Control the descent'],
    repRange: [10, 20], restSec: 60, rir: 2
  },/ EXTENDED CHEST
  machine_chest_press: {
    name: 'Machine Chest Press', muscleGroup: 'chest', secondary: ['triceps', 'shoulders'],
    equipment: ['machine'], isCompound: true, difficulty: 'beginner',
    instructions: ['Sit with back flat against pad', 'Press handles forward', 'Control the return'],
    repRange: [10, 15], restSec: 60, rir: 2
  },
  pec_deck: {
    name: 'Pec Deck Machine', muscleGroup: 'chest', secondary: [],
    equipment: ['machine'], isCompound: false, difficulty: 'beginner',
    instructions: ['Keep elbows slightly bent', 'Squeeze chest at the center', 'Control the stretch'],
    repRange: [12, 15], restSec: 60, rir: 1
  },
  decline_bench_press: {
    name: 'Decline Bench Press', muscleGroup: 'chest', secondary: ['triceps'],
    equipment: ['barbell', 'bench'], isCompound: true, difficulty: 'intermediate',
    instructions: ['Lie on decline bench', 'Lower bar to lower chest', 'Press up'],
    repRange: [8, 12], restSec: 90, rir: 2
  },
  // EXTENDED BACK
  t_bar_row: {
    name: 'T-Bar Row', muscleGroup: 'back', secondary: ['biceps', 'core'],
    equipment: ['barbell'], isCompound: true, difficulty: 'intermediate',
    instructions: ['Straddle the bar', 'Hinge at hips', 'Pull bar to chest'],
    repRange: [8, 12], restSec: 90, rir: 2
  },
  straight_arm_pulldown: {
    name: 'Straight Arm Pulldown', muscleGroup: 'back', secondary: [],
    equipment: ['cable'], isCompound: false, difficulty: 'beginner',
    instructions: ['Keep arms straight', 'Pull bar down to thighs', 'Squeeze lats'],
    repRange: [12, 15], restSec: 60, rir: 2
  },
  // EXTENDED SHOULDERS
  front_raise: {
    name: 'Dumbbell Front Raise', muscleGroup: 'shoulders', secondary: [],
    equipment: ['dumbbell'], isCompound: false, difficulty: 'beginner',
    instructions: ['Raise dumbbells to front shoulder height', 'Control descent'],
    repRange: [12, 15], restSec: 60, rir: 2
  },
  reverse_pec_deck: {
    name: 'Reverse Pec Deck', muscleGroup: 'shoulders', secondary: ['back'],
    equipment: ['machine'], isCompound: false, difficulty: 'beginner',
    instructions: ['Face the pad', 'Pull handles back', 'Squeeze rear delts'],
    repRange: [12, 15], restSec: 60, rir: 2
  },
  // EXTENDED LEGS
  hack_squat: {
    name: 'Machine Hack Squat', muscleGroup: 'quads', secondary: ['glutes'],
    equipment: ['machine'], isCompound: true, difficulty: 'intermediate',
    instructions: ['Back flat against pad', 'Lower until knees 90 degrees', 'Push through heels'],
    repRange: [8, 12], restSec: 90, rir: 2
  },
  bulgarian_split_squat: {
    name: 'Bulgarian Split Squat', muscleGroup: 'quads', secondary: ['glutes', 'hamstrings'],
    equipment: ['dumbbell', 'bench'], isCompound: true, difficulty: 'advanced',
    instructions: ['Rear foot elevated on bench', 'Squat down on front leg', 'Keep chest up'],
    repRange: [8, 12], restSec: 90, rir: 2
  },
  seated_leg_curl: {
    name: 'Seated Leg Curl', muscleGroup: 'hamstrings', secondary: [],
    equipment: ['machine'], isCompound: false, difficulty: 'beginner',
    instructions: ['Sit in machine', 'Curl weight down and back', 'Squeeze at bottom'],
    repRange: [12, 15], restSec: 60, rir: 1
  },
  seated_calf_raise: {
    name: 'Seated Calf Raise', muscleGroup: 'calves', secondary: [],
    equipment: ['machine'], isCompound: false, difficulty: 'beginner',
    instructions: ['Sit with pads on knees', 'Raise heels', 'Stretch fully at bottom'],
    repRange: [15, 20], restSec: 45, rir: 1
  },
  // EXTENDED ARMS
  preacher_curl: {
    name: 'Preacher Curl', muscleGroup: 'biceps', secondary: [],
    equipment: ['machine', 'barbell'], isCompound: false, difficulty: 'beginner',
    instructions: ['Rest arms on pad', 'Curl up fully', 'Lower under control'],
    repRange: [10, 15], restSec: 60, rir: 2
  },
  cable_curl: {
    name: 'Cable Bicep Curl', muscleGroup: 'biceps', secondary: [],
    equipment: ['cable'], isCompound: false, difficulty: 'beginner',
    instructions: ['Stand facing cable', 'Curl bar up', 'Constant tension'],
    repRange: [12, 15], restSec: 60, rir: 2
  },
  overhead_tricep_extension: {
    name: 'Overhead Tricep Extension', muscleGroup: 'triceps', secondary: [],
    equipment: ['dumbbell', 'cable'], isCompound: false, difficulty: 'intermediate',
    instructions: ['Hold weight overhead', 'Lower behind head', 'Extend fully'],
    repRange: [10, 15], restSec: 60, rir: 2
  },
  // EXTENDED CORE
  cable_crunch: {
    name: 'Cable Crunch', muscleGroup: 'core', secondary: [],
    equipment: ['cable'], isCompound: false, difficulty: 'intermediate',
    instructions: ['Kneel facing cable', 'Hold rope behind neck', 'Crunch down'],
    repRange: [15, 20], restSec: 60, rir: 2
  },
  ab_wheel_rollout: {
    name: 'Ab Wheel Rollout', muscleGroup: 'core', secondary: [],
    equipment: ['bodyweight'], isCompound: true, difficulty: 'advanced',
    instructions: ['Kneel holding wheel', 'Roll forward keeping core tight', 'Pull back'],
    repRange: [8, 15], restSec: 90, rir: 2
  }
}

// ─── Split Templates ──────────────────────────────────────────

type SplitDay = { label: string; muscles: MuscleGroup[]; exerciseIds: string[] }

function getFullBodyDay(push: boolean): SplitDay {
  return {
    label: 'Full Body',
    muscles: ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'core'],
    exerciseIds: push
      ? ['squat', 'bench_press', 'dumbbell_row', 'overhead_press', 'leg_curl', 'plank']
      : ['goblet_squat', 'dumbbell_press', 'lat_pulldown', 'lateral_raise', 'romanian_deadlift', 'crunch'],
  }
}

function getUpperDay(variation: 'A' | 'B'): SplitDay {
  return {
    label: `Upper Body ${variation}`,
    muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
    exerciseIds: variation === 'A'
      ? ['bench_press', 'lat_pulldown', 'overhead_press', 'cable_row', 'barbell_curl', 'tricep_pushdown']
      : ['incline_press', 'pull_up', 'arnold_press', 'dumbbell_row', 'hammer_curl', 'skull_crusher'],
  }
}

function getLowerDay(variation: 'A' | 'B'): SplitDay {
  return {
    label: `Lower Body ${variation}`,
    muscles: ['quads', 'hamstrings', 'glutes', 'calves'],
    exerciseIds: variation === 'A'
      ? ['squat', 'romanian_deadlift', 'leg_press', 'leg_curl', 'calf_raise']
      : ['goblet_squat', 'hip_thrust', 'lunge', 'leg_extension', 'calf_raise'],
  }
}

function getPPLDay(type: 'push' | 'pull' | 'legs', variation: 'A' | 'B'): SplitDay {
  if (type === 'push') {
    return {
      label: `Push ${variation}`,
      muscles: ['chest', 'shoulders', 'triceps'],
      exerciseIds: variation === 'A'
        ? ['bench_press', 'overhead_press', 'incline_press', 'lateral_raise', 'tricep_pushdown', 'skull_crusher']
        : ['dumbbell_press', 'arnold_press', 'cable_fly', 'face_pull', 'dips', 'tricep_pushdown'],
    }
  }
  if (type === 'pull') {
    return {
      label: `Pull ${variation}`,
      muscles: ['back', 'biceps'],
      exerciseIds: variation === 'A'
        ? ['deadlift', 'lat_pulldown', 'cable_row', 'barbell_curl', 'hammer_curl']
        : ['pull_up', 'dumbbell_row', 'lat_pulldown', 'dumbbell_curl', 'hammer_curl'],
    }
  }
  return {
    label: `Legs ${variation}`,
    muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
    exerciseIds: variation === 'A'
      ? ['squat', 'romanian_deadlift', 'leg_press', 'leg_curl', 'calf_raise', 'plank']
      : ['goblet_squat', 'hip_thrust', 'lunge', 'leg_extension', 'calf_raise', 'hanging_knee_raise'],
  }
}

// ─── Build Workout Days ───────────────────────────────────────

function buildWorkoutDay(
  splitDay: SplitDay,
  dayOfWeek: number,
  profile: UserProfile,
  useHome: boolean
): WorkoutDay {
  const isHome = useHome || profile.trainingLocation === 'home'
  
  const exercises: PlannedExercise[] = splitDay.exerciseIds
    .map(id => {
      let ex = EXERCISES[id]
      if (!ex) return null
      
      // Check equipment compatibility for home
      if (isHome) {
        const availableEquip = ['bodyweight', ...(profile.availableEquipment || [])]
        const hasEquip = ex.equipment.some(e => availableEquip.includes(e))
        if (!hasEquip && ex.homeAlternative) {
          const altId = ex.homeAlternative
          const alt = EXERCISES[altId]
          if (alt) ex = alt
        }
      }
      
      return {
        exerciseId: id,
        exerciseName: ex.name,
        muscleGroup: ex.muscleGroup,
        sets: ex.isCompound ? 3 : 3,
        repRange: ex.repRange as [number, number],
        restSeconds: ex.restSec,
        rir: ex.rir,
        difficulty: ex.difficulty as any,
      }
    })
    .filter(Boolean) as PlannedExercise[]

  const avgRest = exercises.reduce((a, e) => a + e.restSeconds, 0) / exercises.length
  const estimatedDuration = Math.round(
    exercises.reduce((a, e) => a + (e.sets * (e.repRange[1] * 3 + e.restSeconds)), 0) / 60
  )

  return {
    dayLabel: splitDay.label,
    dayOfWeek,
    muscleGroups: splitDay.muscles,
    exercises,
    estimatedDurationMin: Math.min(estimatedDuration, 90),
  }
}

// ─── Main Workout Plan Generator ─────────────────────────────

export function generateWorkoutPlan(profile: UserProfile): WorkoutPlan {
  const days = profile.trainingDays.length > 0 ? profile.trainingDays : [1, 2, 3, 4, 5, 6, 0]
  const numDays = days.length

  const workoutDays: WorkoutDay[] = days.map((dayOfWeek) => {
    // Provide a simple label based on day of week
    const labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    return {
      dayLabel: `${labels[dayOfWeek]} Workout`,
      dayOfWeek,
      muscleGroups: [],
      exercises: [],
      estimatedDurationMin: 0,
    }
  })

  return {
    id: `workout_${Date.now()}`,
    userId: profile.id,
    splitName: 'Manual Plan',
    days: workoutDays,
    daysPerWeek: numDays,
    goal: profile.fitnessGoal,
    generatedAt: new Date().toISOString(),
  }
}

export function getAlternatives(exerciseId: string, limit: number = 3): { id: string; name: string; equipment: string[]; difficulty: string; muscleGroup: string }[] {
  const original = EXERCISES[exerciseId]
  if (!original) return []

  const alternatives = Object.entries(EXERCISES)
    .filter(([id, ex]) => 
      id !== exerciseId && 
      (ex.muscleGroup === original.muscleGroup || ex.secondary.includes(original.muscleGroup))
    )
    .map(([id, ex]) => ({
      id,
      name: ex.name,
      equipment: ex.equipment,
      difficulty: ex.difficulty,
      muscleGroup: ex.muscleGroup
    }))
  
  // Simple scoring: same muscle group > same equipment > same difficulty
  alternatives.sort((a, b) => {
    let scoreA = 0
    let scoreB = 0
    
    if (a.muscleGroup === original.muscleGroup) scoreA += 10
    if (b.muscleGroup === original.muscleGroup) scoreB += 10
    
    const overlapEquipA = a.equipment.filter(eq => original.equipment.includes(eq)).length
    const overlapEquipB = b.equipment.filter(eq => original.equipment.includes(eq)).length
    scoreA += overlapEquipA
    scoreB += overlapEquipB
    
    if (a.difficulty === original.difficulty) scoreA += 2
    if (b.difficulty === original.difficulty) scoreB += 2
    
    return scoreB - scoreA
  })

  return alternatives.slice(0, limit)
}

export { EXERCISES }
