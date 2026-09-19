import { Mic, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVybeStore, VybeContext } from '@/store/vybeStore';
import { clsx } from 'clsx';

/**
 * Floating microphone button used on Eat and Train pages.
 * Clicking toggles listening state. Optional context can be passed for food logging.
 */
export function VYBEMicButton({ context }: { context?: VybeContext }) {
  const { listening, startListening, stopListening } = useVybeStore();

  const handleClick = () => {
    if (listening) {
      stopListening();
    } else {
      startListening(context);
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
