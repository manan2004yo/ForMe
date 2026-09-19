import { useMuscleRecoveryStore, RECOVERY_COLORS } from '@/store/muscleRecoveryStore'
import type { MuscleGroup } from '@/types'

interface MuscleMapSVGProps {
  view: 'front' | 'back'
  onMuscleClick: (muscle: MuscleGroup) => void
  selectedMuscle?: MuscleGroup | null
}

interface MusclePatch {
  muscle: MuscleGroup
  parts: { cx: number; cy: number; rx: number; ry: number }[]
}

// ─── Front muscle patches (anatomically positioned) ────────────
const FRONT_PATCHES: MusclePatch[] = [
  // Traps (across top of back, visible from front too)
  { muscle: 'traps', parts: [{ cx: 100, cy: 78, rx: 28, ry: 10 }] },
  // Shoulders (deltoids) — left and right
  { muscle: 'shoulders', parts: [{ cx: 44, cy: 90, rx: 14, ry: 12 }] },
  { muscle: 'shoulders', parts: [{ cx: 156, cy: 90, rx: 14, ry: 12 }] },
  // Chest (pectorals) — two separate patches
  { muscle: 'chest', parts: [
    { cx: 80, cy: 122, rx: 22, ry: 16 },
    { cx: 120, cy: 122, rx: 22, ry: 16 },
  ]},
  // Biceps
  { muscle: 'biceps', parts: [{ cx: 34, cy: 134, rx: 9, ry: 18 }] },
  { muscle: 'biceps', parts: [{ cx: 166, cy: 134, rx: 9, ry: 18 }] },
  // Forearms
  { muscle: 'forearms', parts: [{ cx: 30, cy: 198, rx: 7, ry: 17 }] },
  { muscle: 'forearms', parts: [{ cx: 170, cy: 198, rx: 7, ry: 17 }] },
  // Core / Abs — 6-pack grid
  { muscle: 'core', parts: [
    { cx: 91,  cy: 152, rx: 9, ry: 8 },
    { cx: 109, cy: 152, rx: 9, ry: 8 },
    { cx: 91,  cy: 170, rx: 9, ry: 8 },
    { cx: 109, cy: 170, rx: 9, ry: 8 },
    { cx: 91,  cy: 186, rx: 8, ry: 7 },
    { cx: 109, cy: 186, rx: 8, ry: 7 },
  ]},
  // Quads
  { muscle: 'quads', parts: [{ cx: 76,  cy: 278, rx: 17, ry: 32 }] },
  { muscle: 'quads', parts: [{ cx: 124, cy: 278, rx: 17, ry: 32 }] },
  // Calves
  { muscle: 'calves', parts: [{ cx: 75,  cy: 388, rx: 12, ry: 24 }] },
  { muscle: 'calves', parts: [{ cx: 125, cy: 388, rx: 12, ry: 24 }] },
]

// ─── Back muscle patches ───────────────────────────────────────
const BACK_PATCHES: MusclePatch[] = [
  // Traps — large diamond across upper back
  { muscle: 'traps', parts: [{ cx: 100, cy: 86, rx: 34, ry: 18 }] },
  // Rear delts
  { muscle: 'rear_delts', parts: [{ cx: 44, cy: 90, rx: 13, ry: 11 }] },
  { muscle: 'rear_delts', parts: [{ cx: 156, cy: 90, rx: 13, ry: 11 }] },
  // Lats — wing shapes
  { muscle: 'lats', parts: [
    { cx: 62, cy: 146, rx: 18, ry: 32 },
    { cx: 138, cy: 146, rx: 18, ry: 32 },
  ]},
  // Mid/lower back
  { muscle: 'back', parts: [{ cx: 100, cy: 158, rx: 22, ry: 24 }] },
  // Triceps
  { muscle: 'triceps', parts: [{ cx: 34, cy: 134, rx: 9, ry: 18 }] },
  { muscle: 'triceps', parts: [{ cx: 166, cy: 134, rx: 9, ry: 18 }] },
  // Forearms (back)
  { muscle: 'forearms', parts: [{ cx: 30, cy: 198, rx: 7, ry: 17 }] },
  { muscle: 'forearms', parts: [{ cx: 170, cy: 198, rx: 7, ry: 17 }] },
  // Glutes — large round patches
  { muscle: 'glutes', parts: [
    { cx: 78,  cy: 248, rx: 22, ry: 20 },
    { cx: 122, cy: 248, rx: 22, ry: 20 },
  ]},
  // Hamstrings
  { muscle: 'hamstrings', parts: [{ cx: 76,  cy: 302, rx: 16, ry: 32 }] },
  { muscle: 'hamstrings', parts: [{ cx: 124, cy: 302, rx: 16, ry: 32 }] },
  // Calves (back)
  { muscle: 'calves', parts: [{ cx: 75,  cy: 388, rx: 12, ry: 24 }] },
  { muscle: 'calves', parts: [{ cx: 125, cy: 388, rx: 12, ry: 24 }] },
]

// ─── Human body silhouette ─────────────────────────────────────
const BODY_FILL   = 'rgba(160,200,255,0.05)'
const BODY_STROKE = 'rgba(160,200,255,0.14)'

function BodySilhouette() {
  const s = { fill: BODY_FILL, stroke: BODY_STROKE, strokeWidth: 1 as number }
  return (
    <g>
      {/* Head */}
      <ellipse cx="100" cy="34" rx="23" ry="27" {...s} />
      {/* Neck */}
      <rect x="91" y="58" width="18" height="18" rx="5" {...s} />
      {/* Torso — tapered (wider at shoulders, narrower at waist) */}
      <path
        d="M 52,74 C 50,74 49,75 49,77 L 52,192 C 52,195 54,197 57,197 L 143,197 C 146,197 148,195 148,192 L 151,77 C 151,75 150,74 148,74 Z"
        {...s}
      />
      {/* Left shoulder cap */}
      <ellipse cx="44" cy="86" rx="15" ry="12" {...s} />
      {/* Right shoulder cap */}
      <ellipse cx="156" cy="86" rx="15" ry="12" {...s} />
      {/* Left upper arm */}
      <rect x="27" y="86" width="22" height="84" rx="11" {...s} />
      {/* Right upper arm */}
      <rect x="151" y="86" width="22" height="84" rx="11" {...s} />
      {/* Left forearm */}
      <rect x="23" y="172" width="18" height="74" rx="9" {...s} />
      {/* Right forearm */}
      <rect x="159" y="172" width="18" height="74" rx="9" {...s} />
      {/* Left hand */}
      <ellipse cx="32" cy="252" rx="10" ry="7" {...s} />
      {/* Right hand */}
      <ellipse cx="168" cy="252" rx="10" ry="7" {...s} />
      {/* Hips / pelvis */}
      <path d="M 52,197 C 48,200 47,208 50,216 L 57,232 L 143,232 L 150,216 C 153,208 152,200 148,197 Z" {...s} />
      {/* Left thigh */}
      <rect x="57" y="226" width="40" height="122" rx="20" {...s} />
      {/* Right thigh */}
      <rect x="103" y="226" width="40" height="122" rx="20" {...s} />
      {/* Left calf */}
      <rect x="60" y="350" width="34" height="112" rx="17" {...s} />
      {/* Right calf */}
      <rect x="106" y="350" width="34" height="112" rx="17" {...s} />
      {/* Left foot */}
      <ellipse cx="77" cy="466" rx="19" ry="8" {...s} />
      {/* Right foot */}
      <ellipse cx="123" cy="466" rx="19" ry="8" {...s} />
    </g>
  )
}

// ─── Component ────────────────────────────────────────────────
export function MuscleMapSVG({ view, onMuscleClick, selectedMuscle }: MuscleMapSVGProps) {
  const { getMuscleStatus } = useMuscleRecoveryStore()
  const patches = view === 'front' ? FRONT_PATCHES : BACK_PATCHES

  return (
    <svg
      viewBox="0 0 200 480"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-full mx-auto"
      style={{ filter: 'drop-shadow(0 0 24px rgba(80,130,255,0.12))' }}
    >
      <defs>
        <filter id="glow-strong" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-medium" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4.5" result="b" />
          <feMerge>
            <feMergeNode in="b" /><feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" /><feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Semi-transparent X-ray body silhouette */}
      <BodySilhouette />

      {/* Muscle patches — coloured by recovery status */}
      {patches.map((patch, pi) => {
        const status = getMuscleStatus(patch.muscle)
        const color  = RECOVERY_COLORS[status]
        const active = status !== 'untrained'
        const glowFilter =
          status === 'fatigued'   ? 'url(#glow-strong)'  :
          status === 'recovering' ? 'url(#glow-medium)'  :
          active                  ? 'url(#glow-soft)'    :
          undefined

        return (
          <g
            key={`${patch.muscle}-${pi}`}
            onClick={() => onMuscleClick(patch.muscle)}
            style={{ cursor: 'pointer' }}
          >
            {patch.parts.map((p, i) => (
              <ellipse
                key={`${patch.muscle}-${i}`}
                cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry}
                fill={color}
                fillOpacity={active ? 0.82 : 0.10}
                stroke={patch.muscle === selectedMuscle ? '#ffffff' : (active ? color : 'rgba(255,255,255,0.04)')}
                strokeWidth={patch.muscle === selectedMuscle ? 2 : (active ? 1.5 : 0.5)}
                strokeOpacity={patch.muscle === selectedMuscle ? 0.8 : (active ? 0.5 : 1)}
                filter={glowFilter}
                style={{ transition: 'fill 0.5s ease, fill-opacity 0.5s ease, stroke 0.2s ease' }}
              />
            ))}
          </g>
        )
      })}
    </svg>
  )
}
