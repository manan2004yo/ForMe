import { Mic, X } from 'lucide-react';
import { useVybeStore, VybeContext, initRecognition, globalRecognition } from '@/store/vybeStore';
import { clsx } from 'clsx';
import React from 'react';

/**
 * Floating microphone button used on Eat and Train pages.
 * Clicking toggles listening state. Optional context can be passed for food logging.
 */
export function VYBEMicButton({ context }: { context?: VybeContext }) {
  const { listening, startListening, stopListening, setProcessing, setResult, setError, reset } = useVybeStore();

  const handleClick = (e: React.MouseEvent) => {
    console.log('[VYBE DIAGNOSTICS] 1. USER CLICK: handleClick triggered');
    e.preventDefault();
    e.stopPropagation();

    if (listening) {
      console.log('[VYBE DIAGNOSTICS] 2a. Button clicked while listening - stopping');
      if (globalRecognition) {
        globalRecognition.stop();
      }
      stopListening();
    } else {
      console.log('[VYBE DIAGNOSTICS] 2b. Button clicked while idle - initializing SpeechRecognition');
      const rec = initRecognition();
      if (!rec) {
        console.error('[VYBE DIAGNOSTICS] ERROR: Speech recognition not supported by browser (initRecognition returned null)');
        setError('Speech recognition not supported in this browser.');
        return;
      }
      console.log('[VYBE DIAGNOSTICS] 3. SpeechRecognition initialized successfully');

      // Clean up previous listeners
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      rec.onstart = null;
      rec.onaudiostart = null;

      rec.onstart = () => {
        console.log('[VYBE DIAGNOSTICS] EVENT: onstart - Browser has started capturing audio');
      };

      rec.onaudiostart = () => {
        console.log('[VYBE DIAGNOSTICS] EVENT: onaudiostart - Audio capturing has begun');
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = async (event: any) => {
        console.log('[VYBE DIAGNOSTICS] EVENT: onresult fired', event);
        const transcript = event.results[0][0].transcript.trim();
        console.log('[VYBE DIAGNOSTICS] Transcript received:', transcript);
        if (!transcript) {
          console.warn('[VYBE DIAGNOSTICS] Transcript was empty');
          setError('No speech detected.');
          return;
        }
        
        console.log('[VYBE DIAGNOSTICS] 4. Triggering fetch to /api/parse-voice');
        setProcessing(true);
        try {
          const response = await fetch('/api/parse-voice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript }),
          });
          console.log('[VYBE DIAGNOSTICS] 5. Fetch response status:', response.status);
          const text = await response.text();
          if (!text) {
            console.error('[VYBE DIAGNOSTICS] API returned an empty body. Status:', response.status);
            throw new Error('API returned an empty response. Note: If testing locally with "npm run dev", the backend is disabled. Please test on Cloudflare.');
          }
          
          let data;
          try {
            data = JSON.parse(text);
          } catch (e) {
            console.error('[VYBE DIAGNOSTICS] Failed to parse API response as JSON:', text);
            throw new Error('API returned invalid data format.');
          }

          if (!response.ok) {
            console.error('[VYBE DIAGNOSTICS] API Error Data:', data);
            throw new Error(data.error ?? 'Parsing failed');
          }
          console.log('[VYBE DIAGNOSTICS] 6. Structured result received:', data);
          setResult(data);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          console.error('[VYBE DIAGNOSTICS] ERROR in fetch/parse:', err);
          setError(err.message ?? 'Unexpected error');
        }
      };

      rec.onerror = (event: any) => {
        console.error('[VYBE DIAGNOSTICS] EVENT: onerror fired! Error code:', event.error, 'Message:', event.message);
        if (event.error === 'not-allowed') {
          setError('Microphone access is blocked! Please click the lock icon in your URL bar and allow microphone permissions.');
        } else {
          setError(`Speech recognition error: ${event.error}`);
        }
      };

      rec.onend = () => {
        console.log('[VYBE DIAGNOSTICS] EVENT: onend fired');
        const state = useVybeStore.getState();
        // Do NOT reset if there is an active error! Otherwise the error overlay flashes and disappears.
        if (!state.result && !state.processing && !state.error) {
          console.log('[VYBE DIAGNOSTICS] onend -> resetting store because no result, no processing, and no error');
          reset();
        } else {
          console.log('[VYBE DIAGNOSTICS] onend -> keeping store state (error, processing, or result exists)');
        }
      };

      try {
        console.log('[VYBE DIAGNOSTICS] Attempting rec.start() directly inside click handler');
        rec.start();
        console.log('[VYBE DIAGNOSTICS] rec.start() executed without throwing an exception');
        startListening(context);
      } catch (err) {
        console.error('[VYBE DIAGNOSTICS] ERROR: rec.start() threw an exception:', err);
        setError('Failed to start microphone. Please ensure permissions are granted.');
      }
    }
  };

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
  );
}
