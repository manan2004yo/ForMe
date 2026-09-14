import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { UtensilsCrossed, Plus, Search, ChevronRight, Calculator, Check, ArrowLeft } from 'lucide-react'
import { clsx } from 'clsx'
import type { LoggedFoodItem, NutritionInfo } from '@/types'

// Mock database for ingredients
const MOCK_INGREDIENTS = [
  { id: '1', name: 'Raw Toor Dal', calories: 343, protein: 22, carbs: 63, fat: 1.5, fiber: 15 },
  { id: '2', name: 'Ghee', calories: 900, protein: 0, carbs: 0, fat: 100, fiber: 0 },
  { id: '3', name: 'Onion (Raw)', calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7 },
  { id: '4', name: 'Tomato (Raw)', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2 },
  { id: '5', name: 'Raw Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
  { id: '6', name: 'Paneer', calories: 265, protein: 18, carbs: 1.2, fat: 20, fiber: 0 },
]

export function FamilyRecipeSplitter({ onClose }: { onClose: () => void }) {
  const [recipeName, setRecipeName] = useState('')
  const [ingredients, setIngredients] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [totalServings, setTotalServings] = useState(4)
  const [myServings, setMyServings] = useState(1)

  const filteredIngredients = MOCK_INGREDIENTS.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const totalMacros = useMemo(() => {
    return ingredients.reduce((acc, item) => ({
      calories: acc.calories + (item.calories * item.grams / 100),
      protein: acc.protein + (item.protein * item.grams / 100),
      carbs: acc.carbs + (item.carbs * item.grams / 100),
      fat: acc.fat + (item.fat * item.grams / 100),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
  }, [ingredients])

  const myMacros = useMemo(() => {
    const ratio = myServings / totalServings
    return {
      calories: totalMacros.calories * ratio,
      protein: totalMacros.protein * ratio,
      carbs: totalMacros.carbs * ratio,
      fat: totalMacros.fat * ratio,
    }
  }, [totalMacros, myServings, totalServings])

  const handleAddIngredient = (ing: any) => {
    setIngredients([...ingredients, { ...ing, grams: 100 }])
    setSearchQuery('')
  }

  const updateGrams = (index: number, grams: number) => {
    const newIng = [...ingredients]
    newIng[index].grams = grams
    setIngredients(newIng)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 bg-[#0a0a0a] overflow-y-auto"
    >
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 -ml-2 text-white/50 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold text-white tracking-tight">Mom's Kitchen Splitter</h2>
        </div>
        <button onClick={onClose} className="px-4 py-1.5 rounded-full bg-accent text-black font-semibold text-sm active:scale-95 transition-transform">
          Save Recipe
        </button>
      </div>

      <div className="p-4 space-y-8 pb-32">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">Recipe Name</label>
            <input 
              type="text" 
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              placeholder="e.g., Mom's Sunday Chicken Curry"
              className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">Add Raw Ingredients for the ENTIRE pot</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search raw ingredients..."
                className="w-full bg-[#121212] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 transition-all"
              />
            </div>
            
            {searchQuery && (
              <div className="mt-2 bg-[#1a1a1a] border border-white/5 rounded-xl overflow-hidden">
                {filteredIngredients.map(ing => (
                  <button 
                    key={ing.id}
                    onClick={() => handleAddIngredient(ing)}
                    className="w-full flex items-center justify-between p-3 hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors text-left"
                  >
                    <span className="text-sm text-white/80">{ing.name}</span>
                    <Plus size={16} className="text-accent" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {ingredients.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider">Ingredients in Pot</h3>
            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[#121212] rounded-xl border border-white/5">
                  <span className="text-sm font-medium text-white/90">{ing.name}</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={ing.grams}
                      onChange={(e) => updateGrams(i, parseInt(e.target.value) || 0)}
                      className="w-20 bg-black border border-white/10 rounded-lg px-2 py-1 text-right text-sm text-white focus:outline-none focus:border-accent/50"
                    />
                    <span className="text-xs text-white/50">g</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-[#121212] border border-accent/20 rounded-2xl p-5 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Calculator size={100} />
          </div>
          
          <div className="relative">
            <h3 className="text-lg font-semibold text-white mb-1">Your Portion</h3>
            <p className="text-xs text-white/50 mb-6">Calculate exactly what you ate from the total pot.</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-white/40 block mb-1.5">Total Pot Yields</label>
                <div className="flex items-center bg-black rounded-xl p-1 border border-white/5">
                  <input 
                    type="number"
                    value={totalServings}
                    onChange={(e) => setTotalServings(parseInt(e.target.value) || 1)}
                    className="w-full bg-transparent text-center text-lg font-semibold text-white focus:outline-none"
                  />
                  <span className="text-xs text-white/50 pr-3">katoris</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-accent block mb-1.5">You Ate</label>
                <div className="flex items-center bg-accent/10 rounded-xl p-1 border border-accent/20">
                  <input 
                    type="number"
                    value={myServings}
                    onChange={(e) => setMyServings(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent text-center text-lg font-semibold text-accent focus:outline-none"
                  />
                  <span className="text-xs text-accent/70 pr-3">katoris</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-white/70">Your Macros</span>
                <span className="text-sm font-bold text-white">{Math.round(myMacros.calories)} kcal</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-black rounded-lg p-3 border border-white/5">
                  <span className="text-[10px] uppercase text-emerald-400 block mb-1">Protein</span>
                  <span className="text-sm font-semibold text-white">{Math.round(myMacros.protein)}g</span>
                </div>
                <div className="bg-black rounded-lg p-3 border border-white/5">
                  <span className="text-[10px] uppercase text-blue-400 block mb-1">Carbs</span>
                  <span className="text-sm font-semibold text-white">{Math.round(myMacros.carbs)}g</span>
                </div>
                <div className="bg-black rounded-lg p-3 border border-white/5">
                  <span className="text-[10px] uppercase text-orange-400 block mb-1">Fat</span>
                  <span className="text-sm font-semibold text-white">{Math.round(myMacros.fat)}g</span>
                </div>
              </div>
            </div>
            
            <button onClick={onClose} className="w-full mt-6 py-3.5 rounded-xl bg-accent text-black font-bold tracking-wide flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <Check size={18} />
              Log My Portion
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
