import { Mic, X } from 'lucide-react';
import { useVybeStore, VybeContext, initRecognition, globalRecognition } from '@/store/vybeStore';
import { clsx } from 'clsx';
import React from 'react';

export function VYBEMicButton({ context }: { context?: VybeContext }) {
  const { listening, startListening, stopListening, setProcessing, setResult, setError, reset } = useVybeStore();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (listening) {
      if (globalRecognition) {
        globalRecognition.stop();
      }
      stopListening();
    } else {
      const rec = initRecognition();
      if (!rec) {
        setError('Speech recognition not supported in this browser.');
        return;
      }

      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      rec.onstart = null;
      rec.onaudiostart = null;

      rec.onstart = () => {};

      rec.onaudiostart = () => {};

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript.trim();
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
          const text = await response.text();
          if (!text) {
            throw new Error('API returned an empty response.');
          }
          let data;
          try {
            data = JSON.parse(text);
          } catch {
            throw new Error('API returned invalid data format.');
          }
          if (!response.ok) {
            throw new Error(data.error ?? 'Parsing failed');
          }
          setResult(data);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          setError(err.message ?? 'Unexpected error');
        }
      };

      rec.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setError('Microphone access is blocked. Please allow microphone permissions in your browser settings.');
        } else {
          setError(`Speech recognition error: ${event.error}`);
        }
      };

      rec.onend = () => {
        const state = useVybeStore.getState();
        if (!state.result && !state.processing && !state.error) {
          reset();
        }
      };

      try {
        rec.start();
        startListening(context);
      } catch {
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
