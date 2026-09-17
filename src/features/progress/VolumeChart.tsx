import { StatCard } from '@/components/shared'
import { useProgressStore } from '@/store/progressStore'
import { format, parseISO } from 'date-fns'
import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export function VolumeChart() {
  const { workoutLogs } = useProgressStore()

  const data = useMemo(() => {
    if (workoutLogs.length === 0) return []
    
    // Group volume by date
    const volumeByDate: Record<string, number> = {}
    
    workoutLogs.forEach(log => {
      const dateStr = format(parseISO(log.date), 'MM-dd')
      if (!volumeByDate[dateStr]) volumeByDate[dateStr] = 0
      
      log.exercises.forEach(ex => {
        ex.sets.forEach(set => {
          if (set.weight && set.reps) {
            volumeByDate[dateStr] += set.weight * set.reps
          } else if (set.reps) {
            // Bodyweight estimate (e.g. 50kg assumed resistance if no weight specified)
            volumeByDate[dateStr] += 50 * set.reps
          }
        })
      })
    })

    // Convert to sorted array
    return Object.entries(volumeByDate)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, volume]) => ({
        date,
        volume: Math.round(volume)
      }))
  }, [workoutLogs])

  if (workoutLogs.length === 0) return null

  return (
    <StatCard className="mb-4 animate-slide-up" style={{ animationDelay: '250ms' }}>
      <h2 className="text-section text-text-primary mb-6">Workout Volume (kg)</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)', fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '13px', boxShadow: 'var(--shadow-floating)', fontWeight: 600, color: 'var(--text-primary)' }}
              cursor={{ fill: 'var(--border-subtle)', opacity: 0.4 }}
              formatter={(value: any) => [`${value} kg`, 'Total Volume']}
            />
            <Bar dataKey="volume" fill="var(--macro-protein)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </StatCard>
  )
}
