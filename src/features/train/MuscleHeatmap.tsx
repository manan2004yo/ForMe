import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Activity, Zap, Info } from 'lucide-react'
import { clsx } from 'clsx'
import { useProgressStore } from '@/store/progressStore'
import type { MuscleGroup } from '@/types'

const COLORS = {
  low: 'rgba(255, 255, 255, 0.1)',       // Rested (cool)
  medium: 'rgba(234, 179, 8, 0.6)',      // Moderate (yellow)
  high: 'rgba(249, 115, 22, 0.8)',       // Fatigued (orange)
  critical: 'rgba(239, 68, 68, 0.9)'     // Overworked (red)
}

function getStatusForVolume(volume: number) {
  if (volume === 0) return 'low'
  if (volume <= 10) return 'medium'
  if (volume <= 20) return 'high'
  return 'critical'
}

export function MuscleHeatmap() {
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const { workoutLogs } = useProgressStore()

  const dynamicMuscleGroups = useMemo(() => {
    const volumeMap = {
      chest: 0,
      back: 0,
      legs: 0,
      arms: 0,
      shoulders: 0,
      core: 0
    }

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    workoutLogs.forEach(log => {
      if (new Date(log.createdAt) >= sevenDaysAgo) {
        log.exercises.forEach(ex => {
          const m = ex.muscleGroup
          const sets = ex.sets.length
          
          if (m === 'chest') volumeMap.chest += sets
          else if (m === 'back') volumeMap.back += sets
          else if (m === 'shoulders') volumeMap.shoulders += sets
          else if (m === 'core') volumeMap.core += sets
          else if (['biceps', 'triceps', 'forearms'].includes(m)) volumeMap.arms += sets
          else if (['quads', 'hamstrings', 'glutes', 'calves'].includes(m)) volumeMap.legs += sets
        })
      }
    })

    return [
      { id: 'chest', label: 'Chest', volume: volumeMap.chest, status: getStatusForVolume(volumeMap.chest) },
      { id: 'back', label: 'Back', volume: volumeMap.back, status: getStatusForVolume(volumeMap.back) },
      { id: 'legs', label: 'Legs', volume: volumeMap.legs, status: getStatusForVolume(volumeMap.legs) },
      { id: 'arms', label: 'Arms', volume: volumeMap.arms, status: getStatusForVolume(volumeMap.arms) },
      { id: 'shoulders', label: 'Shoulders', volume: volumeMap.shoulders, status: getStatusForVolume(volumeMap.shoulders) },
      { id: 'core', label: 'Core', volume: volumeMap.core, status: getStatusForVolume(volumeMap.core) }
    ]
  }, [workoutLogs])

  const getStatusColor = (status: string) => COLORS[status as keyof typeof COLORS]

  return (
    <div className="bg-[#121212] border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-8">
        <div>
          <h2 className="text-sm font-medium text-white/50 uppercase tracking-widest mb-1">Fatigue Heatmap</h2>
          <p className="text-xs text-white/40">Real-time recovery (last 7 days)</p>
        </div>
        <div className="bg-accent/10 p-2 rounded-xl text-accent">
          <Activity size={20} />
        </div>
      </div>

      <div className="relative w-full max-w-[200px] aspect-[1/2] mb-6">
        <svg viewBox="0 0 100 200" className="w-full h-full drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
          {/* Head & Neck */}
          <path d="M 40 20 C 40 10, 60 10, 60 20 C 60 30, 55 35, 55 40 L 45 40 C 45 35, 40 30, 40 20 Z" fill="rgba(255,255,255,0.05)" />
          
          {/* Shoulders */}
          <motion.path 
            d="M 30 45 C 20 45, 15 50, 15 60 L 25 65 L 45 40 Z" 
            fill={getStatusColor(dynamicMuscleGroups.find(m => m.id === 'shoulders')?.status || 'low')} 
            onMouseEnter={() => setActiveGroup('shoulders')}
            onMouseLeave={() => setActiveGroup(null)}
            className="cursor-pointer transition-colors duration-300"
          />
          <motion.path 
            d="M 70 45 C 80 45, 85 50, 85 60 L 75 65 L 55 40 Z" 
            fill={getStatusColor(dynamicMuscleGroups.find(m => m.id === 'shoulders')?.status || 'low')} 
            onMouseEnter={() => setActiveGroup('shoulders')}
            onMouseLeave={() => setActiveGroup(null)}
            className="cursor-pointer transition-colors duration-300"
          />

          {/* Chest */}
          <motion.path 
            d="M 35 45 L 65 45 L 65 65 C 55 75, 45 75, 35 65 Z" 
            fill={getStatusColor(dynamicMuscleGroups.find(m => m.id === 'chest')?.status || 'low')} 
            onMouseEnter={() => setActiveGroup('chest')}
            onMouseLeave={() => setActiveGroup(null)}
            className="cursor-pointer transition-colors duration-300"
          />

          {/* Core/Abs */}
          <motion.path 
            d="M 38 70 L 62 70 L 60 100 L 40 100 Z" 
            fill={getStatusColor(dynamicMuscleGroups.find(m => m.id === 'core')?.status || 'low')} 
            onMouseEnter={() => setActiveGroup('core')}
            onMouseLeave={() => setActiveGroup(null)}
            className="cursor-pointer transition-colors duration-300"
          />

          {/* Arms (Left & Right) */}
          <motion.path 
            d="M 15 65 L 25 70 L 20 100 L 10 100 Z" 
            fill={getStatusColor(dynamicMuscleGroups.find(m => m.id === 'arms')?.status || 'low')} 
            onMouseEnter={() => setActiveGroup('arms')}
            onMouseLeave={() => setActiveGroup(null)}
            className="cursor-pointer transition-colors duration-300"
          />
          <motion.path 
            d="M 85 65 L 75 70 L 80 100 L 90 100 Z" 
            fill={getStatusColor(dynamicMuscleGroups.find(m => m.id === 'arms')?.status || 'low')} 
            onMouseEnter={() => setActiveGroup('arms')}
            onMouseLeave={() => setActiveGroup(null)}
            className="cursor-pointer transition-colors duration-300"
          />

          {/* Legs */}
          <motion.path 
            d="M 35 105 L 48 105 L 45 180 L 30 180 Z" 
            fill={getStatusColor(dynamicMuscleGroups.find(m => m.id === 'legs')?.status || 'low')} 
            onMouseEnter={() => setActiveGroup('legs')}
            onMouseLeave={() => setActiveGroup(null)}
            className="cursor-pointer transition-colors duration-300"
          />
          <motion.path 
            d="M 52 105 L 65 105 L 70 180 L 55 180 Z" 
            fill={getStatusColor(dynamicMuscleGroups.find(m => m.id === 'legs')?.status || 'low')} 
            onMouseEnter={() => setActiveGroup('legs')}
            onMouseLeave={() => setActiveGroup(null)}
            className="cursor-pointer transition-colors duration-300"
          />
        </svg>

        {activeGroup && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/90 backdrop-blur-md border border-white/10 p-4 rounded-2xl pointer-events-none z-10 w-max shadow-2xl"
          >
            <div className="text-xs text-white/50 uppercase tracking-widest mb-1 font-semibold">{activeGroup}</div>
            <div className="text-white font-bold text-2xl tracking-tight">
              {dynamicMuscleGroups.find(m => m.id === activeGroup)?.volume} <span className="text-xs font-medium text-white/50 tracking-normal">sets logged</span>
            </div>
            {dynamicMuscleGroups.find(m => m.id === activeGroup)?.volume === 0 && (
              <div className="text-xs text-emerald-400 mt-2 font-medium bg-emerald-400/10 px-2 py-1 rounded inline-block">Fully rested</div>
            )}
            {dynamicMuscleGroups.find(m => m.id === activeGroup)?.volume! > 20 && (
              <div className="text-xs text-red-400 mt-2 font-medium bg-red-400/10 px-2 py-1 rounded inline-block">Needs recovery</div>
            )}
          </motion.div>
        )}
      </div>

      <div className="w-full grid grid-cols-2 gap-2 mt-4">
        {dynamicMuscleGroups.map(mg => (
          <div 
            key={mg.id} 
            className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
            onMouseEnter={() => setActiveGroup(mg.id)}
            onMouseLeave={() => setActiveGroup(null)}
          >
            <span className="text-xs text-white/70 font-medium">{mg.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">{mg.volume}</span>
              <div className="w-2 h-2 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ backgroundColor: getStatusColor(mg.status) }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
