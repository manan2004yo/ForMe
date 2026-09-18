// ============================================================
// MuscleMapSVG — Placeholder geometric muscle map
// ============================================================
// Each muscle region is a simple ellipse positioned on a
// stylised body outline. IDs match MuscleGroup type exactly.
// When the real Hevy-style silhouette SVG is ready, replace the
// individual <ellipse> elements with the real <path> elements.
// The colouring logic below does not change at all.
// ============================================================

import { useMuscleRecoveryStore, RECOVERY_COLORS } from '@/store/muscleRecoveryStore'
import type { MuscleGroup } from '@/types'

interface MuscleMapSVGProps {
  view: 'front' | 'back'
  onMuscleClick: (muscle: MuscleGroup) => void
}

// Front view muscle patch definitions: [id, cx, cy, rx, ry]
const FRONT_MUSCLES: [MuscleGroup, number, number, number, number][] = [
  ['traps',      150, 82,  28, 14],
  ['shoulders',  105, 105, 18, 14],
  ['shoulders',  195, 105, 18, 14],
  ['chest',      150, 128, 38, 22],
  ['biceps',      95, 145, 12, 22],
  ['biceps',     205, 145, 12, 22],
  ['forearms',    88, 185, 10, 20],
  ['forearms',   212, 185, 10, 20],
  ['core',       150, 175, 24, 30],
  ['quads',      125, 265, 22, 38],
  ['quads',      175, 265, 22, 38],
  ['calves',     122, 355, 14, 26],
  ['calves',     178, 355, 14, 26],
]

// Back view muscle patch definitions
const BACK_MUSCLES: [MuscleGroup, number, number, number, number][] = [
  ['traps',      150,  88, 34, 18],
  ['rear_delts', 100, 108, 16, 12],
  ['rear_delts', 200, 108, 16, 12],
  ['lats',       118, 148, 20, 32],
  ['lats',       182, 148, 20, 32],
  ['back',       150, 155, 26, 26],
  ['triceps',     90, 145, 11, 22],
  ['triceps',    210, 145, 11, 22],
  ['forearms',    84, 188, 10, 20],
  ['forearms',   216, 188, 10, 20],
  ['glutes',     138, 248, 24, 22],
  ['glutes',     162, 248, 24, 22],
  ['hamstrings', 128, 295, 20, 36],
  ['hamstrings', 172, 295, 20, 36],
  ['calves',     124, 358, 14, 26],
  ['calves',     176, 358, 14, 26],
]

export function MuscleMapSVG({ view, onMuscleClick }: MuscleMapSVGProps) {
  const { getMuscleStatus } = useMuscleRecoveryStore()
  const muscles = view === 'front' ? FRONT_MUSCLES : BACK_MUSCLES

  return (
    <svg
      viewBox="0 0 300 420"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-[220px] mx-auto"
      style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.8))' }}
    >
      <defs>
        <filter id="glow-fatigued" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-recovering" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-fresh" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Body outline */}
      <ellipse cx="150" cy="45" rx="28" ry="32" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
      <rect x="138" y="72" width="24" height="18" rx="4" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
      <rect x="100" y="88" width="100" height="130" rx="16" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
      <rect x="72"  y="92" width="26" height="120" rx="13" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
      <rect x="202" y="92" width="26" height="120" rx="13" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
      <rect x="102" y="218" width="44" height="160" rx="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
      <rect x="154" y="218" width="44" height="160" rx="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />

      {/* Muscle patches */}
      {muscles.map(([muscle, cx, cy, rx, ry], index) => {
        const status = getMuscleStatus(muscle)
        const color = RECOVERY_COLORS[status]
        const isActive = status !== 'untrained'

        return (
          <ellipse
            key={`${muscle}-${index}`}
            cx={cx} cy={cy} rx={rx} ry={ry}
            fill={color}
            fillOpacity={isActive ? 0.75 : 0.15}
            stroke={color}
            strokeWidth={isActive ? 1 : 0}
            strokeOpacity={0.4}
            filter={isActive ? `url(#glow-${status})` : undefined}
            style={{ cursor: 'pointer', transition: 'fill 0.5s ease, fill-opacity 0.5s ease' }}
            onClick={() => onMuscleClick(muscle)}
          />
        )
      })}
    </svg>
  )
}
