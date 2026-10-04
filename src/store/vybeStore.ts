import { create } from 'zustand';

// ── Types ─────────────────────────────────────────────────────

export type VybeIntent = 'LOG_FOOD' | 'LOG_WORKOUT' | 'UNKNOWN';

/**
 * Clean 6-stage state machine.
 * Removed dead 'response' and 'confirmation' stages (audit finding C5 / dead code J3).
 */
export type VybeStage =
  | 'idle'
  | 'listening'
  | 'transcribing'
  | 'thinking'
  | 'suggested_action'
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

/** Context tells VYBE where the parsed result should be routed. */
export interface VybeContext {
  mealSlot?: import('@/types').MealSlot;
  workoutLabel?: string;
}

export interface VybeState {
  stage: VybeStage;
  result: VybeResult | null;
  error: string | null;
  /**
   * Context is set on startListening and PRESERVED through stopListening.
   * It is only cleared by reset() or setError() (audit fix C1).
   */
  context: VybeContext | null;

  // ── Actions ──────────────────────────────────────────────────
  startListening: (ctx?: VybeContext) => void;
  /**
   * Transitions the stage away from 'listening' without destroying context.
   * The recording controller owns stopping the actual MediaRecorder.
   */
  stopListening: () => void;
  setStage: (stage: VybeStage) => void;
  setResult: (result: VybeResult) => void;
  setError: (msg: string) => void;
  markCompleted: () => void;
  reset: () => void;
}

export const useVybeStore = create<VybeState>((set) => ({
  stage: 'idle',
  result: null,
  error: null,
  context: null,

  startListening: (ctx) =>
    set({
      stage: 'listening',
      error: null,
      result: null,
      context: ctx ?? null,
    }),

  // C1 fix: preserve context so the async pipeline can route the result correctly.
  stopListening: () =>
    set((state) => ({
      stage: state.stage === 'listening' ? 'transcribing' : state.stage,
      // context intentionally NOT cleared here
    })),

  setStage: (stage) => set({ stage }),

  // C5 fix: setResult is the ONLY place that moves stage to 'suggested_action'.
  // No finally-block setProcessing() can overwrite it (setProcessing is removed entirely).
  setResult: (result) =>
    set({
      result,
      stage: 'suggested_action',
    }),

  setError: (msg) =>
    set({
      error: msg,
      stage: 'idle',
      context: null,
    }),

  markCompleted: () => set({ stage: 'completed' }),

  reset: () =>
    set({
      stage: 'idle',
      result: null,
      error: null,
      context: null,
    }),
}));
