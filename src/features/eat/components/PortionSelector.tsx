// ============================================================
// FORME — Smart Portion Selector
// ============================================================
// Indian-first unit ordering. Pre-selects user's remembered unit
// if they've logged this food at least twice.
// ============================================================

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { getPortionMemory } from '@/lib/services/portionMemoryService'
import { clsx } from 'clsx'

export const INDIAN_UNITS = [
  { value: 'katori', label: 'Katori',  hint: '~150g' },
  { value: 'glass',  label: 'Glass',   hint: '~240ml' },
  { value: 'piece',  label: 'Piece',   hint: 'varies' },
  { value: 'gram',   label: 'Grams',   hint: 'exact' },
  { value: 'roti',   label: 'Roti',    hint: '~40g' },
  { value: 'cup',    label: 'Cup',     hint: '~240ml' },
  { value: 'tbsp',   label: 'Tbsp',    hint: '~15g' },
  { value: 'tsp',    label: 'Tsp',     hint: '~5g' },
  { value: 'scoop',  label: 'Scoop',   hint: 'varies' },
  { value: 'slice',  label: 'Slice',   hint: 'varies' },
]

interface PortionSelectorProps {
  foodId: string
  availableUnits?: string[]
  value: string
  quantity: number
  onUnitChange: (unit: string) => void
  onQuantityChange: (quantity: number) => void
}

export function PortionSelector({
  foodId,
  availableUnits,
  value,
  quantity,
  onUnitChange,
  onQuantityChange,
}: PortionSelectorProps) {
  const { user } = useAuthStore()
  const [memoryApplied, setMemoryApplied] = useState(false)

  useEffect(() => {
    if (!user?.uid || memoryApplied) return
    const memory = getPortionMemory(user.uid, foodId)
    if (memory) {
      onUnitChange(memory.preferredUnit)
      onQuantityChange(memory.preferredQuantity)
      setMemoryApplied(true)
    }
  }, [foodId, user?.uid]) // eslint-disable-line react-hooks/exhaustive-deps

  const units = availableUnits
    ? INDIAN_UNITS.filter(u => availableUnits.includes(u.value))
    : INDIAN_UNITS

  const step = value === 'gram' ? 25 : 0.5
  const minVal = value === 'gram' ? 25 : 0.25

  return (
    <div className="space-y-3">
      {/* Quantity row */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onQuantityChange(Math.max(minVal, quantity - step))}
          className="w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xl transition-all active:scale-95 flex items-center justify-center"
        >
          −
        </button>
        <input
          type="text"
          inputMode="decimal"
          value={quantity}
          onChange={e => {
            const v = parseFloat(e.target.value)
            if (!isNaN(v) && v > 0) onQuantityChange(v)
          }}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 text-center text-lg font-bold text-white focus:outline-none focus:border-accent transition-all tabular-nums"
        />
        <button
          onClick={() => onQuantityChange(quantity + step)}
          className="w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xl transition-all active:scale-95 flex items-center justify-center"
        >
          +
        </button>
      </div>

      {/* Unit pills */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {units.map(unit => (
          <button
            key={unit.value}
            onClick={() => onUnitChange(unit.value)}
            className={clsx(
              'flex flex-col items-center shrink-0 px-4 py-2.5 rounded-xl border transition-all',
              value === unit.value
                ? 'bg-accent/15 border-accent/40 text-white'
                : 'bg-white/5 border-white/5 text-white/50 hover:text-white hover:bg-white/10'
            )}
          >
            <span className="text-sm font-semibold">{unit.label}</span>
            <span className="text-[10px] opacity-50 mt-0.5">{unit.hint}</span>
          </button>
        ))}
      </div>

      {memoryApplied && (
        <p className="text-[11px] text-center" style={{ color: 'var(--accent,#2DD4BF)', opacity: 0.7 }}>
          ✦ Using your preferred portion
        </p>
      )}
    </div>
  )
}
