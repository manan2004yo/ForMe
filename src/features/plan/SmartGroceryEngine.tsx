import { useState } from 'react'
import { motion } from 'framer-motion'
import { Wallet, Sparkles, Plus, ArrowLeft, Check, ShoppingBag } from 'lucide-react'

const BUDGET_FOODS = [
  { name: 'Soya Chunks', protein: 52, costPer100g: 15, category: 'Protein' },
  { name: 'Eggs (Whole)', protein: 13, costPer100g: 12, category: 'Protein' },
  { name: 'Moong Dal', protein: 24, costPer100g: 14, category: 'Protein/Carbs' },
  { name: 'Peanuts', protein: 25, costPer100g: 18, category: 'Fats/Protein' },
  { name: 'Paneer', protein: 18, costPer100g: 35, category: 'Protein/Fats' },
  { name: 'Oats', protein: 13, costPer100g: 20, category: 'Carbs' },
  { name: 'White Rice', protein: 2.6, costPer100g: 6, category: 'Carbs' },
]

export function SmartGroceryEngine({ onClose }: { onClose: () => void }) {
  const [budget, setBudget] = useState(1500)
  const [generatedList, setGeneratedList] = useState<any[]>([])

  const generateList = () => {
    let remaining = budget;
    const list = [];
    
    // Simple greedy algorithm to maximize protein per rupee
    const sorted = [...BUDGET_FOODS].sort((a, b) => (b.protein / b.costPer100g) - (a.protein / a.costPer100g));
    
    for (const food of sorted) {
      if (remaining >= food.costPer100g * 5) { // Buy in 500g batches
        const cost = food.costPer100g * 5;
        list.push({ ...food, amount: '500g', cost });
        remaining -= cost;
      }
    }
    
    if (remaining > 0 && sorted.length > 0) {
       // Buy rice with the rest
       const rice = sorted.find(f => f.name === 'White Rice')
       if (rice) {
         const kg = Math.floor(remaining / rice.costPer100g / 10);
         if (kg > 0) {
           list.push({ ...rice, amount: `${kg}kg`, cost: kg * 10 * rice.costPer100g });
         }
       }
    }
    setGeneratedList(list);
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 bg-[#0a0a0a] overflow-y-auto"
    >
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/80 backdrop-blur-md px-4 py-4 flex items-center gap-3 border-b border-white/5">
        <button onClick={onClose} className="p-2 -ml-2 text-white/50 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold text-white tracking-tight">Hostel & Budget Engine</h2>
      </div>

      <div className="p-5 space-y-8">
        <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/5 border border-emerald-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
              <Wallet size={24} />
            </div>
            <div>
              <h3 className="text-white font-medium">Weekly Budget</h3>
              <p className="text-xs text-white/50">Optimize macros per rupee</p>
            </div>
          </div>
          
          <div className="flex items-end gap-2 mb-6">
            <span className="text-2xl font-bold text-white/50">₹</span>
            <input 
              type="number" 
              value={budget}
              onChange={e => setBudget(parseInt(e.target.value) || 0)}
              className="bg-transparent text-4xl font-black text-white w-full border-b-2 border-emerald-500/30 focus:border-emerald-400 focus:outline-none pb-1"
            />
          </div>

          <button onClick={generateList} className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold tracking-wide flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Sparkles size={18} />
            Generate Smart List
          </button>
        </div>

        {generatedList.length > 0 ? (
          <div>
            <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShoppingBag size={14} className="text-emerald-400" /> Your Optimized Shopping List
            </h3>
            <div className="space-y-3 bg-[#121212] p-4 rounded-xl border border-white/5">
              {generatedList.map((food, i) => (
                <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white">{food.amount}</span>
                    <span className="text-sm text-white/80">{food.name}</span>
                  </div>
                  <span className="text-sm text-emerald-400 font-bold">₹{food.cost}</span>
                </div>
              ))}
              <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                <span className="text-sm text-white/50 font-medium">Total Cost</span>
                <span className="text-lg text-emerald-400 font-black">₹{generatedList.reduce((acc, curr) => acc + curr.cost, 0)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-4">High ROI Protein Sources</h3>
            <div className="space-y-3">
              {BUDGET_FOODS.map((food, i) => (
                <div key={i} className="bg-[#121212] border border-white/5 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-white/90">{food.name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-emerald-400 font-medium">{food.protein}g protein / 100g</span>
                      <span className="text-[10px] text-white/40 font-medium">₹{food.costPer100g} / 100g</span>
                    </div>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                    <Plus size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
