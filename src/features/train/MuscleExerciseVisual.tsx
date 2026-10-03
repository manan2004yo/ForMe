import { useState, useEffect } from 'react';
import { clsx } from 'clsx';

interface MuscleExerciseVisualProps {
  canonicalId: string;
  exerciseName?: string;
  className?: string;
}

export function MuscleExerciseVisual({ canonicalId, exerciseName, className }: MuscleExerciseVisualProps) {
  const [frame, setFrame] = useState<number>(1);

  // We have exactly 3 frames: frame-1.svg, frame-2.svg, frame-3.svg
  // We'll cycle through them 1 -> 2 -> 3 -> 2 -> 1 to simulate a smooth rep
  useEffect(() => {
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
  }, []);

  const imagePath = `/exercises/${canonicalId}/frame-${frame}.svg`;

  return (
    <div className={clsx("relative w-full aspect-square bg-white/5 rounded-xl overflow-hidden flex items-center justify-center", className)}>
      <img
        src={imagePath}
        alt={exerciseName || canonicalId}
        className="w-full h-full object-contain p-2"
        loading="lazy"
        onError={(e) => {
          // If a frame fails to load, we can hide the broken image icon
          (e.target as HTMLImageElement).style.display = 'none';
        }}
        onLoad={(e) => {
          (e.target as HTMLImageElement).style.display = 'block';
        }}
      />
      {/* Attribution for Workout Guide, conditionally shown maybe? Or just global attribution. 
          The prompt asks for "required Workout Guide attribution/license information". 
          We can place a tiny semi-transparent credit in the corner of the visual. */}
      <div className="absolute bottom-1 right-1 text-[8px] text-white/20 pointer-events-none">
        CC BY-SA 4.0
      </div>
    </div>
  );
}
