// ============================================================
// FORME — Macro History Sheet
// ============================================================
// Shows 7-day, 30-day, and 90-day macro trend charts.
// Uses Recharts which is already in the project dependencies.
// All data comes from getRecentFoodLogs — no new Firebase calls needed.
// ============================================================

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { getRecentFoodLogs } from '@/lib/firebase/dataService'
import { useAuthStore } from '@/store/authStore'
import { useUserStore } from '@/store/userStore'
import { format, parseISO } from 'date-fns'

type TimeRange = '7' | '30' | '90'
type MacroView = 'calories' | 'protein' | 'carbs' | 'fat'

interface DayDataPoint {
  date: string
  displayDate: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface MacroHistorySheetProps {
  isOpen: boolean
  onClose: () => void
}

const MACRO_CONFIG: Record<MacroView, { label: string; color: string; unit: string }> = {
  calories: { label: 'Calories', color: 'var(--accent)', unit: 'kcal' },
  protein: { label: 'Protein', color: 'var(--macro-protein)', unit: 'g' },
  carbs: { label: 'Carbs', color: 'var(--macro-carbs)', unit: 'g' },
  fat: { label: 'Fat', color: 'var(--macro-fat)', unit: 'g' },
}

export function MacroHistorySheet({ isOpen, onClose }: MacroHistorySheetProps) {
  const { user } = useAuthStore()
  const { metrics } = useUserStore()
  const [timeRange, setTimeRange] = useState<TimeRange>('7')
  const [macroView, setMacroView] = useState<MacroView>('calories')
  const [data, setData] = useState<DayDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !user?.uid) return
    setIsLoading(true)

    getRecentFoodLogs(user.uid, parseInt(timeRange))
      .then(logs => {
        // Group logs by date and sum nutrition
        const byDate = new Map<string, DayDataPoint>()

        logs.forEach(log => {
          const existing = byDate.get(log.date)
          if (existing) {
            existing.calories += log.totals.calories
            existing.protein += log.totals.protein
            existing.carbs += log.totals.carbs
            existing.fat += log.totals.fat
          } else {
            byDate.set(log.date, {
              date: log.date,
              displayDate: format(parseISO(log.date), timeRange === '7' ? 'EEE' : 'MMM d'),
              calories: Math.round(log.totals.calories),
              protein: parseFloat(log.totals.protein.toFixed(1)),
              carbs: parseFloat(log.totals.carbs.toFixed(1)),
              fat: parseFloat(log.totals.fat.toFixed(1)),
            })
          }
        })

        // Sort by date ascending
        const sorted = Array.from(byDate.values())
          .sort((a, b) => a.date.localeCompare(b.date))

        setData(sorted)
      })
      .finally(() => setIsLoading(false))
  }, [isOpen, user?.uid, timeRange])

  const config = MACRO_CONFIG[macroView]

  // Reference line value (the user's target for this macro)
  const referenceValue =
    macroView === 'calories' ? metrics?.caloricTarget :
    macroView === 'protein' ? metrics?.proteinTarget :
    null

  // Summary stats
  const values = data.map(d => d[macroView])
  const avg = values.length > 0
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : 0
  const daysHitTarget = referenceValue
    ? values.filter(v =>
        macroView === 'calories'
          ? Math.abs(v - referenceValue) < 200
          : v >= referenceValue * 0.9
      ).length
    : null

  // Custom tooltip
  function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 shadow-xl">
        <p className="text-xs text-white/40 mb-1">{label}</p>
        <p className="text-sm font-bold" style={{ color: config.color }}>
          {payload[0].value}{config.unit}
        </p>
        {referenceValue && (
          <p className="text-xs text-white/30">
            Target: {referenceValue}{config.unit}
          </p>
        )}
      </div>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-[#0f0f0f] border-t border-white/10 rounded-t-3xl"
            style={{ maxHeight: '88vh' }}
          >
            <div className="flex flex-col" style={{ maxHeight: '88vh' }}>
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 shrink-0">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-accent" />
                  <h2 className="text-lg font-bold text-white">Nutrition History</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-5">
                {/* Time range selector */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5">
                  {(['7', '30', '90'] as TimeRange[]).map(range => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        timeRange === range
                          ? 'bg-white text-black'
                          : 'text-white/40 hover:text-white'
                      }`}
                    >
                      {range}D
                    </button>
                  ))}
                </div>

                {/* Macro selector */}
                <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                  {(Object.entries(MACRO_CONFIG) as [MacroView, typeof config][]).map(
                    ([key, cfg]) => (
                      <button
                        key={key}
                        onClick={() => setMacroView(key)}
                        className={`shrink-0 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                          macroView === key
                            ? 'text-black border-transparent'
                            : 'bg-white/5 border-white/5 text-white/40 hover:text-white'
                        }`}
                        style={
                          macroView === key
                            ? { backgroundColor: cfg.color, borderColor: cfg.color }
                            : {}
                        }
                      >
                        {cfg.label}
                      </button>
                    )
                  )}
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 rounded-2xl p-3 text-center">
                    <p className="text-lg font-bold text-white tabular-nums">{avg}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">Daily avg</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-3 text-center">
                    <p className="text-lg font-bold text-white tabular-nums">{data.length}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">Days logged</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-3 text-center">
                    <p className="text-lg font-bold tabular-nums" style={{ color: config.color }}>
                      {daysHitTarget ?? '—'}
                    </p>
                    <p className="text-[10px] text-white/30 mt-0.5">Days on target</p>
                  </div>
                </div>

                {/* Chart */}
                {isLoading ? (
                  <div className="skeleton h-48 rounded-2xl" />
                ) : data.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <TrendingUp size={32} className="text-white/10 mb-3" />
                    <p className="text-white/30 text-sm">No data for this period</p>
                    <p className="text-white/20 text-xs mt-1">
                      Log food consistently to see your trends
                    </p>
                  </div>
                ) : (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <XAxis
                          dataKey="displayDate"
                          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {referenceValue && (
                          <ReferenceLine
                            y={referenceValue}
                            stroke={config.color}
                            strokeDasharray="4 4"
                            strokeOpacity={0.4}
                          />
                        )}
                        <Line
                          type="monotone"
                          dataKey={macroView}
                          stroke={config.color}
                          strokeWidth={2.5}
                          dot={{ fill: config.color, r: 3, strokeWidth: 0 }}
                          activeDot={{ r: 5, fill: config.color }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Consistency insight */}
                {daysHitTarget !== null && data.length >= 3 && (
                  <div className={`px-4 py-3 rounded-2xl border ${
                    daysHitTarget >= data.length * 0.7
                      ? 'bg-green-500/10 border-green-500/20'
                      : 'bg-amber-500/10 border-amber-500/20'
                  }`}>
                    <p className={`text-xs font-medium ${
                      daysHitTarget >= data.length * 0.7
                        ? 'text-green-400'
                        : 'text-amber-400'
                    }`}>
                      {daysHitTarget >= data.length * 0.7
                        ? `Strong consistency — you hit your ${config.label.toLowerCase()} target on ${daysHitTarget} of ${data.length} logged days.`
                        : `You hit your ${config.label.toLowerCase()} target on ${daysHitTarget} of ${data.length} logged days. Aim for ${Math.ceil(data.length * 0.7)}+ days for best results.`
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
