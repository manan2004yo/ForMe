import { processAudio } from '../lib/aiOrchestrator'

const MAX_AUDIO_BASE64_LENGTH = 12_000_000

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context
    const body = await request.json()

    const audioBase64 =
      typeof body?.audioBase64 === 'string' ? body.audioBase64.trim() : ''
    const mimeType =
      typeof body?.mimeType === 'string' ? body.mimeType.trim().toLowerCase() : ''

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

    const allowedMimeTypes = new Set([
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/ogg;codecs=opus',
    ])

    if (!allowedMimeTypes.has(mimeType)) {
      return new Response(JSON.stringify({ error: 'Unsupported audio format' }), {
        status: 415,
        headers: { 'Content-Type': 'application/json' },
      })
    }

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
      mimeType
    )

    if (!result.success) {
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
