import { useVybeStore } from '@/store/vybeStore';
import { Mic, X, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useEffect, useRef } from 'react';


/**
 * Global VYBE overlay handling voice input, processing, and confirmation.
 * It is rendered once at the app root and reacts to the Vybe store state.
 */
export function VYBEOverlay() {
  const {
    listening,
    processing,
    stage,
    result,
    error,
    context,
    setError,
    setStage,
    markCompleted,
    reset,
  } = useVybeStore();

  // Speech API is now handled synchronously by the button's click handler
  // to comply with mobile browser security requirements.

  // Handle Confirm actions based on intent
  const handleConfirm = async () => {
    if (!result) return

    setStage('confirmation')

    try {
      if (result.intent === 'LOG_FOOD') {
        throw new Error(
          'Food nutrition is not resolved yet. VYBE will not log unknown nutrition as zero.'
        )
      }

      if (result.intent === 'LOG_WORKOUT') {
        const { useWorkoutSessionStore } = await import('@/store/workoutSessionStore')
        const ws = useWorkoutSessionStore.getState()
        const session = ws.session

        if (!session || session.exercises.length <= ws.currentExerciseIndex) {
          throw new Error('No active workout exercise is available for this voice action.')
        }

        const exercise = session.exercises[ws.currentExerciseIndex]
        ws.addSet(exercise.instanceId)

        const setId = exercise.sets[exercise.sets.length - 1]?.setId
        if (!setId) {
          throw new Error('Unable to create the workout set.')
        }

        ws.updateSet(exercise.instanceId, setId, {
          weightKg: result.weight,
          reps: result.reps,
        })
        ws.completeSet(exercise.instanceId, setId)

        markCompleted()
        return
      }

      throw new Error('This voice command is not actionable yet.')
    } catch (error: any) {
      setError(error?.message ?? 'The action could not be completed.')
    }
  }

  if (stage === 'idle' && !error) return null;

  return (
    <AnimatePresence>
      {(listening || processing || result || error) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <div className="glass-panel w-11/12 max-w-md p-6 rounded-xl shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading font-bold text-white">VYBE</h2>
              <button onClick={reset} className="p-2 hover:bg-white/10 rounded-full">
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Body */}
            {error && (
              <p className="text-red-400 mb-4">{error}</p>
            )}
            {(stage === 'transcribing' || stage === 'thinking') && (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin text-white" />
                <span className="text-white">
                  {stage === 'transcribing' ? 'Transcribing…' : 'Thinking…'}
                </span>
              </div>
            )}

            {stage === 'listening' && !error && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-accent text-black animate-pulse">
                  <Mic size={32} />
                </div>
                <p className="text-white">Listening… Speak now</p>
              </div>
            )}

            {stage === 'response' && !result && (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin text-white" />
                <span className="text-white">Preparing response…</span>
              </div>
            )}

            {stage === 'completed' && (
              <div className="flex flex-col items-center gap-2 py-4">
                <Check size={32} className="text-accent" />
                <p className="text-white font-medium">Completed</p>
                <p className="text-white/60 text-sm">Your action was saved successfully.</p>
              </div>
            )}
            {result && stage !== 'completed' && result.intent === 'UNKNOWN' ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-4 text-center"
              >
                <p className="text-lg font-medium text-white">I didn't catch that</p>
                <p className="text-sm text-white/60">
                  Try saying what you want to log, such as a food or workout.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="min-h-11 rounded-full bg-white/10 px-6 text-sm font-medium text-white transition-colors hover:bg-white/15"
                >
                  Try Again
                </button>
              </motion.div>
            ) : result && stage !== 'completed' ? (
              <>
                <div className="mb-3">
                  <p className="text-xs uppercase tracking-wider text-white/40">Suggested action</p>
                  <p className="text-white font-medium">Review before confirming</p>
                </div>
                {result.intent === 'LOG_FOOD' && !context?.mealSlot && (
                  <div className="space-y-2 mb-4">
                    <label className="text-white">Select Meal Slot:</label>
                    <select
                      className="w-full p-2 bg-white/5 text-white rounded"
                      onChange={(e) => {
                        const slot = e.target.value as any;
                        useVybeStore.getState().startListening({ mealSlot: slot });
                      }}
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="snack">Snack</option>
                      <option value="dinner">Dinner</option>
                      <option value="pre_workout">Pre‑Workout</option>
                      <option value="post_workout">Post‑Workout</option>
                    </select>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-white">Detected intent: <span className="font-medium">{result.intent}</span></p>
                  {result.intent === 'LOG_FOOD' && (
                    <div className="space-y-2">
                      <p className="text-white">Food: {result.foodName}</p>
                      <p className="text-white">Quantity: {result.quantity} {result.unit}</p>
                    </div>
                  )}
                  {result.intent === 'LOG_WORKOUT' && (
                    <div className="space-y-2">
                      <p className="text-white">Exercise: {result.exerciseName}</p>
                      <p className="text-white">Sets: {result.sets}, Reps: {result.reps}, Weight: {result.weight} {result.weightUnit}</p>
                    </div>
                  )}
                  <div className="flex gap-4 mt-4 justify-end">
                    <button
                      onClick={reset}
                      className="px-4 py-2 bg-white/5 text-white rounded hover:bg-white/10 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirm}
                      className="px-4 py-2 bg-accent text-black rounded hover:bg-accent/90 transition"
                    >
                      <Check size={16} className="inline mr-1" /> Confirm Action
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
