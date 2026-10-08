import { format } from 'date-fns'

/**
 * Returns the current local calendar day in YYYY-MM-DD format.
 * This is the canonical authority for TODAY, FUEL, PROGRESS, HYDRATION, RECOVERY.
 */
export function getTodayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/**
 * Derives the local calendar day (YYYY-MM-DD) from a given historical timestamp.
 * This preserves the exact historical timestamp while correctly aligning it to the local calendar day.
 */
export function toLocalDateString(timestamp: number | string | Date): string {
  const dateObj = timestamp instanceof Date ? timestamp : new Date(timestamp)
  return format(dateObj, 'yyyy-MM-dd')
}
