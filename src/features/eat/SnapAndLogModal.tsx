import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, X, Upload, Activity, Check, ChefHat } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'
import type { MealSlot } from '@/types'

interface SnapAndLogModalProps {
  slot: MealSlot
  onClose: () => void
  onLog: (foodName: string, calories: number, protein: number, carbs: number, fat: number) => void
}

export function SnapAndLogModal({ slot, onClose, onLog }: SnapAndLogModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [result, setResult] = useState<any | null>(null)
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
        fat: data.fat || 0
      })
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to analyze image. Ensure your Gemini API Key is configured in Cloudflare.")
    } finally {
      setIsScanning(false)
    }
  }

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
              <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center text-accent mx-auto mb-4">
                <Check size={32} />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-1">{result.foodName}</h3>
              <p className="text-white/50 text-sm text-center mb-6">AI Estimation Complete</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-[#121212] p-4 rounded-2xl border border-white/5 text-center">
                  <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Calories</div>
                  <div className="text-2xl font-bold text-white">{result.calories}</div>
                </div>
                <div className="bg-[#121212] p-4 rounded-2xl border border-white/5 text-center">
                  <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Protein</div>
                  <div className="text-2xl font-bold text-emerald-400">{result.protein}g</div>
                </div>
                <div className="bg-[#121212] p-4 rounded-2xl border border-white/5 text-center">
                  <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Carbs</div>
                  <div className="text-2xl font-bold text-blue-400">{result.carbs}g</div>
                </div>
                <div className="bg-[#121212] p-4 rounded-2xl border border-white/5 text-center">
                  <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Fat</div>
                  <div className="text-2xl font-bold text-purple-400">{result.fat}g</div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => { setResult(null); setImagePreview(null); }} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors">
                  Discard
                </button>
                <button 
                  onClick={() => {
                    onLog(result.foodName, result.calories, result.protein, result.carbs, result.fat)
                  }}
                  className="flex-1 py-3 rounded-xl bg-accent text-black font-bold hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                >
                  Log to {slot}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
