import { auth } from '@/lib/firebase/config'
import { Mic, X } from 'lucide-react';
import { useVybeStore, VybeContext } from '@/store/vybeStore';
import { clsx } from 'clsx';
import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// VYBE Shared Recording Controller
//
// This module-level controller is the ONE owner of MediaRecorder state.
// It survives React component unmounts (C2 fix) and prevents stale callbacks
// from reviving the overlay after a cancel (C3 fix).
//
// Rules:
//  • Only one recording can be active at a time. startRecording() is a no-op if
//    a session is already active (double-tap / double-start guard).
//  • Every recording gets a unique sessionId (UUID-lite via crypto).
//  • Every async callback checks its sessionId against the controller's active
//    sessionId before mutating the store. Stale callbacks are silently dropped.
//  • cancelRecording() invalidates the sessionId, stops the recorder, and stops
//    all stream tracks — preventing ANY async callback from making further
//    store mutations.
// ─────────────────────────────────────────────────────────────────────────────

interface RecordingSession {
  sessionId: string;
  recorder: MediaRecorder;
  stream: MediaStream;
  chunks: BlobPart[];
  actualMimeType: string;
}

let activeSession: RecordingSession | null = null;

/** Returns a collision-resistant session ID without depending on uuid package. */
function newSessionId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/** Stop all tracks on a stream safely. */
function stopStream(stream: MediaStream): void {
  try {
    stream.getTracks().forEach((t) => t.stop())
  } catch {
    // ignore
  }
}

/**
 * Determine the best supported MIME type.
 * Normalises video/mp4 → audio/mp4 for browsers (some Safari versions) that
 * report video/mp4 for audio-only recordings.
 */
function selectMimeType(): string {
  const preferred = [
    'audio/mp4',
    'audio/mp4;codecs="mp4a.40.2"',
    'audio/webm;codecs=opus',
    'audio/webm',
  ]
  return preferred.find((t) => MediaRecorder.isTypeSupported(t)) ?? ''
}

/**
 * Normalise a raw recorder MIME type to a base type accepted by both the
 * backend whitelist and Gemini.
 * e.g. "audio/mp4;codecs=mp4a.40.2" → "audio/mp4"
 *      "video/mp4"                   → "audio/mp4"
 */
function normaliseMimeForApi(raw: string): string {
  const base = raw.split(';')[0].trim().toLowerCase()
  if (base === 'video/mp4') return 'audio/mp4'
  return base
}

// ── Public controller API ─────────────────────────────────────

/**
 * Start a new VYBE recording session.
 * Silently returns if a session is already active.
 */
export async function startRecording(context?: VybeContext): Promise<void> {
  if (activeSession) {
    console.log('[VYBE-AUDIO] startRecording ignored — session already active:', activeSession.sessionId)
    return
  }

  const store = useVybeStore.getState()

  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    store.setError('Voice recording is not supported on this browser.')
    return
  }

  let stream: MediaStream | undefined

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    const tracks = stream.getAudioTracks()
    console.log(`[VYBE-AUDIO] getUserMedia success, tracks: ${tracks.length}`)
    if (tracks.length > 0) {
      const t = tracks[0]
      console.log(`[VYBE-AUDIO] Track - kind: ${t.kind}, readyState: ${t.readyState}, enabled: ${t.enabled}, muted: ${t.muted}`)
      if (t.getSettings) {
        const s = t.getSettings()
        console.log('[VYBE-AUDIO] Track settings:', { ...s, deviceId: undefined, groupId: undefined })
      }
    }

    const mimeType = selectMimeType()
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream)

    const actualMimeType = recorder.mimeType || mimeType || 'audio/mp4'
    console.log(`[VYBE-AUDIO] MediaRecorder constructed. mimeType: "${recorder.mimeType}", state: "${recorder.state}"`)

    const sessionId = newSessionId()
    const chunks: BlobPart[] = []
    let cumulativeBytes = 0

    const session: RecordingSession = { sessionId, recorder, stream, chunks, actualMimeType }
    activeSession = session

    // ── Event handlers ─────────────────────────────────────────

    recorder.onstart = () => {
      console.log(`[VYBE-AUDIO] onstart fired, recorder.state: "${recorder.state}"`)
    }

    recorder.ondataavailable = (event) => {
      cumulativeBytes += event.data.size
      console.log(
        `[VYBE-AUDIO] ondataavailable - chunk size: ${event.data.size}, ` +
        `type: "${event.data.type}", cumulative chunks: ${chunks.length + 1}, bytes: ${cumulativeBytes}`
      )
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }

    recorder.onstop = async () => {
      console.log(
        `[VYBE-AUDIO] onstop fired, recorder.state: "${recorder.state}", ` +
        `total chunks: ${chunks.length}, total bytes: ${cumulativeBytes}`
      )

      // Always stop stream tracks when the recorder stops.
      stopStream(stream!)

      // Build the blob before any session-ID check — this is cheap and safe.
      const audioBlob = new Blob(chunks, { type: actualMimeType })
      console.log(`[VYBE-AUDIO] final Blob - size: ${audioBlob.size}, type: "${audioBlob.type}"`)

      // ── Session staleness check ───────────────────────────────
      // If cancelRecording() was called, activeSession is null or its ID changed.
      // In either case, do NOT mutate the store — the overlay must stay hidden.
      if (!activeSession || activeSession.sessionId !== sessionId) {
        console.log('[VYBE-AUDIO] onstop: session stale/cancelled, dropping result')
        return
      }

      // Clear the active session reference now that the recorder has stopped.
      activeSession = null

      const { setStage, setError, setResult } = useVybeStore.getState()

      if (audioBlob.size === 0) {
        setError('No audio captured. Please try again.')
        return
      }

      setStage('transcribing')

      // ── Async pipeline — each step re-checks session currency ─
      // (activeSession is already null at this point, so we use the captured
      //  sessionId + a local isCancelled closure instead)
      let cancelled = false
      const checkCancelled = (): boolean => {
        // If the store was reset/errored while we were awaiting, bail out.
        const s = useVybeStore.getState()
        if (s.stage === 'idle' || s.stage === 'listening') {
          cancelled = true
        }
        return cancelled
      }

      try {
        const audioBase64 = await encodeBlob(audioBlob)
        if (checkCancelled()) return

        console.log(`[VYBE-AUDIO] base64 generation complete, length: ${audioBase64.length}`)
        console.log('[VYBE-AUDIO] fetch /api/transcribe-voice executing...')

        // Pass the normalised base MIME type to the backend so Gemini receives
        // a clean string (e.g. "audio/mp4" not "audio/mp4;codecs=mp4a.40.2").
        const apiMimeType = normaliseMimeForApi(actualMimeType || 'audio/mp4')
        const transcriptionResponse = await fetch('/api/transcribe-voice', {
          method: 'POST',
          headers: {
        'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioBase64, mimeType: apiMimeType }),
        })
        console.log(
          `[VYBE-AUDIO] fetch returned - status: ${transcriptionResponse.status}, ` +
          `content-type: "${transcriptionResponse.headers.get('content-type')}"`
        )
        if (checkCancelled()) return

        const transcriptionText = await transcriptionResponse.text()
        console.log(`[VYBE-AUDIO] response text length: ${transcriptionText?.length ?? 0}`)
        if (checkCancelled()) return

        if (!transcriptionText) throw new Error('Transcription API returned an empty response.')

        let transcriptionData: { transcript?: string; error?: string }
        try {
          transcriptionData = JSON.parse(transcriptionText)
        } catch {
          throw new Error('Transcription API returned invalid data format.')
        }

        if (!transcriptionResponse.ok) {
          console.log('[VYBE-AUDIO] API error response shape:', Object.keys(transcriptionData))
          throw new Error(transcriptionData.error ?? 'Transcription failed.')
        }

        const transcript = transcriptionData.transcript?.trim()
        if (!transcript) throw new Error('No speech detected. Please try again.')

        setStage('thinking')
        if (checkCancelled()) return

        const parseResponse = await fetch('/api/parse-voice', {
          method: 'POST',
          headers: {
        'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript }),
        })

        const parseText = await parseResponse.text()
        if (checkCancelled()) return

        if (!parseText) throw new Error('Voice parser returned an empty response.')

        let parseData: any
        try {
          parseData = JSON.parse(parseText)
        } catch {
          throw new Error('Voice parser returned invalid data format.')
        }

        if (!parseResponse.ok) throw new Error(parseData.error ?? 'Voice parsing failed.')

        if (checkCancelled()) return

        // C5 fix: setResult is the final call. There is NO finally block that
        // calls setProcessing(false) and overwrites 'suggested_action'.
        setResult(parseData)
      } catch (err: any) {
        console.log(`[VYBE-AUDIO] pipeline error: ${err?.name} - ${err?.message}`)
        if (!cancelled) {
          setError(err?.message ?? 'Voice input failed. Please try again.')
        }
      }
    }

    recorder.onerror = () => {
      console.log('[VYBE-AUDIO] recorder.onerror fired')
      stopStream(stream!)
      if (activeSession?.sessionId === sessionId) {
        activeSession = null
        useVybeStore.getState().setError('Voice recording failed. Please try again.')
      }
    }

    // ── Start the recording ───────────────────────────────────
    // Update store first so the overlay appears immediately.
    store.startListening(context)

    // 1000ms timeslice forces chunk flushing on every interval — critical for
    // iOS Safari where start() without a timeslice often produces a zero-byte blob.
    console.log('[VYBE-AUDIO] calling recorder.start(1000)')
    recorder.start(1000)
    console.log(`[VYBE-AUDIO] recorder.state immediately after start(): "${recorder.state}"`)

  } catch (err: any) {
    // getUserMedia or MediaRecorder constructor threw.
    console.log(`[VYBE-AUDIO] Error initializing recording: ${err?.name} - ${err?.message}`)
    // Clean up stream if acquired before the error.
    if (stream) stopStream(stream)
    activeSession = null

    const store2 = useVybeStore.getState()
    if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
      store2.setError('Microphone access is blocked. Please allow microphone permissions in your browser settings.')
    } else {
      store2.setError(err?.message ?? 'Failed to start microphone. Please try again.')
    }
  }
}

/**
 * Stop the active recording. Transitions store out of 'listening' without
 * destroying context (C1 fix). The onstop handler owns the rest of the pipeline.
 */
export function stopRecording(): void {
  if (!activeSession) {
    console.log('[VYBE-AUDIO] stopRecording called but no active session')
    return
  }
  const { recorder } = activeSession
  if (recorder.state === 'inactive') {
    console.log('[VYBE-AUDIO] stopRecording: recorder already inactive')
    return
  }
  console.log('[VYBE-AUDIO] stopRecording: calling recorder.stop()')
  // C1 fix: transition stage to 'transcribing', context preserved by new stopListening().
  useVybeStore.getState().stopListening()
  recorder.stop()
  // activeSession is cleared inside onstop after the blob is built.
}

/**
 * Cancel the active recording entirely.
 * Invalidates the session ID, stops the recorder and stream, and resets
 * the store — preventing ANY stale onstop/fetch callback from reviving the overlay (C3 fix).
 */
export function cancelRecording(): void {
  if (!activeSession) {
    useVybeStore.getState().reset()
    return
  }
  console.log('[VYBE-AUDIO] cancelRecording: invalidating session', activeSession.sessionId)
  const { recorder, stream } = activeSession
  // Nullify before stop() so the onstop handler's session-ID check fails immediately.
  activeSession = null
  stopStream(stream)
  try {
    if (recorder.state !== 'inactive') recorder.stop()
  } catch {
    // ignore
  }
  useVybeStore.getState().reset()
}

// ── Blob → base64 helper ──────────────────────────────────────

function encodeBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      console.log('[VYBE-AUDIO] FileReader onloadend fired')
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Failed to read recorded audio.'))
        return
      }
      const commaIndex = result.indexOf(',')
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result)
    }
    reader.onerror = () => reject(new Error('Failed to read recorded audio.'))
    reader.readAsDataURL(blob)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// VYBEMicButton component
//
// Public interface is unchanged — <VYBEMicButton context={...} />
// ActiveWorkoutOverlay.tsx does not need to change.
// ─────────────────────────────────────────────────────────────────────────────

export function VYBEMicButton({ context }: { context?: VybeContext }) {
  const stage = useVybeStore((s) => s.stage)
  const listening = stage === 'listening'

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (listening) {
      stopRecording()
    } else if (stage === 'idle') {
      void startRecording(context)
    }
    // Ignore clicks while transcribing/thinking/suggested_action/completed.
  }

  return (
    <button
      onClick={handleClick}
      className={clsx(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-bold outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
        listening ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
      )}
      aria-label="Voice input"
    >
      {listening ? <><X size={14} /> Listening</> : <><Mic size={14} /> VYBE</>}
    </button>
  )
}
