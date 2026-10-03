import { create } from 'zustand';

// Speech API logic removed in favor of MediaRecorder flow.

// Types for VYBE parsing results
export type VybeIntent = 'LOG_FOOD' | 'LOG_WORKOUT' | 'UNKNOWN';

export type VybeStage =
  | 'idle'
  | 'listening'
  | 'transcribing'
  | 'thinking'
  | 'response'
  | 'suggested_action'
  | 'confirmation'
  | 'completed';

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
  stage: VybeStage;
  result: VybeResult | null;
  error: string | null;
  context: VybeContext | null;
  startListening: (ctx?: VybeContext) => void;
  stopListening: () => void;
  setStage: (stage: VybeStage) => void;
  setProcessing: (processing: boolean) => void;
  setResult: (result: VybeResult) => void;
  setError: (msg: string) => void;
  markCompleted: () => void;
  reset: () => void;
}

export const useVybeStore = create<VybeState>((set) => ({
  listening: false,
  processing: false,
  stage: 'idle',
  result: null,
  error: null,
  context: null,

  startListening: (ctx) =>
    set({
      listening: true,
      processing: false,
      stage: 'listening',
      error: null,
      result: null,
      context: ctx ?? null,
    }),

  stopListening: () =>
    set({
      listening: false,
      processing: false,
      stage: 'idle',
      context: null,
    }),

  setStage: (stage) =>
    set({
      stage,
      listening: stage === 'listening',
      processing: stage === 'transcribing' || stage === 'thinking',
    }),

  setProcessing: (processing) =>
    set({
      processing,
      listening: false,
      stage: processing ? 'thinking' : 'response',
    }),

  setResult: (result) =>
    set({
      result,
      processing: false,
      listening: false,
      stage: 'suggested_action',
    }),

  setError: (msg) =>
    set({
      error: msg,
      processing: false,
      listening: false,
      stage: 'idle',
      context: null,
    }),

  markCompleted: () =>
    set({
      listening: false,
      processing: false,
      stage: 'completed',
    }),

  reset: () =>
    set({
      listening: false,
      processing: false,
      stage: 'idle',
      result: null,
      error: null,
      context: null,
    }),
}));
