'use client'

import { motion } from 'framer-motion'
import { computeBudgetStatus, budgetStatusColor } from '@/lib/utils/balance'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

interface BudgetGaugeProps {
  name: string
  icon?: string
  color?: string
  spent: number
  budget: number
  currency?: string
  className?: string
  inline?: boolean
}

export function BudgetGauge({ name, icon, color, spent, budget, currency = 'EUR', className, inline }: BudgetGaugeProps) {
  const status = computeBudgetStatus(spent, budget)
  const statusColor = budgetStatusColor(status)
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0

  if (inline) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        {color && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />}
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-24 flex-shrink-0 truncate">{name}</span>
        <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          {budget > 0 && (
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: statusColor }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          )}
        </div>
        <div className="flex items-center gap-1 text-xs font-mono flex-shrink-0">
          <span style={{ color: statusColor }}>{formatCurrency(spent, currency)}</span>
          {budget > 0 && <><span className="text-zinc-300 dark:text-zinc-600">/</span><span className="text-zinc-400">{formatCurrency(budget, currency)}</span></>}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {color && (
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
          )}
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">{name}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400 flex-shrink-0">
          <span style={{ color: statusColor }}>{formatCurrency(spent, currency)}</span>
          {budget > 0 && <span className="text-zinc-300 dark:text-zinc-600">/</span>}
          {budget > 0 && <span>{formatCurrency(budget, currency)}</span>}
        </div>
      </div>

      {budget > 0 && (
        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: statusColor }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      )}
    </div>
  )
}
