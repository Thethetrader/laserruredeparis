import type { Expense, ExpenseShare, Settlement } from '@/lib/supabase/types'

export function computeBalance(
  userId: string,
  expenses: Expense[],
  shares: ExpenseShare[],
  settlements: Settlement[]
): number {
  // Centimes pour éviter les dérives float
  let balance = 0

  for (const expense of expenses) {
    if (expense.paid_by === userId) {
      balance += Math.round(expense.amount * 100)
    }
  }

  for (const share of shares) {
    if (share.user_id === userId) {
      balance -= Math.round(share.share_amount * 100)
    }
  }

  for (const s of settlements) {
    if (s.to_user === userId) {
      balance += Math.round(s.amount * 100)
    }
    if (s.from_user === userId) {
      balance -= Math.round(s.amount * 100)
    }
  }

  return balance / 100
}

export type BudgetStatus = 'safe' | 'warning' | 'alert' | 'over'

export function computeBudgetStatus(spent: number, budget: number): BudgetStatus {
  if (budget === 0) return 'safe'
  const pct = spent / budget
  if (pct < 0.7) return 'safe'
  if (pct < 0.9) return 'warning'
  if (pct <= 1) return 'alert'
  return 'over'
}

export function budgetStatusColor(status: BudgetStatus): string {
  switch (status) {
    case 'safe': return '#22c55e'
    case 'warning': return '#eab308'
    case 'alert': return '#f97316'
    case 'over': return '#ef4444'
  }
}

export function computeProjection(spent: number, dayOfMonth: number, daysInMonth: number): number {
  if (dayOfMonth === 0) return 0
  return (spent / dayOfMonth) * daysInMonth
}

export function computeSavingsRate(totalSaved: number, totalIncome: number): number {
  if (totalIncome === 0) return 0
  return Math.max(0, Math.min(100, (totalSaved / totalIncome) * 100))
}

export function getDayOfMonth(date: Date = new Date()): number {
  return date.getDate()
}

export function getDaysInMonth(monthDate: string): number {
  const d = new Date(monthDate)
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}
