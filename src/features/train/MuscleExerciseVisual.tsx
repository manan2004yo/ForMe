import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Dumbbell } from 'lucide-react';

interface MuscleExerciseVisualProps {
  canonicalId: string;
  exerciseName?: string;
  className?: string;
  isAnimating?: boolean;
}

export function MuscleExerciseVisual({ canonicalId, exerciseName, className, isAnimating = true }: MuscleExerciseVisualProps) {
  const [frame, setFrame] = useState<number>(1);
  const [imageState, setImageState] = useState<'animating' | 'fallback' | 'error'>('animating');

  // We have exactly 3 frames: frame-1.svg, frame-2.svg, frame-3.svg
  // We'll cycle through them 1 -> 2 -> 3 -> 2 -> 1 to simulate a smooth rep
  useEffect(() => {
    // Reset state when canonicalId changes
    setImageState('animating');
    setFrame(1);
  }, [canonicalId]);

  useEffect(() => {
    if (!isAnimating || imageState !== 'animating') {
      setFrame(1);
      return;
    }

    let direction = 1;
    let currentFrame = 1;

    const interval = setInterval(() => {
      currentFrame += direction;
      
      if (currentFrame >= 3) {
        currentFrame = 3;
        direction = -1;
      } else if (currentFrame <= 1) {
        currentFrame = 1;
        direction = 1;
      }
      
      setFrame(currentFrame);
    }, 400); // 400ms per frame = 1.6s per rep cycle

    return () => clearInterval(interval);
  }, [isAnimating, imageState]);

  const imagePath = imageState === 'animating' 
    ? `/exercises/${canonicalId}/frame-${frame}.svg`
    : `/exercises/${canonicalId}/visual.webp`;

  return (
    <div className={clsx("relative w-full aspect-square bg-white/5 rounded-xl overflow-hidden flex items-center justify-center", className)}>
      {imageState === 'error' ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-white/5 to-white/10 p-4 text-center">
          <Dumbbell className="w-12 h-12 text-white/20 mb-3" />
          <span className="text-white/40 text-sm font-medium uppercase tracking-wider">
            {exerciseName || canonicalId.replace(/_/g, ' ')}
          </span>
        </div>
      ) : (
        <img
          src={imagePath}
          alt={exerciseName || canonicalId}
          className="w-full h-full object-contain p-2"
          loading="lazy"
          onError={() => {
            if (imageState === 'animating') {
              setImageState('fallback');
            } else if (imageState === 'fallback') {
              setImageState('error');
            }
          }}
        />
      )}
      
      {/* Attribution for Workout Guide, conditionally shown maybe? Or just global attribution. 
          The prompt asks for "required Workout Guide attribution/license information". 
          We can place a tiny semi-transparent credit in the corner of the visual. */}
      {imageState !== 'error' && (
        <div className="absolute bottom-1 right-1 text-[8px] text-white/20 pointer-events-none">
          CC BY-SA 4.0
        </div>
      )}
    </div>
  );
}

