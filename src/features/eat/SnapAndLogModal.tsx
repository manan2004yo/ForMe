import { useToastStore } from '@/store/toastStore'
import type { MealSlot } from '@/types'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, Camera, Check, ChefHat, X, Pencil } from 'lucide-react'
import { useRef, useState } from 'react'

interface SnapAndLogModalProps {
  slot: MealSlot
  onClose: () => void
  onLog: (data: { foodName: string; calories: number; protein: number; carbs: number; fat: number; servings: number; source: string }) => void
}

export function SnapAndLogModal({ slot, onClose, onLog }: SnapAndLogModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [result, setResult] = useState<any | null>(null)
  
  const [editedFoodName, setEditedFoodName] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [servings, setServings] = useState(1)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToastStore()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleScan = async () => {
    if (!imagePreview) return
    setIsScanning(true)
    
    try {
      const res = await fetch('/api/snap-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imagePreview })
      })

      if (!res.ok) throw new Error('Vision API failed')
      
      const data = await res.json()
      setResult({
        foodName: data.foodName || "Unknown Food",
        calories: data.calories || 0,
        protein: data.protein || 0,
        carbs: data.carbs || 0,
        fat: data.fat || 0,
        confidence: data.confidence || "high"
      })
      
      setEditedFoodName(data.foodName || "Unknown Food")
      setServings(1)
      setIsEditingName(false)
    } catch {
      toast.error('AI Vision is unavailable right now. Please use the Search option to log this meal manually.')
    } finally {
      setIsScanning(false)
    }
  }

  let confidence = 0.9
  if (result?.confidence) {
    if (typeof result.confidence === 'string') {
      const c = result.confidence.toLowerCase()
      if (c === 'high') confidence = 0.9
      else if (c === 'medium') confidence = 0.7
      else if (c === 'low') confidence = 0.5
    } else if (typeof result.confidence === 'number') {
      confidence = result.confidence
    }
  }

  const confidencePercent = Math.round(confidence * 100)
  const confidenceLabel =
    confidence >= 0.85 ? 'High Confidence' :
    confidence >= 0.60 ? 'Moderate Confidence' :
    'Low Confidence — please verify'

  const confidenceColor =
    confidence >= 0.85 ? 'var(--status-good, #10b981)' :
    confidence >= 0.60 ? 'var(--status-warning, #f59e0b)' :
    'var(--status-bad, #ef4444)'

  const scaledNutrition = result ? {
    calories: Math.round(result.calories * servings),
    protein: parseFloat((result.protein * servings).toFixed(1)),
    carbs: parseFloat((result.carbs * servings).toFixed(1)),
    fat: parseFloat((result.fat * servings).toFixed(1)),
  } : { calories: 0, protein: 0, carbs: 0, fat: 0 }

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col">
      <div className="flex justify-between items-center p-4">
        <h2 className="text-white font-heading font-bold text-xl flex items-center gap-2">
          <ChefHat className="text-accent" /> Vision AI
        </h2>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white/70 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <input 
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />

        <AnimatePresence mode="wait">
          {!imagePreview ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center gap-6"
            >
              <div className="w-48 h-48 rounded-full bg-accent/10 border-2 border-dashed border-accent flex flex-col items-center justify-center text-accent/70 cursor-pointer hover:bg-accent/20 transition-all hover:text-accent" onClick={() => fileInputRef.current?.click()}>
                <Camera size={48} className="mb-2" />
                <span className="font-semibold text-sm">Snap Food</span>
              </div>
              <p className="text-white/40 text-sm text-center max-w-[200px]">
                Take a picture of your plate to automatically estimate macros.
              </p>
            </motion.div>
          ) : !result ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(45,212,191,0.2)]"
            >
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              
              {/* Scanning Overlay */}
              {isScanning && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                  <Activity className="text-accent animate-pulse mb-4" size={48} />
                  <p className="text-white font-medium tracking-widest uppercase text-sm animate-pulse">Analyzing Plate...</p>
                  <div className="w-48 h-1 bg-white/20 rounded-full mt-4 overflow-hidden">
                    <motion.div 
                      className="h-full bg-accent rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2.5, ease: "linear" }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!isScanning && (
                <div className="absolute bottom-4 left-4 right-4 flex gap-4">
                  <button onClick={() => setImagePreview(null)} className="flex-1 py-3 rounded-xl bg-white/20 backdrop-blur-md text-white font-semibold">
                    Retake
                  </button>
                  <button onClick={handleScan} className="flex-1 py-3 rounded-xl bg-accent text-black font-bold shadow-lg shadow-accent/50 flex items-center justify-center gap-2">
                    <Activity size={18} /> Analyze
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm bg-[#1a1a1a] border border-accent/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(45,212,191,0.2)]"
            >
              <div className="text-center mb-2">
                <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-1">
                  AI Estimate
                </p>
                <p className="text-sm text-white/50">
                  Does this look right? You can edit before logging.
                </p>
              </div>

              <div className="flex items-center justify-center mb-4">
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold"
                  style={{
                    color: confidenceColor,
                    borderColor: `${confidenceColor}40`,
                    backgroundColor: `${confidenceColor}15`,
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: confidenceColor }}
                  />
                  {confidenceLabel} · {confidencePercent}%
                </div>
              </div>

              {confidence < 0.60 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mx-4 mb-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20"
                >
                  <p className="text-xs text-amber-400 font-medium text-center">
                    ⚠ The AI is not confident about this estimate. 
                    Please verify the food name and macros before logging.
                  </p>
                </motion.div>
              )}

              <div className="flex justify-center mb-6">
                {isEditingName ? (
                  <input
                    type="text"
                    value={editedFoodName}
                    onChange={e => setEditedFoodName(e.target.value)}
                    onBlur={() => setIsEditingName(false)}
                    autoFocus
                    className="w-full bg-white/5 border border-accent rounded-xl px-4 py-2 text-white text-lg font-bold text-center focus:outline-none"
                  />
                ) : (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="flex items-center gap-2 group"
                  >
                    <h2 className="text-xl font-bold text-white">{editedFoodName}</h2>
                    <Pencil
                      size={14}
                      className="text-white/20 group-hover:text-accent transition-colors"
                    />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-center gap-4 py-3">
                <button
                  onClick={() => setServings(s => Math.max(0.5, parseFloat((s - 0.5).toFixed(1))))}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-lg flex items-center justify-center active:scale-95 transition-all"
                >
                  −
                </button>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white tabular-nums">{servings}</p>
                  <p className="text-xs text-white/40">
                    {servings === 1 ? 'serving' : 'servings'}
                  </p>
                </div>
                <button
                  onClick={() => setServings(s => parseFloat((s + 0.5).toFixed(1)))}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-lg flex items-center justify-center active:scale-95 transition-all"
                >
                  +
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-[#121212] p-4 rounded-2xl border border-white/5 text-center">
                  <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Calories</div>
                  <div className="text-2xl font-bold text-white">{scaledNutrition.calories}</div>
                </div>
                <div className="bg-[#121212] p-4 rounded-2xl border border-white/5 text-center">
                  <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Protein</div>
                  <div className="text-2xl font-bold text-emerald-400">{scaledNutrition.protein}g</div>
                </div>
                <div className="bg-[#121212] p-4 rounded-2xl border border-white/5 text-center">
                  <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Carbs</div>
                  <div className="text-2xl font-bold text-blue-400">{scaledNutrition.carbs}g</div>
                </div>
                <div className="bg-[#121212] p-4 rounded-2xl border border-white/5 text-center">
                  <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Fat</div>
                  <div className="text-2xl font-bold text-purple-400">{scaledNutrition.fat}g</div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => { setResult(null); setImagePreview(null); }} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors">
                  Discard
                </button>
                <button 
                  onClick={() => {
                    onLog({
                      foodName: editedFoodName,
                      calories: scaledNutrition.calories,
                      protein: scaledNutrition.protein,
                      carbs: scaledNutrition.carbs,
                      fat: scaledNutrition.fat,
                      servings,
                      source: 'snap_ai',
                    })
                  }}
                  className="flex-1 py-3 rounded-xl bg-accent text-black font-bold hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                >
                  Log to {slot.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
