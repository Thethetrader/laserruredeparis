import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatMonth(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  const str = format(d, 'MMMM yyyy', { locale: fr })
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'd MMM yyyy', { locale: fr })
}

export function formatDay(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'd', { locale: fr })
}

export function toMonthDate(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`
}

export function getMonthBounds(monthDate: string): { start: string; end: string } {
  const d = parseISO(monthDate)
  const start = format(d, 'yyyy-MM-01')
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  const end = format(d, `yyyy-MM-${String(lastDay).padStart(2, '0')}`)
  return { start, end }
}

export function getDaysInMonth(monthDate: string): number {
  const d = parseISO(monthDate)
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

export function getDayOfMonth(date: Date = new Date()): number {
  return date.getDate()
}
