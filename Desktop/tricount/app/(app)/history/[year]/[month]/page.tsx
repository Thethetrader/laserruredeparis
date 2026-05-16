'use client'

import { useParams } from 'next/navigation'
import { useMemo } from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { useExpenses } from '@/lib/queries/useExpenses'
import { useBudgets } from '@/lib/queries/useBudget'
import { useCategories } from '@/lib/queries/useCategories'
import { useCouple, useCoupleMembers } from '@/lib/queries/useCouple'
import { BudgetGauge } from '@/components/BudgetGauge'
import { MemberAvatar } from '@/components/MemberAvatar'
import { formatCurrency, formatShortDate } from '@/lib/utils/format'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { CaretLeft } from '@phosphor-icons/react'
import type { Expense, ExpenseShare } from '@/lib/supabase/types'

export default function MonthDetailPage() {
  const { year, month } = useParams<{ year: string; month: string }>()
  const monthStr = `${year}-${month}`

  const { data: couple } = useCouple()
  const { data: members = [] } = useCoupleMembers()
  const { data: expenses = [], isLoading } = useExpenses(monthStr)
  const { data: budgets = [] } = useBudgets(monthStr)
  const { data: categories = [] } = useCategories()

  const currency = couple?.currency ?? 'EUR'
  const catMap = new Map(categories.map(c => [c.id, c]))
  const memberMap = new Map(members.map(m => [m.user_id, m]))
  const budgetMap = new Map(budgets.map(b => [b.category_id, b.amount]))

  const totalSpent = (expenses as Expense[]).reduce((acc, e) => acc + e.amount, 0)
  const totalBudget = budgets.reduce((acc, b) => acc + b.amount, 0)

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of expenses as Expense[]) {
      map.set(e.category_id, (map.get(e.category_id) ?? 0) + e.amount)
    }
    return Array.from(map.entries()).map(([catId, amount]) => ({
      catId, amount, category: catMap.get(catId),
    })).sort((a, b) => b.amount - a.amount)
  }, [expenses, catMap])

  const byDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of expenses as Expense[]) {
      const day = e.spent_at.slice(8)
      map.set(day, (map.get(day) ?? 0) + e.amount)
    }
    return Array.from(map.entries()).map(([day, amount]) => ({ day: parseInt(day), amount })).sort((a, b) => a.day - b.day)
  }, [expenses])

  const byMember = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of (expenses as (Expense & { expense_shares: ExpenseShare[] })[])) {
      for (const s of e.expense_shares ?? []) {
        map.set(s.user_id, (map.get(s.user_id) ?? 0) + s.share_amount)
      }
    }
    return map
  }, [expenses])

  const top5 = [...(expenses as Expense[])].sort((a, b) => b.amount - a.amount).slice(0, 5)

  return (
    <div className="pt-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/history" className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <CaretLeft size={18} className="text-zinc-500" />
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100 capitalize">
          {new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </h1>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Dépensé', value: formatCurrency(totalSpent, currency) },
              { label: 'Budget', value: formatCurrency(totalBudget, currency) },
            ].map(t => (
              <div key={t.label} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200/50 dark:border-zinc-800">
                <p className="text-xs text-zinc-400 mb-1">{t.label}</p>
                <p className="font-mono font-semibold text-zinc-800 dark:text-zinc-100">{t.value}</p>
              </div>
            ))}
          </div>

          {/* Donut chart */}
          {byCategory.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200/50 dark:border-zinc-800">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Par catégorie</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={byCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="amount" nameKey="catId">
                    {byCategory.map(({ catId, category }) => (
                      <Cell key={catId} fill={category?.color ?? '#8d99ae'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => formatCurrency(Number(v), currency)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {byCategory.map(({ catId, category }) => (
                  <div key={catId} className="flex items-center gap-1 text-xs text-zinc-500">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: category?.color ?? '#8d99ae' }} />
                    {category?.name ?? catId}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bar chart day by day */}
          {byDay.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200/50 dark:border-zinc-800">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Jour par jour</h2>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={byDay} margin={{ left: -20 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: unknown) => formatCurrency(Number(v), currency)} />
                  <Bar dataKey="amount" fill="#e07a5f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Budget gauges */}
          {byCategory.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Jauges</h2>
              {byCategory.map(({ catId, amount, category }) => (
                <BudgetGauge
                  key={catId}
                  name={category?.name ?? catId}
                  color={category?.color}
                  spent={amount}
                  budget={budgetMap.get(catId) ?? 0}
                  currency={currency}
                />
              ))}
            </div>
          )}

          {/* Top 5 */}
          {top5.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Top 5 dépenses</h2>
              {top5.map(e => (
                <div key={e.id} className="flex items-center justify-between bg-white dark:bg-zinc-900 rounded-2xl px-4 py-3 border border-zinc-200/50 dark:border-zinc-800">
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{e.description}</p>
                    <p className="text-xs text-zinc-400">{formatShortDate(e.spent_at)}</p>
                  </div>
                  <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">{formatCurrency(e.amount, currency)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Member split */}
          {members.length === 2 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Répartition</h2>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200/50 dark:border-zinc-800 space-y-3">
                {members.map(m => {
                  const share = byMember.get(m.user_id) ?? 0
                  const pct = totalSpent > 0 ? (share / totalSpent) * 100 : 0
                  return (
                    <div key={m.user_id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MemberAvatar userId={m.user_id} name={m.display_name} color={m.color} size="sm" />
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">{m.display_name}</span>
                        </div>
                        <span className="font-mono text-sm font-semibold" style={{ color: m.color }}>
                          {formatCurrency(share, currency)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: m.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
