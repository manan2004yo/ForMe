import { Mic, X } from 'lucide-react';
import { useVybeStore, VybeContext, VybeState } from '@/store/vybeStore';
import { clsx } from 'clsx';
import React from 'react';

// ─── Shared recognition startup logic ────────────────────────
// Exported so call sites that have a direct user-gesture (e.g. AddFoodSheet)
// can invoke recognition synchronously without indirection through DOM events.

export async function startVybeListening(
  context: VybeContext | undefined,
  store: Pick<VybeState, 'startListening' | 'setProcessing' | 'setResult' | 'setError' | 'reset'>
) {
  const { startListening, setProcessing, setResult, setError, reset } = store

  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    setError('Voice recording is not supported on this browser.')
    return
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    const preferredMimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
    ]
    const mimeType =
      preferredMimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || ''

    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream)

    const chunks: BlobPart[] = []

    recorder.ondataavailable = event => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }

    recorder.onstop = async () => {
      stream.getTracks().forEach(track => track.stop())

      const audioBlob = new Blob(chunks, {
        type: recorder.mimeType || mimeType || 'audio/webm',
      })

      if (audioBlob.size === 0) {
        setError('No speech detected. Please try again.')
        return
      }

      useVybeStore.getState().setStage('transcribing')
      setProcessing(true)

      try {
        const audioBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            const result = reader.result
            if (typeof result !== 'string') {
              reject(new Error('Failed to read recorded audio.'))
              return
            }
            const commaIndex = result.indexOf(',')
            resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result)
          }
          reader.onerror = () => reject(new Error('Failed to read recorded audio.'))
          reader.readAsDataURL(audioBlob)
        })

        const transcriptionResponse = await fetch('/api/transcribe-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64,
            mimeType: audioBlob.type || mimeType || 'audio/webm',
          }),
        })

        const transcriptionText = await transcriptionResponse.text()
        if (!transcriptionText) {
          throw new Error('Transcription API returned an empty response.')
        }

        let transcriptionData: { transcript?: string; error?: string }
        try {
          transcriptionData = JSON.parse(transcriptionText)
        } catch {
          throw new Error('Transcription API returned invalid data format.')
        }

        if (!transcriptionResponse.ok) {
          throw new Error(transcriptionData.error ?? 'Transcription failed.')
        }

        const transcript = transcriptionData.transcript?.trim()
        if (!transcript) {
          throw new Error('No speech detected. Please try again.')
        }

        useVybeStore.getState().setStage('thinking')

        const parseResponse = await fetch('/api/parse-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript }),
        })

        const parseText = await parseResponse.text()
        if (!parseText) {
          throw new Error('Voice parser returned an empty response.')
        }

        let parseData
        try {
          parseData = JSON.parse(parseText)
        } catch {
          throw new Error('Voice parser returned invalid data format.')
        }

        if (!parseResponse.ok) {
          throw new Error(parseData.error ?? 'Voice parsing failed.')
        }

        setResult(parseData)
      } catch (error: any) {
        setError(error?.message ?? 'Voice input failed. Please try again.')
      } finally {
        setProcessing(false)
      }
    }

    recorder.onerror = () => {
      stream.getTracks().forEach(track => track.stop())
      setError('Voice recording failed. Please try again.')
    }

    startListening(context)
    recorder.start()
    ;(window as Window & { __formeVybeRecorder?: MediaRecorder }).__formeVybeRecorder = recorder
  } catch (error: any) {
    if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
      setError('Microphone access is blocked. Please allow microphone permissions in your browser settings.')
    } else {
      setError(error?.message ?? 'Failed to start microphone. Please try again.')
    }
  }
}

// ─── VYBEMicButton component ──────────────────────────────────

export function VYBEMicButton({ context }: { context?: VybeContext }) {
  const { listening, startListening, stopListening, setProcessing, setResult, setError, reset } = useVybeStore()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (listening) {
      const win = window as Window & { __formeVybeRecorder?: MediaRecorder }
      if (win.__formeVybeRecorder) {
        if (win.__formeVybeRecorder.state !== 'inactive') {
          win.__formeVybeRecorder.stop()
        }
        win.__formeVybeRecorder = undefined
      }
      stopListening()
      reset() // Reset explicitly clears out any error/result state when manual cancel is clicked
    } else {
      void startVybeListening(context, { startListening, setProcessing, setResult, setError, reset })
    }
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
