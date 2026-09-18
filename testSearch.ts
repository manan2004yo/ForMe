import { searchExercises } from './src/lib/data/exerciseSearch'
import { EXERCISE_DATABASE } from './src/lib/data/exerciseDatabase'

console.log("Total count:", EXERCISE_DATABASE.length)
console.log(searchExercises('cable pushdown')[0]?.name) // must log: "Tricep Pushdown"
console.log(searchExercises('hack')[0]?.name)           // must log: "Hack Squat"
console.log(searchExercises('chest').length)            // must be 8 or more
