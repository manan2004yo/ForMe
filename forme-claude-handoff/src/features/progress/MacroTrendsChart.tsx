import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'
import { StatCard } from '@/components/shared'
import { useFoodLogStore } from '@/store/foodLogStore'
import { format, subDays } from 'date-fns'
import type { NutritionInfo } from '@/types'

export function MacroTrendsChart({ calTarget }: { calTarget: number }) {
  const { entries } = useFoodLogStore()

  const data = useMemo(() => {
    // Generate last 30 days
    return Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i)
      const dateStr = format(date, 'yyyy-MM-dd')
      
      const dayEntries = entries.filter(e => e.date === dateStr).flatMap(e => e.foods)
      const totalCals = dayEntries.reduce((sum, f) => sum + f.nutrition.calories, 0)
      const totalProtein = dayEntries.reduce((sum, f) => sum + f.nutrition.protein, 0)
      const totalCarbs = dayEntries.reduce((sum, f) => sum + f.nutrition.carbs, 0)
      const totalFat = dayEntries.reduce((sum, f) => sum + f.nutrition.fat, 0)

      // Convert macros to calories for stacked bar chart (Protein/Carbs = 4kcal/g, Fat = 9kcal/g)
      return {
        date: format(date, 'MM-dd'),
        rawDate: dateStr,
        proteinCals: totalProtein * 4,
        carbsCals: totalCarbs * 4,
        fatCals: totalFat * 9,
        totalCals,
      }
    })
  }, [entries])

  return (
    <StatCard className="mb-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
      <h2 className="text-section text-text-primary mb-6">Macro Intake Trends</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)', fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '13px', boxShadow: 'var(--shadow-floating)', fontWeight: 600, color: 'var(--text-primary)' }}
              formatter={(value: any, name: any) => {
                if (name === 'Protein') return [`${Math.round(value / 4)}g`, name]
                if (name === 'Carbs') return [`${Math.round(value / 4)}g`, name]
                if (name === 'Fat') return [`${Math.round(value / 9)}g`, name]
                return [`${Math.round(value)} kcal`, name]
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} />
            <ReferenceLine y={calTarget} stroke="var(--status-warning)" strokeDasharray="4 4" label={{ value: 'Target', fill: 'var(--text-tertiary)', fontSize: 10, position: 'insideTopLeft' }} />
            <Bar dataKey="proteinCals" name="Protein" stackId="a" fill="var(--macro-protein)" radius={[0, 0, 4, 4]} />
            <Bar dataKey="carbsCals" name="Carbs" stackId="a" fill="var(--macro-carbs)" />
            <Bar dataKey="fatCals" name="Fat" stackId="a" fill="var(--macro-fat)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </StatCard>
  )
}
