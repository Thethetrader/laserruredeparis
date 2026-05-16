'use client'

import { motion } from 'framer-motion'
import { formatCurrency, formatMonth } from '@/lib/utils/format'
import { computeBudgetStatus, budgetStatusColor } from '@/lib/utils/balance'
import { parseISO } from 'date-fns'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface MonthCardProps {
  month: string // 'YYYY-MM'
  spent: number
  budget: number
  currency?: string
  index?: number
}

export function MonthCard({ month, spent, budget, currency = 'EUR', index = 0 }: MonthCardProps) {
  const status = computeBudgetStatus(spent, budget)
  const color = budgetStatusColor(status)
  const pct = budget > 0 ? Math.round((spent / budget) * 100) : null
  const [year, m] = month.split('-')
  const label = formatMonth(parseISO(month + '-01'))

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link
        href={`/history/${year}/${m}`}
        className={cn(
          'block rounded-2xl p-4 border border-zinc-200/50 dark:border-zinc-800',
          'bg-white dark:bg-zinc-900',
          'hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.1)] transition-shadow',
          'active:scale-[0.98] transition-transform'
        )}
      >
        <p className="text-xs text-zinc-400 dark:text-zinc-500 capitalize mb-1">{label}</p>
        <p className="font-mono font-semibold text-zinc-800 dark:text-zinc-100 text-sm">
          {formatCurrency(spent, currency)}
        </p>
        {pct !== null && (
          <div className="mt-2 space-y-1">
            <div className="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
              />
            </div>
            <p className="text-[10px] font-mono" style={{ color }}>{pct}%</p>
          </div>
        )}
      </Link>
    </motion.div>
  )
}
