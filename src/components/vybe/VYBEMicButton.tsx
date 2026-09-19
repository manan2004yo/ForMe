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
        'fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300',
        listening ? 'bg-red-500 hover:bg-red-600' : 'bg-accent hover:bg-accent/90',
        'text-white'
      )}
      aria-label="Voice input"
    >
      {listening ? <X size={28} /> : <Mic size={28} />}
    </button>
  );
}
