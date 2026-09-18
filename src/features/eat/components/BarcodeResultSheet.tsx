import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Package, CheckCircle } from 'lucide-react'
import type { ScannedProduct } from '@/lib/services/barcodeProductService'
import { calculateNutritionForGrams } from '@/lib/services/barcodeProductService'
import { clsx } from 'clsx'

interface BarcodeResultSheetProps {
  product: ScannedProduct | null
  onLog: (product: ScannedProduct, grams: number) => void
  onClose: () => void
}

type PortionChoice = 'full' | 'half' | 'custom'

export function BarcodeResultSheet({ product, onLog, onClose }: BarcodeResultSheetProps) {
  const [portionChoice, setPortionChoice] = useState<PortionChoice>('full')
  const [customGrams, setCustomGrams] = useState('')

  if (!product) return null

  const defaultGrams = product.servingSizeG ?? 100

  const effectiveGrams: number =
    portionChoice === 'full'   ? defaultGrams :
    portionChoice === 'half'   ? defaultGrams / 2 :
    parseFloat(customGrams) || 0

  const nutrition = effectiveGrams > 0
    ? calculateNutritionForGrams(product, effectiveGrams)
    : null

  const accentStyle = { color: 'var(--accent, #2DD4BF)' }

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
              maxHeight: '85vh',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            <div className="flex flex-col" style={{ maxHeight: '85vh' }}>
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-8">
                {/* Header */}
                <div className="flex items-start justify-between py-3">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Package size={13} style={accentStyle} className="shrink-0" />
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider"
                        style={accentStyle}
                      >
                        {product.dataSource === 'manufacturer' ? 'Manufacturer Data' : 'Estimated Data'}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-white leading-tight">{product.name}</h2>
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

                {/* Per 100g reference */}
                <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/5 mb-4">
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider mb-2">Per 100g</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Kcal',   value: product.per100g.calories,          color: 'var(--accent,#2DD4BF)' },
                      { label: 'Protein', value: `${product.per100g.protein}g`,    color: '#34D399' },
                      { label: 'Carbs',  value: `${product.per100g.carbs}g`,       color: '#60A5FA' },
                      { label: 'Fat',    value: `${product.per100g.fat}g`,         color: '#C084FC' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="text-center">
                        <p className="text-sm font-bold tabular-nums" style={{ color }}>{value}</p>
                        <p className="text-[10px] text-white/30 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

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
                {nutrition && effectiveGrams > 0 && (
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
                        { label: 'Kcal',   value: nutrition.calories,       color: 'var(--accent,#2DD4BF)' },
                        { label: 'Protein', value: `${nutrition.protein}g`, color: '#34D399' },
                        { label: 'Carbs',  value: `${nutrition.carbs}g`,    color: '#60A5FA' },
                        { label: 'Fat',    value: `${nutrition.fat}g`,      color: '#C084FC' },
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
                  onClick={() => { if (effectiveGrams > 0) onLog(product, effectiveGrams) }}
                  disabled={effectiveGrams <= 0}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all bg-accent text-black"
                >
                  <CheckCircle size={18} />
                  Log {effectiveGrams > 0 ? `${effectiveGrams}g` : ''}
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
