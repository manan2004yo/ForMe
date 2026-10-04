import { processAudio } from '../lib/aiOrchestrator'

const MAX_AUDIO_BASE64_LENGTH = 12_000_000

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context
    const body = await request.json()

    console.log('[VYBE-AUDIO] Backend received request to /api/transcribe-voice')

    const audioBase64 =
      typeof body?.audioBase64 === 'string' ? body.audioBase64.trim() : ''
    const rawMimeType =
      typeof body?.mimeType === 'string' ? body.mimeType.trim().toLowerCase() : ''

    console.log(`[VYBE-AUDIO] audioBase64 length: ${audioBase64?.length}, original mimeType: "${rawMimeType}"`)

    if (!audioBase64) {
      return new Response(JSON.stringify({ error: 'No audio provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (audioBase64.length > MAX_AUDIO_BASE64_LENGTH) {
      return new Response(JSON.stringify({ error: 'Audio recording is too large' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Strip codec parameters to get the base MIME type.
    // e.g. "audio/mp4;codecs=mp4a.40.2" → "audio/mp4"
    const baseMimeType = rawMimeType.split(';')[0].trim()

    // Normalise video/mp4 → audio/mp4.
    // Some Safari versions report video/mp4 for audio-only MediaRecorder sessions.
    const normalisedMimeType = baseMimeType === 'video/mp4' ? 'audio/mp4' : baseMimeType

    console.log(`[VYBE-AUDIO] normalized baseMimeType: "${normalisedMimeType}"`)

    const allowedMimeTypes = new Set([
      'audio/webm',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
    ])

    if (!allowedMimeTypes.has(normalisedMimeType)) {
      console.log(`[VYBE-AUDIO] Backend rejected mimeType: "${normalisedMimeType}" (raw: "${rawMimeType}")`)
      return new Response(JSON.stringify({ error: 'Unsupported audio format' }), {
        status: 415,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Pass the normalised base MIME type to processAudio so Gemini receives a
    // clean string ("audio/mp4") rather than a codec-qualified string that it
    // may not accept.
    console.log('[VYBE-AUDIO] Calling processAudio...')
    const result = await processAudio(
      env,
      [
        'Transcribe this audio recording for a fitness app.',
        'Return ONLY the words actually spoken by the user as plain text.',
        'Do not summarize, interpret, correct, complete, or invent speech.',
        'Preserve food names, exercise names, quantities, units, numbers, and repetitions exactly as heard.',
        'If speech is unclear, return the best literal transcription of the audible speech rather than guessing the user intent.',
      ].join(' '),
      audioBase64,
      normalisedMimeType
    )
    console.log(`[VYBE-AUDIO] processAudio finished, success: ${result.success}`)

    if (!result.success) {
      console.log('[VYBE-AUDIO] processAudio error:', result.error)
      console.error('[transcribe-voice] Orchestrator failed:', result.error)
      return new Response(
        JSON.stringify({ error: 'Transcription service unavailable' }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const transcript = result.data?.trim() ?? ''
    console.log(`[VYBE-AUDIO] transcript length: ${transcript.length}`)

    if (!transcript) {
      return new Response(JSON.stringify({ transcript: '' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ transcript }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('[transcribe-voice] Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Unexpected transcription error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
