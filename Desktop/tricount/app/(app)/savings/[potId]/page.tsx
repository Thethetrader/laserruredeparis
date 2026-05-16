'use client'

import { useParams } from 'next/navigation'
import { useSavingsPots, useSavingsTransactions } from '@/lib/queries/useSavings'
import { useCouple } from '@/lib/queries/useCouple'
import { formatCurrency, formatShortDate } from '@/lib/utils/format'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { CaretLeft, ArrowUp, ArrowDown } from '@phosphor-icons/react'

export default function PotDetailPage() {
  const { potId } = useParams<{ potId: string }>()
  const { data: couple } = useCouple()
  const { data: pots = [] } = useSavingsPots()
  const { data: transactions = [], isLoading } = useSavingsTransactions(potId)

  const pot = pots.find(p => p.id === potId)
  const currency = couple?.currency ?? 'EUR'

  const balance = transactions.reduce((acc, tx) => tx.type === 'deposit' ? acc + tx.amount : acc - tx.amount, 0)

  return (
    <div className="pt-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/savings" className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <CaretLeft size={18} className="text-zinc-500" />
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
          {pot?.name ?? 'Pot'}
        </h1>
      </div>

      {pot && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/50 dark:border-zinc-800">
          <p className="text-xs text-zinc-400 mb-1">Solde</p>
          <p className="font-mono text-2xl font-semibold" style={{ color: pot.color }}>{formatCurrency(balance, currency)}</p>
          {pot.target_amount && (
            <p className="text-xs text-zinc-400 mt-1">Objectif : {formatCurrency(pot.target_amount, currency)}</p>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-400 text-sm">Aucune transaction</p>
        </div>
      ) : (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Transactions</h2>
          {transactions.map(tx => (
            <div key={tx.id} className="flex items-center gap-3 bg-white dark:bg-zinc-900 rounded-2xl px-4 py-3 border border-zinc-200/50 dark:border-zinc-800">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${tx.type === 'deposit' ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
                {tx.type === 'deposit'
                  ? <ArrowDown size={16} className="text-emerald-500" />
                  : <ArrowUp size={16} className="text-red-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">{tx.description ?? (tx.type === 'deposit' ? 'Versement' : 'Retrait')}</p>
                <p className="text-xs text-zinc-400">{formatShortDate(tx.occurred_at)}</p>
              </div>
              <span className={`font-mono font-semibold text-sm ${tx.type === 'deposit' ? 'text-emerald-500' : 'text-red-500'}`}>
                {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
