'use client'

import { useMemo, useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts'
import { useAllExpenses } from '@/lib/queries/useExpenses'
import { useCouple } from '@/lib/queries/useCouple'
import { useCategories } from '@/lib/queries/useCategories'
import { formatCurrency } from '@/lib/utils/format'
import { Skeleton } from '@/components/ui/skeleton'
import type { Expense } from '@/lib/supabase/types'
import { fr } from 'date-fns/locale'
import { format, parseISO } from 'date-fns'

export default function TrendsPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const { data: couple } = useCouple()
  const { data: expenses = [], isLoading } = useAllExpenses()
  const { data: categories = [] } = useCategories()

  const currency = couple?.currency ?? 'EUR'

  const monthlyData = useMemo(() => {
    const map = new Map<string, Map<string, number>>()
    for (const e of expenses as Expense[]) {
      const m = e.spent_at.slice(0, 7)
      if (!map.has(m)) map.set(m, new Map())
      const catMap = map.get(m)!
      catMap.set('total', (catMap.get('total') ?? 0) + e.amount)
      catMap.set(e.category_id, (catMap.get(e.category_id) ?? 0) + e.amount)
    }

    const months = Array.from({ length: 12 }, (_, i) => {
      const m = `${selectedYear}-${String(i + 1).padStart(2, '0')}`
      const label = format(parseISO(m + '-01'), 'MMM', { locale: fr })
      const catData = map.get(m) ?? new Map()
      const row: Record<string, string | number> = { month: label, total: catData.get('total') ?? 0 }
      for (const cat of categories.slice(0, 3)) {
        row[cat.name] = catData.get(cat.id) ?? 0
      }
      return row
    })
    return months
  }, [expenses, selectedYear, categories])

  const top3 = categories.slice(0, 3)
  const COLORS = ['#e07a5f', '#81b29a', '#457b9d']

  return (
    <div className="pt-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">Tendances</h1>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200/50 dark:border-zinc-800">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            Dépenses mensuelles {selectedYear}
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}€`} />
              <Tooltip formatter={(v: unknown) => formatCurrency(Number(v), currency)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="total" name="Total" stroke="#e07a5f" strokeWidth={2} dot={false} />
              {top3.map((cat, i) => (
                <Line key={cat.id} type="monotone" dataKey={cat.name} stroke={COLORS[i + 1] ?? '#8d99ae'} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Heatmap annuelle */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200/50 dark:border-zinc-800">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Intensité {selectedYear}</h2>
        <HeatmapCalendar expenses={expenses as Expense[]} year={selectedYear} />
      </div>
    </div>
  )
}

function HeatmapCalendar({ expenses, year }: { expenses: Expense[]; year: number }) {
  const dailyMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of expenses) {
      if (e.spent_at.startsWith(String(year))) {
        map.set(e.spent_at, (map.get(e.spent_at) ?? 0) + e.amount)
      }
    }
    return map
  }, [expenses, year])

  const maxAmount = Math.max(...Array.from(dailyMap.values()), 1)

  const months = Array.from({ length: 12 }, (_, mi) => {
    const daysInMonth = new Date(year, mi + 1, 0).getDate()
    const days = Array.from({ length: daysInMonth }, (_, di) => {
      const date = `${year}-${String(mi + 1).padStart(2, '0')}-${String(di + 1).padStart(2, '0')}`
      const amount = dailyMap.get(date) ?? 0
      const intensity = amount > 0 ? Math.min(1, amount / maxAmount) : 0
      return { date, amount, intensity }
    })
    return { month: mi + 1, days }
  })

  return (
    <div className="space-y-2 overflow-x-auto">
      {months.map(({ month, days }) => (
        <div key={month} className="flex items-center gap-1">
          <span className="text-[9px] text-zinc-400 w-6 flex-shrink-0 text-right font-mono">
            {format(new Date(year, month - 1, 1), 'MMM', { locale: fr })}
          </span>
          <div className="flex gap-0.5 flex-wrap">
            {days.map(({ date, amount, intensity }) => (
              <div
                key={date}
                title={amount > 0 ? `${date}: ${amount.toFixed(2)}€` : date}
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: intensity > 0
                    ? `rgba(224, 122, 95, ${0.15 + intensity * 0.85})`
                    : '#f4f4f5',
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
