import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Package, CheckCircle, Camera, Loader2, Pencil } from 'lucide-react'
import type { ResolvedScannedProduct } from '@/lib/services/barcodeProductService'
import { clsx } from 'clsx'

interface BarcodeResultSheetProps {
  product: ResolvedScannedProduct | null
  onLog: (product: ResolvedScannedProduct, grams: number) => void
  onClose: () => void
  /** When true: blank product being created by the user. Shows editable name, keeps Snap Label available, requires name to log. */
  isManualAdd?: boolean
}

type PortionChoice = 'full' | 'half' | 'custom'

// ── helpers ──────────────────────────────────────────────────


function fmtPortion(value: number, field: string, unknownFields: string[]): string {
  if (unknownFields.includes(field)) return '—'
  return field === 'calories' ? String(Math.round(value)) : `${value}g`
}

function badgeColor(tier: string): string {
  if (tier === 'database' || tier === 'label' || tier === 'manual') return '#34D399'
  return '#F59E0B'
}

function badgeLabel(tier: string, existing?: string): string {
  if (tier === 'label') return 'Verified from Label'
  if (tier === 'manual') return 'Entered by you'
  return existing ?? (tier === 'database' ? 'Database' : 'AI Estimate')
}

async function resizeDataUrl(dataUrl: string, maxDim = 1024): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.src = dataUrl
  })
}

// ─────────────────────────────────────────────────────────────

type MacroField = 'calories' | 'protein' | 'carbs' | 'fat'

function MacroCell({
  label,
  field,
  value,
  color,
  onChange,
}: {
  label: string
  field: MacroField
  value: string
  color: string
  onChange: (field: MacroField, value: string) => void
}) {
  return (
    <div className="text-center">
      <input
        type="text"
        inputMode="decimal"
        value={value}
        placeholder="—"
        onChange={e => onChange(field, e.target.value.replace(/[^0-9.]/g, ''))}
        className="w-full bg-transparent text-sm font-bold tabular-nums text-center focus:outline-none focus:bg-white/10 rounded-lg px-1 py-0.5 transition-colors"
        style={{ color, minWidth: 0 }}
        aria-label={`${label} per 100g`}
      />
      <p className="text-[10px] text-white/30 mt-0.5">{label}</p>
    </div>
  )
}

export function BarcodeResultSheet({ product: initialProduct, onLog, onClose, isManualAdd = false }: BarcodeResultSheetProps) {
  const [portionChoice, setPortionChoice] = useState<PortionChoice>('full')
  const [customGrams, setCustomGrams] = useState('')
  const [editName, setEditName] = useState<string>(initialProduct?.name ?? '')
  const [isEditingName, setIsEditingName] = useState(false)

  // Mutable product state (Snap Label or manual edits overwrite this)
  const [product, setProduct] = useState<ResolvedScannedProduct | null>(initialProduct)
  const [unknownFields, setUnknownFields] = useState<string[]>(initialProduct?.unknownFields ?? [])

  // Per-100g editable fields (strings so the user can clear them)
  const [editCalories, setEditCalories] = useState<string>(
    initialProduct ? (initialProduct.unknownFields.includes('calories') ? '' : String(initialProduct.per100g.calories)) : ''
  )
  const [editProtein, setEditProtein] = useState<string>(
    initialProduct ? (initialProduct.unknownFields.includes('protein') ? '' : String(initialProduct.per100g.protein)) : ''
  )
  const [editCarbs, setEditCarbs] = useState<string>(
    initialProduct ? (initialProduct.unknownFields.includes('carbs') ? '' : String(initialProduct.per100g.carbs)) : ''
  )
  const [editFat, setEditFat] = useState<string>(
    initialProduct ? (initialProduct.unknownFields.includes('fat') ? '' : String(initialProduct.per100g.fat)) : ''
  )

  // Sync state when parent passes a new product
  useEffect(() => {
    setProduct(initialProduct)
    setUnknownFields(initialProduct?.unknownFields ?? [])
    setEditCalories(initialProduct ? (initialProduct.unknownFields.includes('calories') ? '' : String(initialProduct.per100g.calories)) : '')
    setEditProtein(initialProduct ? (initialProduct.unknownFields.includes('protein') ? '' : String(initialProduct.per100g.protein)) : '')
    setEditCarbs(initialProduct ? (initialProduct.unknownFields.includes('carbs') ? '' : String(initialProduct.per100g.carbs)) : '')
    setEditFat(initialProduct ? (initialProduct.unknownFields.includes('fat') ? '' : String(initialProduct.per100g.fat)) : '')
  }, [initialProduct])

  // Snap Label state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [snapLoading, setSnapLoading] = useState(false)
  const [snapError, setSnapError] = useState<string | null>(null)

  if (!product) return null

  // ── computed values from editable fields ──────────────────
  const calNum = parseFloat(editCalories)
  const proNum = parseFloat(editProtein)
  const carbNum = parseFloat(editCarbs)
  const fatNum = parseFloat(editFat)

  const effectiveP100g = {
    calories: isNaN(calNum) ? 0 : calNum,
    protein: isNaN(proNum) ? 0 : proNum,
    carbs: isNaN(carbNum) ? 0 : carbNum,
    fat: isNaN(fatNum) ? 0 : fatNum,
    fiber: product.per100g.fiber,
  }

  const defaultGrams = product.servingSizeG ?? 100
  const effectiveGrams: number =
    portionChoice === 'full' ? defaultGrams :
      portionChoice === 'half' ? defaultGrams / 2 :
        parseFloat(customGrams) || 0

  const canLog =
    !isNaN(calNum) && calNum > 0 && effectiveGrams > 0 &&
    (!isManualAdd || editName.trim().length > 0)

  const ratio = effectiveGrams / 100
  const portion = {
    calories: Math.round(effectiveP100g.calories * ratio),
    protein: parseFloat((effectiveP100g.protein * ratio).toFixed(1)),
    carbs: parseFloat((effectiveP100g.carbs * ratio).toFixed(1)),
    fat: parseFloat((effectiveP100g.fat * ratio).toFixed(1)),
  }

  const tier = product.trust?.tier ?? 'ai_estimate'

  // ── handlers ──────────────────────────────────────────────

  function applyManualEdit(field: MacroField, value: string) {
    const setters: Record<string, (v: string) => void> = {
      calories: setEditCalories,
      protein: setEditProtein,
      carbs: setEditCarbs,
      fat: setEditFat,
    }
    setters[field](value)

    // Remove from unknownFields when user fills a value
    if (value !== '' && !isNaN(parseFloat(value))) {
      setUnknownFields(prev => prev.filter(f => f !== field))
    } else if (value === '') {
      setUnknownFields(prev => prev.includes(field) ? prev : [...prev, field])
    }

    // Switch trust to 'manual'
    if (product && product.trust.tier !== 'manual') {
      setProduct(prev => prev ? {
        ...prev,
        trust: { tier: 'manual', label: 'Entered by you' },
      } : prev)
    }
  }

  async function handleSnapLabel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSnapLoading(true)
    setSnapError(null)

    try {
      const reader = new FileReader()
      const dataUrl: string = await new Promise((res, rej) => {
        reader.onloadend = () => res(reader.result as string)
        reader.onerror = rej
        reader.readAsDataURL(file)
      })
      const resized = await resizeDataUrl(dataUrl)

      const resp = await fetch('/api/read-nutrition-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: resized }),
      })
      const data = await resp.json()

      if (data.status !== 'ok' || !data.per100g) {
        setSnapError("Couldn't read the label. Try a closer photo or edit the values manually.")
        return
      }

      const p = data.per100g
      const newUnknown: string[] = []
      const safeNum = (v: number | null, field: string) => {
        if (v === null) { newUnknown.push(field); return 0 }
        return v
      }

      const newCal = safeNum(p.calories, 'calories')
      const newPro = safeNum(p.protein, 'protein')
      const newCarb = safeNum(p.carbs, 'carbs')
      const newFat = safeNum(p.fat, 'fat')

      setEditCalories(newUnknown.includes('calories') ? '' : String(newCal))
      setEditProtein(newUnknown.includes('protein') ? '' : String(newPro))
      setEditCarbs(newUnknown.includes('carbs') ? '' : String(newCarb))
      setEditFat(newUnknown.includes('fat') ? '' : String(newFat))
      setUnknownFields(newUnknown)

      setProduct(prev => prev ? {
        ...prev,
        per100g: { ...prev.per100g, calories: newCal, protein: newPro, carbs: newCarb, fat: newFat },
        servingSizeG: data.servingSizeG ?? prev.servingSizeG,
        trust: { tier: 'label', label: 'Verified from Label' },
      } : prev)
    } catch {
      setSnapError("Couldn't read the label. Try a closer photo or edit the values manually.")
    } finally {
      setSnapLoading(false)
      // reset so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleLog() {
    if (!canLog || !product) return
    const logProduct: ResolvedScannedProduct = {
      ...product,
      name: editName.trim() || product.name,
      per100g: effectiveP100g,
      unknownFields,
    }
    onLog(logProduct, effectiveGrams)
  }

  // ── render ────────────────────────────────────────────────

  return createPortal(
    <AnimatePresence>
      {product && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[120] bg-[#0f0f0f] border-t border-white/10 rounded-t-3xl"
            style={{
              maxHeight: '90vh',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            <div className="flex flex-col" style={{ maxHeight: '90vh' }}>
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-8">
                {/* Header */}
                <div className="flex items-start justify-between py-3">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Package size={13} style={{ color: 'var(--accent, #2DD4BF)' }} className="shrink-0" />
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: badgeColor(tier) }}
                      >
                        {badgeLabel(tier, product.trust?.label)}
                        {tier === 'ai_estimate' && product.trust?.confidence === 'low' && ' · Low Confidence'}
                      </span>
                    </div>
                    {isManualAdd ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        placeholder="Product name"
                        maxLength={80}
                        autoFocus
                        aria-label="Product name"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-lg font-bold text-white placeholder:text-white/30 focus:outline-none focus:border-accent transition-all"
                      />
                    ) : (
                      isEditingName ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onBlur={() => {
                            if (editName.trim().length === 0) setEditName(initialProduct?.name ?? '')
                            setIsEditingName(false)
                          }}
                          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                          maxLength={80}
                          autoFocus
                          aria-label="Product name"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-lg font-bold text-white placeholder:text-white/30 focus:outline-none focus:border-accent transition-all"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsEditingName(true)}
                          aria-label="Edit product name"
                          className="flex items-center gap-2 text-left w-full min-h-[44px] rounded-xl active:bg-white/5 transition-colors"
                        >
                          <span className="text-lg font-bold text-white leading-tight">{editName}</span>
                          <Pencil size={12} className="text-white/30 shrink-0" />
                        </button>
                      )
                    )}
                    {product.brand && (
                      <p className="text-sm text-white/40 mt-0.5">{product.brand}</p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-white transition-all shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* AI low-confidence warning */}
                {tier === 'ai_estimate' && (product.trust?.confidence === 'low' || product.trust?.consistent === false) && (
                  <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-3">
                    <p className="text-xs text-amber-300">
                      This is a rough AI estimate and may be inaccurate. Snap the nutrition label for exact values.
                    </p>
                  </div>
                )}

                {/* Snap error */}
                {snapError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 mb-3"
                  >
                    <p className="text-xs text-red-300">{snapError}</p>
                  </motion.div>
                )}

                {/* Snap Nutrition Label button (hidden for label/manual tiers) */}
                {(isManualAdd || tier === 'ai_estimate' || tier === 'database') && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleSnapLabel}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={snapLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 mb-4 rounded-2xl border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-semibold disabled:opacity-50"
                    >
                      {snapLoading
                        ? <><Loader2 size={15} className="animate-spin" /> Reading label…</>
                        : <><Camera size={15} /> Snap Nutrition Label</>
                      }
                    </button>
                  </>
                )}

                {/* Per 100g — tappable & editable */}
                <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/5 mb-3">
                  <div className="flex items-center gap-1 mb-2">
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider">Per 100g</p>
                    <Pencil size={9} className="text-white/20" />
                    <p className="text-[10px] text-white/20">tap to edit</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <MacroCell label="Kcal" field="calories" value={editCalories} color="var(--accent,#2DD4BF)" onChange={applyManualEdit} />
                    <MacroCell label="Protein" field="protein" value={editProtein} color="#34D399" onChange={applyManualEdit} />
                    <MacroCell label="Carbs" field="carbs" value={editCarbs} color="#60A5FA" onChange={applyManualEdit} />
                    <MacroCell label="Fat" field="fat" value={editFat} color="#C084FC" onChange={applyManualEdit} />
                  </div>
                </div>

                {/* Missing calories hint */}
                {(editCalories === '' || isNaN(calNum)) && (
                  <p className="text-[11px] text-amber-400 mb-3 px-1">Enter calories to log</p>
                )}

                {/* Portion choice */}
                <div className="mb-4">
                  <p className="text-xs font-bold text-white/30 uppercase tracking-wider mb-2">
                    How much are you eating?
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      {
                        key: 'full' as PortionChoice,
                        label: 'Full',
                        sub: product.servingSizeG ? `${product.servingSizeG}g` : '100g',
                      },
                      {
                        key: 'half' as PortionChoice,
                        label: 'Half',
                        sub: product.servingSizeG ? `${Math.round(product.servingSizeG / 2)}g` : '50g',
                      },
                      { key: 'custom' as PortionChoice, label: 'Custom', sub: 'Enter grams' },
                    ]).map(({ key, label, sub }) => (
                      <button
                        key={key}
                        onClick={() => setPortionChoice(key)}
                        className={clsx(
                          'flex flex-col items-center py-3 px-2 rounded-2xl border transition-all',
                          portionChoice === key
                            ? 'bg-accent/15 border-accent/40 text-white'
                            : 'bg-white/5 border-white/5 text-white/50 hover:text-white hover:bg-white/10'
                        )}
                      >
                        <span className="text-sm font-bold">{label}</span>
                        <span className="text-[11px] mt-0.5 opacity-60">{sub}</span>
                      </button>
                    ))}
                  </div>

                  {portionChoice === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3"
                    >
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="Enter grams"
                          value={customGrams}
                          onChange={e => setCustomGrams(e.target.value)}
                          autoFocus
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">g</span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Nutrition preview for chosen portion */}
                {effectiveGrams > 0 && canLog && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-4 py-3 rounded-2xl bg-accent/5 border border-accent/20 mb-4"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--accent,#2DD4BF)', opacity: 0.7 }}>
                      For {effectiveGrams}g
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Kcal', value: fmtPortion(portion.calories, 'calories', unknownFields), color: 'var(--accent,#2DD4BF)' },
                        { label: 'Protein', value: fmtPortion(portion.protein, 'protein', unknownFields), color: '#34D399' },
                        { label: 'Carbs', value: fmtPortion(portion.carbs, 'carbs', unknownFields), color: '#60A5FA' },
                        { label: 'Fat', value: fmtPortion(portion.fat, 'fat', unknownFields), color: '#C084FC' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="text-center">
                          <p className="text-sm font-bold tabular-nums" style={{ color }}>{value}</p>
                          <p className="text-[10px] text-white/30 mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Log button */}
                <button
                  onClick={handleLog}
                  disabled={!canLog}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all bg-accent text-black"
                >
                  <CheckCircle size={18} />
                  {canLog
                    ? `Log ${effectiveGrams}g`
                    : isManualAdd && editName.trim().length === 0
                      ? 'Enter a name to log'
                      : 'Enter calories to log'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
