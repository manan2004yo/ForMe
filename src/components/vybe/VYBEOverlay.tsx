import { useVybeStore } from '@/store/vybeStore';
import { Mic, X, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useEffect, useRef } from 'react';
import { useFoodLogStore } from '@/store/foodLogStore';

/**
 * Global VYBE overlay handling voice input, processing, and confirmation.
 * It is rendered once at the app root and reacts to the Vybe store state.
 */
export function VYBEOverlay() {
  const {
    listening,
    processing,
    result,
    error,
    context,
    setProcessing,
    setResult,
    setError,
    reset,
  } = useVybeStore();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Start or stop the Web Speech API when listening flag changes
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser.');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onResult = async (e: any) => {
      const transcript = e.results[0][0].transcript.trim();
      if (!transcript) {
        setError('No speech detected.');
        return;
      }
      setProcessing(true);
      try {
        const response = await fetch('/api/parse-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? 'Parsing failed');
        setResult(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? 'Unexpected error');
      }
    };
    const onEnd = () => {
      // If we already have a result, keep overlay open; otherwise stop listening.
      if (!result) reset();
    };
    const onError = (e: any) => {
      setError(e.error || 'Speech recognition error');
      reset();
    };

    recognition.addEventListener('result', onResult);
    recognition.addEventListener('end', onEnd);
    recognition.addEventListener('error', onError);

    if (listening) {
      try {
        recognition.start();
      } catch (e) {
        // Some browsers require user interaction; ignore start errors.
      }
    } else {
      recognition.stop();
    }

    return () => {
      recognition.removeEventListener('result', onResult);
      recognition.removeEventListener('end', onEnd);
      recognition.removeEventListener('error', onError);
      recognition.stop();
    };
  }, [listening]);

  // Handle Confirm actions based on intent
  const handleConfirm = async () => {
    if (!result) return;
    if (result.intent === 'LOG_FOOD' && context?.mealSlot) {
      const { useAuthStore } = await import('@/store/authStore');
      const uid = useAuthStore.getState().user?.uid || 'demo';
      const item = {
        id: crypto.randomUUID(),
        foodItemId: 'vybe',
        foodName: result.foodName ?? 'Unknown',
        quantity: result.quantity ?? 1,
        unit: (result.unit ?? 'serving') as import('@/types').PortionUnit,
        gramsConsumed: 0,
        confidence: 'high' as const,
        nutrition: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
        },
      };
      await useFoodLogStore.getState().addFoodEntry(uid, context.mealSlot, [item]);
    } else if (result.intent === 'LOG_WORKOUT') {
      const { useWorkoutSessionStore } = await import('@/store/workoutSessionStore');
      const ws = useWorkoutSessionStore.getState();
      const session = ws.session;
      if (session && session.exercises.length > ws.currentExerciseIndex) {
        const exercise = session.exercises[ws.currentExerciseIndex];
        // Add a set then update it with parsed values
        ws.addSet(exercise.instanceId);
        const setId = exercise.sets[exercise.sets.length - 1]?.setId;
        if (setId) {
          ws.updateSet(exercise.instanceId, setId, {
            weightKg: result.weight,
            reps: result.reps,
          });
          ws.completeSet(exercise.instanceId, setId);
        }
      }
    }
    reset();
  };

  if (!listening && !processing && !result && !error) return null;

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
            {processing && (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin text-white" />
                <span className="text-white">Processing…</span>
              </div>
            )}
            {listening && !processing && !result && !error && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-accent text-black animate-pulse">
                  <Mic size={32} />
                </div>
                <p className="text-white">Listening… Speak now</p>
              </div>
            )}
            {result && (
              <>
                {result.intent === 'LOG_FOOD' && !context?.mealSlot && (
                  <div className="space-y-2">
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
                    <Check size={16} className="inline mr-1" /> Confirm
                  </button>
                </div>
              </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
