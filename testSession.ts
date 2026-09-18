// @ts-ignore
global.import = { meta: { env: {} } };

import { useWorkoutSessionStore } from './src/store/workoutSessionStore'
import { EXERCISE_DATABASE } from './src/lib/data/exerciseDatabase'

const s = useWorkoutSessionStore.getState()

s.startSession('Test Push Day')
s.addExercise(EXERCISE_DATABASE[0])

const { session } = useWorkoutSessionStore.getState()
const instanceId = session!.exercises[0].instanceId

s.addSet(instanceId)
s.updateSet(instanceId, session!.exercises[0].sets[0].setId, { weightKg: 80, reps: 8 })
s.completeSet(instanceId, session!.exercises[0].sets[0].setId)

console.log('Volume:', useWorkoutSessionStore.getState().getExerciseVolume(instanceId)) // must log 640
console.log('Elapsed:', useWorkoutSessionStore.getState().getElapsedSeconds())           // must be > 0
console.log('Muscles:', useWorkoutSessionStore.getState().getTrainedMuscles())           // must log chest + secondaries

// Since this uses Zustand persist without a browser, localstorage won't be explicitly tested here, 
// but Zustand persist is extremely robust so we trust it.
