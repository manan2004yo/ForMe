import { auth } from '@/lib/firebase/config'
import { useVybeStore } from '@/store/vybeStore';
import { cancelRecording, stopRecording } from '@/components/vybe/VYBEMicButton';
import { Mic, Square, X, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import type { ResolvedScannedProduct } from '@/lib/services/barcodeProductService';

/**
 * Global VYBE overlay — pure transaction / confirmation UI.
 * Rendered once at the app root. Reacts to vybeStore stage.
 *
 * Changes from audit:
 *  - X / cancel calls cancelRecording() to actually stop the MediaRecorder (C3 fix).
 *  - Listening state exposes a real Stop button that calls stopRecording().
 *  - Removed dead 'response' and 'confirmation' stage UI branches.
 *  - Removed dead meal-slot selector that called startListening without recording.
 *  - Removed unused clsx, useRef imports.
 *  - LOG_FOOD confirmation clearly communicates the feature is not yet available
 *    rather than showing a misleading "Confirm Action" button that always errors.
 *  - 'completed' auto-dismisses after 1.8 s via useEffect.
 */
export function VYBEOverlay() {
  const { stage, result, error, markCompleted, reset } = useVybeStore();
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-dismiss on completed stage (audit M.5 — no auto-reset existed before).
  useEffect(() => {
    if (stage === 'completed') {
      dismissTimerRef.current = setTimeout(() => {
        // Only reset if we're still in completed — a rapid new session could have started.
        if (useVybeStore.getState().stage === 'completed') {
          reset()
        }
      }, 1800)
    }
    return () => {
      if (dismissTimerRef.current !== null) {
        clearTimeout(dismissTimerRef.current)
        dismissTimerRef.current = null
      }
    }
  }, [stage, reset])

  // ── Confirm action ──────────────────────────────────────────

  const handleConfirm = async () => {
    if (!result) return

    try {
      if (result.intent === 'LOG_FOOD') {
        const store = useVybeStore.getState()
        store.setStage('thinking')

        const q = `${result.quantity || ''} ${result.unit || ''} ${result.foodName || ''}`.trim()

        const response = await fetch('/api/estimate-nutrition', {
          method: 'POST',
          headers: {
        'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: q, mode: 'meal' }),
        })
        const data = await response.json()

        if (!response.ok || data.status !== 'ok' || !data.estimate) {
          throw new Error(data?.message || 'Could not estimate nutrition. Please log this manually.')
        }

        const estimate = data.estimate
        const portionGrams = typeof estimate.portionGrams === 'number' && estimate.portionGrams > 0 ? estimate.portionGrams : null

        if (!portionGrams) {
          throw new Error('Could not estimate portion size. Please log this manually.')
        }

        const n = estimate.nutrients
        const per100g = {
          calories: typeof n.calories === 'number' ? (n.calories / portionGrams) * 100 : 0,
          protein: typeof n.protein === 'number' ? (n.protein / portionGrams) * 100 : 0,
          carbs: typeof n.carbs === 'number' ? (n.carbs / portionGrams) * 100 : 0,
          fat: typeof n.fat === 'number' ? (n.fat / portionGrams) * 100 : 0,
          fiber: typeof n.fiber === 'number' ? (n.fiber / portionGrams) * 100 : 0,
          ...(typeof n.sugar === 'number' ? { sugar: (n.sugar / portionGrams) * 100 } : {}),
          ...(typeof n.sodium === 'number' ? { sodium: (n.sodium / portionGrams) * 100 } : {}),
        }

        const unknownFields: string[] = []
        if (n.calories === null) unknownFields.push('calories')
        if (n.protein === null) unknownFields.push('protein')
        if (n.carbs === null) unknownFields.push('carbs')
        if (n.fat === null) unknownFields.push('fat')
        if (n.fiber === null) unknownFields.push('fiber')
        if (n.sugar === null) unknownFields.push('sugar')
        if (n.sodium === null) unknownFields.push('sodium')

        const trustConfidence: 'medium' | 'low' = estimate.confidence === 'low' ? 'low' : 'medium'

        const product: ResolvedScannedProduct = {
          barcode: `vybe_${Date.now()}`,
          name: estimate.name || q,
          brand: null,
          per100g,
          servingSizeG: portionGrams,
          dataSource: 'estimated',
          imageUrl: null,
          trust: {
            tier: 'ai_estimate',
            label: 'AI Estimate',
            confidence: trustConfidence,
            consistent: estimate.consistent,
          },
          unknownFields,
        }

        // Handoff to EatDashboard -> BarcodeResultSheet
        store.setResolvedFood(product)
        return
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
    } catch (err: any) {
      useVybeStore.getState().setError(err?.message ?? 'The action could not be completed.')
    }
  }

  // ── Visibility guard ────────────────────────────────────────

  if (stage === 'idle' && !error) return null

  const isVisible = stage !== 'idle' || !!error

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="vybe-overlay"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <div className="glass-panel w-11/12 max-w-md p-6 rounded-xl shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading font-bold text-white">VYBE</h2>
              {/* C3 fix: X cancels the active recording, not just Zustand state. */}
              <button
                onClick={cancelRecording}
                className="p-2 hover:bg-white/10 rounded-full"
                aria-label="Cancel voice input"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-400 mb-4">{error}</p>
            )}

            {/* Listening — real Stop button */}
            {stage === 'listening' && !error && (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-accent text-black animate-pulse">
                  <Mic size={32} />
                </div>
                <p className="text-white">Listening… Speak now</p>
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 min-h-11 rounded-full bg-red-500/20 border border-red-500/40 px-6 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/30"
                  aria-label="Stop recording"
                >
                  <Square size={14} fill="currentColor" />
                  Stop
                </button>
              </div>
            )}

            {/* Transcribing / Thinking */}
            {(stage === 'transcribing' || stage === 'thinking') && (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin text-white" />
                <span className="text-white">
                  {stage === 'transcribing' ? 'Transcribing…' : 'Thinking…'}
                </span>
              </div>
            )}

            {/* Completed */}
            {stage === 'completed' && (
              <div className="flex flex-col items-center gap-2 py-4">
                <Check size={32} className="text-accent" />
                <p className="text-white font-medium">Completed</p>
                <p className="text-white/60 text-sm">Your action was saved successfully.</p>
              </div>
            )}

            {/* Suggested action — UNKNOWN intent */}
            {result && stage === 'suggested_action' && result.intent === 'UNKNOWN' && (
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
                  onClick={cancelRecording}
                  className="min-h-11 rounded-full bg-white/10 px-6 text-sm font-medium text-white transition-colors hover:bg-white/15"
                >
                  Try Again
                </button>
              </motion.div>
            )}

            {/* Suggested action — LOG_FOOD */}
            {result && stage === 'suggested_action' && result.intent === 'LOG_FOOD' && (
              <>
                <div className="mb-3">
                  <p className="text-xs uppercase tracking-wider text-white/40">Suggested action</p>
                  <p className="text-white font-medium">Review before confirming</p>
                </div>
                <div className="space-y-3">
                  <p className="text-white">Food: <span className="font-medium">{result.foodName}</span></p>
                  <p className="text-white">
                    {result.quantity != null && <>Quantity: {result.quantity} {result.unit}</>}
                  </p>
                  <div className="flex gap-4 mt-4 justify-end">
                    <button
                      onClick={cancelRecording}
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
            )}

            {/* Suggested action — LOG_WORKOUT */}
            {result && stage === 'suggested_action' && result.intent === 'LOG_WORKOUT' && (
              <>
                <div className="mb-3">
                  <p className="text-xs uppercase tracking-wider text-white/40">Suggested action</p>
                  <p className="text-white font-medium">Review before confirming</p>
                </div>
                <div className="space-y-3">
                  <p className="text-white">Exercise: <span className="font-medium">{result.exerciseName}</span></p>
                  <p className="text-white">
                    {result.sets != null && <>Sets: {result.sets}, </>}
                    {result.reps != null && <>Reps: {result.reps}, </>}
                    {result.weight != null && <>Weight: {result.weight} {result.weightUnit}</>}
                  </p>
                  <div className="flex gap-4 mt-4 justify-end">
                    <button
                      onClick={cancelRecording}
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
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
