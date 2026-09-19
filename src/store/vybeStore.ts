import { create } from 'zustand';

// Non-persisted global reference for the Speech API (browser requirement for sync start)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let globalRecognition: any = null;

export const initRecognition = () => {
  if (!globalRecognition && (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window))) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    globalRecognition = new SpeechRecognition();
    globalRecognition.lang = 'en-US';
    globalRecognition.interimResults = false;
    globalRecognition.maxAlternatives = 1;
  }
  return globalRecognition;
};

// Types for VYBE parsing results
export type VybeIntent = 'LOG_FOOD' | 'LOG_WORKOUT' | 'UNKNOWN';

export interface VybeResult {
  intent: VybeIntent;
  // Food payload
  foodName?: string;
  quantity?: number;
  unit?: string;
  // Workout payload
  exerciseName?: string;
  sets?: number;
  reps?: number;
  weight?: number;
  weightUnit?: string;
  // Confidence score (0-1)
  confidence?: number;
}

// Context tells VYBE where the parsed result should be stored
export interface VybeContext {
  // Meal slot for food logging (e.g., 'breakfast', 'lunch')
  mealSlot?: import('@/types').MealSlot;
  // Optional label for workout sessions
  workoutLabel?: string;
}

export interface VybeState {
  listening: boolean;
  processing: boolean;
  result: VybeResult | null;
  error: string | null;
  context: VybeContext | null;
  startListening: (ctx?: VybeContext) => void;
  stopListening: () => void;
  setProcessing: (processing: boolean) => void;
  setResult: (result: VybeResult) => void;
  setError: (msg: string) => void;
  reset: () => void;
}

export const useVybeStore = create<VybeState>((set) => ({
  listening: false,
  processing: false,
  result: null,
  error: null,
  context: null,
  startListening: (ctx) => set({ listening: true, error: null, result: null, context: ctx ?? null }),
  stopListening: () => set({ listening: false, context: null }),
  setProcessing: (processing) => set({ processing }),
  setResult: (result) => set({ result, processing: false, listening: false }),
  setError: (msg) => set({ error: msg, processing: false, listening: false, context: null }),
  reset: () => set({ listening: false, processing: false, result: null, error: null, context: null }),
}));
