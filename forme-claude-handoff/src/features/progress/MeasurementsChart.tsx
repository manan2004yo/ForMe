import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { StatCard } from '@/components/shared'
import type { WaistEntry } from '@/types'

export function MeasurementsChart({ entries }: { entries: WaistEntry[] }) {
  const data = useMemo(() => {
    // Reverse so chronological order (oldest to newest)
    return [...entries].reverse().map(e => ({
      date: e.date.slice(5), // MM-DD
      waist: e.waistCm || null,
      chest: e.chestCm || null,
      arms: e.armsCm || null,
      thighs: e.thighsCm || null,
      hips: e.hipsCm || null,
    }))
  }, [entries])

  if (entries.length === 0) return null

  return (
    <StatCard className="mb-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
      <h2 className="text-section text-text-primary mb-6">Body Measurements</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)', fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip 
              contentStyle={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '13px', boxShadow: 'var(--shadow-floating)', fontWeight: 600, color: 'var(--text-primary)' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} />
            
            <Line type="monotone" name="Waist" dataKey="waist" stroke="var(--macro-protein)" strokeWidth={3} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" name="Chest" dataKey="chest" stroke="var(--macro-carbs)" strokeWidth={3} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" name="Arms" dataKey="arms" stroke="var(--macro-fat)" strokeWidth={3} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" name="Thighs" dataKey="thighs" stroke="var(--macro-fiber)" strokeWidth={3} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" name="Hips" dataKey="hips" stroke="var(--accent)" strokeWidth={3} dot={{ r: 3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </StatCard>
  )
}
