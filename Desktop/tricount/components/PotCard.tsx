'use client'

import { motion } from 'framer-motion'
import { formatCurrency, formatShortDate } from '@/lib/utils/format'
import type { SavingsPot, SavingsTransaction } from '@/lib/supabase/types'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { differenceInDays, parseISO } from 'date-fns'

interface PotCardProps {
  pot: SavingsPot
  transactions: SavingsTransaction[]
  currency?: string
}

export function PotCard({ pot, transactions, currency = 'EUR' }: PotCardProps) {
  const balance = transactions.reduce((acc, t) => {
    return t.type === 'deposit' ? acc + t.amount : acc - t.amount
  }, 0)

  const pct = pot.target_amount ? Math.min((balance / pot.target_amount) * 100, 100) : null

  let projection: string | null = null
  if (pot.target_amount && pot.target_date && transactions.length > 0) {
    const remaining = pot.target_amount - balance
    const oldestTx = transactions[transactions.length - 1]
    const daysActive = Math.max(1, differenceInDays(new Date(), parseISO(oldestTx.occurred_at)))
    const dailyRate = balance / daysActive
    if (dailyRate > 0) {
      const daysNeeded = Math.ceil(remaining / dailyRate)
      const projectedDate = new Date()
      projectedDate.setDate(projectedDate.getDate() + daysNeeded)
      const target = parseISO(pot.target_date)
      if (projectedDate <= target) {
        projection = `Objectif atteint avant ${formatShortDate(pot.target_date)}`
      }
    }
  }

  return (
    <Link href={`/savings/${pot.id}`}>
      <motion.div
        whileHover={{ y: -2 }}
        className={cn(
          'rounded-2xl p-5 border border-zinc-200/50 dark:border-zinc-800',
          'bg-white dark:bg-zinc-900',
          'cursor-pointer shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)]',
          'transition-shadow'
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: pot.color }}
              />
              <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 text-sm">{pot.name}</h3>
              {!pot.is_shared && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                  perso
                </span>
              )}
            </div>
            {pot.target_date && (
              <p className="text-xs text-zinc-400 mt-0.5">Objectif : {formatShortDate(pot.target_date)}</p>
            )}
          </div>
          <div className="text-right">
            <p className="font-mono font-semibold text-zinc-800 dark:text-zinc-100 text-sm">
              {formatCurrency(balance, currency)}
            </p>
            {pot.target_amount && (
              <p className="text-xs text-zinc-400 font-mono">/ {formatCurrency(pot.target_amount, currency)}</p>
            )}
          </div>
        </div>

        {pct !== null && (
          <div className="space-y-1">
            <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: pot.color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-zinc-400">
              <span>{Math.round(pct)}%</span>
              {projection && <span className="text-emerald-500">{projection}</span>}
            </div>
          </div>
        )}
      </motion.div>
    </Link>
  )
}
