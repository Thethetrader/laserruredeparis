'use client'

import { useState } from 'react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { MonthCard } from '@/components/MonthCard'
import { useAllExpenses } from '@/lib/queries/useExpenses'
import { useBudgets } from '@/lib/queries/useBudget'
import { useCouple } from '@/lib/queries/useCouple'
import type { Expense } from '@/lib/supabase/types'

export default function HistoryPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const { data: couple } = useCouple()
  const { data: expenses = [] } = useAllExpenses()
  const currency = couple?.currency ?? 'EUR'

  const months = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0')
    return `${year}-${m}`
  })

  const spentByMonth = new Map<string, number>()
  for (const e of expenses as Expense[]) {
    const m = e.spent_at.slice(0, 7)
    if (m.startsWith(String(year))) {
      spentByMonth.set(m, (spentByMonth.get(m) ?? 0) + e.amount)
    }
  }

  return (
    <div className="pt-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">Historique</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setYear(y => y - 1)}
            className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <CaretLeft size={16} weight="bold" className="text-zinc-500" />
          </button>
          <span className="font-mono text-sm font-semibold text-zinc-700 dark:text-zinc-300">{year}</span>
          <button
            onClick={() => setYear(y => Math.min(y + 1, new Date().getFullYear()))}
            disabled={year >= new Date().getFullYear()}
            className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30"
          >
            <CaretRight size={16} weight="bold" className="text-zinc-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {months.map((m, i) => (
          <MonthCard
            key={m}
            month={m}
            spent={spentByMonth.get(m) ?? 0}
            budget={0}
            currency={currency}
            index={i}
          />
        ))}
      </div>
    </div>
  )
}
