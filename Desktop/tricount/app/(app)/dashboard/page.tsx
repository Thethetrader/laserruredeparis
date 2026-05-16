'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Plus, Gear, Heart } from '@phosphor-icons/react'
import { MonthPicker } from '@/components/MonthPicker'
import { BudgetGauge } from '@/components/BudgetGauge'
import { AddExpenseModal } from '@/components/AddExpenseModal'
import { MemberAvatar } from '@/components/MemberAvatar'
import { useExpenses, useAllExpenses } from '@/lib/queries/useExpenses'
import { useBudgets } from '@/lib/queries/useBudget'
import { useCouple, useCoupleMembers, useProfile, useSettlements } from '@/lib/queries/useCouple'
import { useCategories } from '@/lib/queries/useCategories'
import { useAllSavingsTransactions } from '@/lib/queries/useSavings'
import { formatCurrency } from '@/lib/utils/format'
import { computeBalance, computeProjection, getDayOfMonth, getDaysInMonth } from '@/lib/utils/balance'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Expense, ExpenseShare } from '@/lib/supabase/types'
import { MOCK_USER_ID, MOCK_RECURRING_EXPENSES } from '@/lib/mock/data'
import { useCoupleCover } from '@/lib/utils/avatars'

export default function DashboardPage() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const coupleCover = useCoupleCover()

  const { data: couple, isLoading: coupleLoading } = useCouple()
  const { data: members = [] } = useCoupleMembers()
  const { data: profile } = useProfile()
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses(month)
  const { data: allExpenses = [] } = useAllExpenses()
  const { data: budgets = [] } = useBudgets(month)
  const { data: categories = [] } = useCategories()
  const { data: settlements = [] } = useSettlements()
  const { data: allSavingsTx = [] } = useAllSavingsTransactions()

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') { setUserId(MOCK_USER_ID); return }
    createClient().auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null))
  }, [])

  // Realtime
  useEffect(() => {
    if (!couple) return
    const supabase = createClient()
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `couple_id=eq.${couple.id}` }, () => {
        // TanStack Query auto-refetches via queryClient
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [couple])

  const currency = couple?.currency ?? 'EUR'
  const allShares = expenses.flatMap((e: Expense & { expense_shares: ExpenseShare[] }) => e.expense_shares ?? [])

  const totalSpent = expenses.reduce((acc: number, e: Expense) => acc + e.amount, 0)
  const totalBudget = budgets.reduce((acc, b) => acc + b.amount, 0)
  const remaining = totalBudget - totalSpent

  const dayOfMonth = getDayOfMonth()
  const daysInMonth = getDaysInMonth(month + '-01')
  const projection = computeProjection(totalSpent, dayOfMonth, daysInMonth)

  const totalSavedThisMonth = allSavingsTx
    .filter(tx => tx.occurred_at.startsWith(month))
    .reduce((acc, tx) => tx.type === 'deposit' ? acc + tx.amount : acc - tx.amount, 0)

  const balance = userId ? computeBalance(userId, expenses, allShares, settlements) : 0

  // Solde reporté : balance des mois antérieurs + règlements antérieurs
  const startOfMonth = month + '-01'
  const pastExpenses = (allExpenses as (Expense & { expense_shares: ExpenseShare[] })[]).filter(e => e.spent_at < startOfMonth)
  const pastShares = pastExpenses.flatMap(e => e.expense_shares ?? [])
  const pastSettlements = settlements.filter(s => s.occurred_at < startOfMonth + 'T00:00:00Z')
  const carriedBalance = userId ? computeBalance(userId, pastExpenses, pastShares, pastSettlements) : 0

  const isLoading = coupleLoading || expensesLoading

  const categorySpentMap = new Map<string, number>()
  for (const e of expenses as (Expense & { expense_shares: ExpenseShare[] })[]) {
    categorySpentMap.set(e.category_id, (categorySpentMap.get(e.category_id) ?? 0) + e.amount)
  }

  // Par membre : qui a dépensé combien ce mois
  const spentByMember = new Map<string, number>()
  for (const e of expenses) {
    spentByMember.set(e.paid_by, (spentByMember.get(e.paid_by) ?? 0) + e.amount)
  }
  const maxSpentByMember = Math.max(1, ...Array.from(spentByMember.values()))

  // Charges fixes (mode dev uniquement pour l'instant)
  const recurringByMember = new Map<string, { total: number; items: typeof MOCK_RECURRING_EXPENSES }>()
  if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
    for (const r of MOCK_RECURRING_EXPENSES) {
      const cur = recurringByMember.get(r.member_id) ?? { total: 0, items: [] }
      cur.total += r.amount
      cur.items.push(r)
      recurringByMember.set(r.member_id, cur)
    }
  }
  const totalRecurring = Array.from(recurringByMember.values()).reduce((a, b) => a + b.total, 0)

  const budgetMap = new Map(budgets.map(b => [b.category_id, b.amount]))
  const categoriesWithData = categories
    .map(c => ({
      ...c,
      spent: categorySpentMap.get(c.id) ?? 0,
      budget: budgetMap.get(c.id) ?? 0,
    }))
    .filter(c => c.spent > 0 || c.budget > 0)

  return (
    <div className="space-y-6">
      {/* Banner couple */}
      <div className="-mx-4 relative h-40 overflow-hidden">
        {coupleCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coupleCover} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, #e07a5f 0%, #f2cc8f 50%, #81b29a 100%)' }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />
        <Link href="/settings" className="absolute top-3 right-3 p-2 rounded-xl bg-black/20 backdrop-blur hover:bg-black/30 transition-colors">
          <Gear size={16} className="text-white" weight="bold" />
        </Link>
        <div className="absolute bottom-0 inset-x-0 p-4 flex items-end justify-between">
          <div className="flex items-center gap-2">
            {!coupleCover && (
              <div className="w-8 h-8 rounded-xl bg-white/95 flex items-center justify-center">
                <Heart size={16} weight="fill" className="text-[#e07a5f]" />
              </div>
            )}
            {isLoading ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <span className="font-semibold text-white text-lg drop-shadow-sm tracking-tight">{couple?.name ?? 'ONKHALASS'}</span>
            )}
          </div>
          <div className="flex -space-x-2">
            {members.map(m => (
              <MemberAvatar key={m.user_id} userId={m.user_id} name={m.display_name} color={m.color} size="md" className="ring-2 ring-white/90" />
            ))}
          </div>
        </div>
      </div>

      {/* Month picker */}
      <div className="flex justify-center">
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {/* Solde reporté du mois précédent */}
      {Math.abs(carriedBalance) > 0.01 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl px-4 py-3 flex items-center justify-between border"
          style={{
            borderColor: carriedBalance > 0 ? '#22c55e33' : '#f9731633',
            backgroundColor: carriedBalance > 0 ? '#22c55e0d' : '#f973160d',
          }}
        >
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">Solde reporté</span>
            <span className="text-xs text-zinc-600 dark:text-zinc-300">
              {carriedBalance > 0
                ? `${members.find(m => m.user_id !== userId)?.display_name ?? 'Marie'} te doit`
                : `Tu dois à ${members.find(m => m.user_id !== userId)?.display_name ?? 'Marie'}`}
            </span>
          </div>
          <span className="font-mono text-sm font-semibold" style={{ color: carriedBalance > 0 ? '#22c55e' : '#f97316' }}>
            {formatCurrency(Math.abs(carriedBalance), currency)}
          </span>
        </motion.div>
      )}

      {/* 4 KPI tiles */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Dépensé', value: formatCurrency(totalSpent, currency), sub: `/ ${formatCurrency(totalBudget, currency)}`, color: '#e07a5f' },
          { label: 'Restant', value: formatCurrency(Math.max(0, remaining), currency), sub: remaining < 0 ? 'Dépassement !' : 'budget disponible', color: remaining < 0 ? '#ef4444' : '#22c55e' },
          { label: 'Solde équité', value: formatCurrency(Math.abs(balance), currency), sub: balance > 0 ? 'à recevoir' : balance < 0 ? 'à rembourser' : 'Équilibré', color: balance !== 0 ? '#f97316' : '#22c55e' },
          { label: 'Épargné', value: formatCurrency(totalSavedThisMonth, currency), sub: 'ce mois', color: '#2a9d8f' },
        ].map((tile, i) => (
          <motion.div
            key={tile.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200/50 dark:border-zinc-800 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)]"
          >
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">{tile.label}</p>
            {isLoading ? (
              <Skeleton className="h-6 w-24 mt-1" />
            ) : (
              <>
                <p className="font-mono font-semibold text-zinc-800 dark:text-zinc-100" style={{ color: tile.color }}>{tile.value}</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">{tile.sub}</p>
              </>
            )}
          </motion.div>
        ))}
      </div>

      {/* Par membre */}
      {members.length > 0 && totalSpent > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Qui a dépensé ce mois</h2>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200/50 dark:border-zinc-800 space-y-3">
            {members.map((m, i) => {
              const amt = spentByMember.get(m.user_id) ?? 0
              const pct = totalSpent > 0 ? (amt / totalSpent) * 100 : 0
              const barPct = (amt / maxSpentByMember) * 100
              return (
                <motion.div
                  key={m.user_id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <MemberAvatar userId={m.user_id} name={m.display_name} color={m.color} size="sm" />
                      <span className="font-medium text-zinc-700 dark:text-zinc-200">{m.display_name}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-100">{formatCurrency(amt, currency)}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barPct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.08 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: m.color }}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Charges fixes */}
      {recurringByMember.size > 0 && (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Charges fixes du mois</h2>
            <span className="text-[10px] text-zinc-400 font-mono">{formatCurrency(totalRecurring, currency)}</span>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200/50 dark:border-zinc-800 space-y-3">
            {members.map(m => {
              const rec = recurringByMember.get(m.user_id)
              if (!rec) return null
              return (
                <div key={m.user_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MemberAvatar userId={m.user_id} name={m.display_name} color={m.color} size="sm" />
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{m.display_name}</span>
                    </div>
                    <span className="font-mono text-sm font-semibold text-zinc-800 dark:text-zinc-100">{formatCurrency(rec.total, currency)}</span>
                  </div>
                  <ul className="pl-8 space-y-1">
                    {rec.items.map(it => (
                      <li key={it.id} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {it.label}
                          <span className="text-zinc-300 dark:text-zinc-600"> — le {it.day_of_month}</span>
                        </span>
                        <span className="font-mono text-zinc-600 dark:text-zinc-300">{formatCurrency(it.amount, currency)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      )}


      {/* Category gauges */}
      {categoriesWithData.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Par catégorie</h2>
          <div className="space-y-3">
            {categoriesWithData.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <BudgetGauge
                  name={cat.name}
                  color={cat.color}
                  spent={cat.spent}
                  budget={cat.budget}
                  currency={currency}
                />
              </motion.div>
            ))}
          </div>
        </div>
      ) : !isLoading ? (
        <div className="text-center py-12 space-y-2">
          <p className="text-zinc-400 text-sm">Aucune dépense ce mois-ci</p>
          <p className="text-xs text-zinc-300 dark:text-zinc-600">Appuyez sur + pour commencer</p>
        </div>
      ) : null}

      {/* FAB */}
      <button
        onClick={() => setShowAddExpense(true)}
        className="fixed bottom-20 right-4 w-11 h-11 rounded-2xl bg-[#e07a5f] hover:bg-[#d06a4f] text-white shadow-lg shadow-[#e07a5f]/30 flex items-center justify-center transition-transform active:scale-95 z-30"
        aria-label="Ajouter une dépense"
      >
        <Plus size={18} weight="bold" />
      </button>

      {/* Add expense modal */}
      {(couple || process.env.NEXT_PUBLIC_DEV_MODE === 'true') && userId && (
        <AddExpenseModal
          open={showAddExpense}
          onClose={() => setShowAddExpense(false)}
          coupleId={couple?.id ?? 'mock-couple-id'}
          members={members}
          currentUserId={userId}
          currency={currency}
        />
      )}
    </div>
  )
}
