'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { MonthPicker } from '@/components/MonthPicker'
import { useBudgets, useUpsertBudget, useDuplicatePreviousMonth } from '@/lib/queries/useBudget'
import { useCategories } from '@/lib/queries/useCategories'
import { useCouple } from '@/lib/queries/useCouple'
import { useExpenses } from '@/lib/queries/useExpenses'
import { formatCurrency } from '@/lib/utils/format'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { CopySimple, Check } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import type { Expense } from '@/lib/supabase/types'

export default function BudgetPage() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [userId, setUserId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const { data: couple } = useCouple()
  const { data: categories = [], isLoading: catsLoading } = useCategories()
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets(month)
  const { data: expenses = [] } = useExpenses(month)
  const upsertBudget = useUpsertBudget()
  const duplicatePrev = useDuplicatePreviousMonth()

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null))
  }, [])

  const currency = couple?.currency ?? 'EUR'
  const budgetMap = new Map(budgets.map(b => [b.category_id, b]))
  const spentMap = new Map<string, number>()
  for (const e of expenses as Expense[]) {
    spentMap.set(e.category_id, (spentMap.get(e.category_id) ?? 0) + e.amount)
  }

  const totalBudget = budgets.reduce((acc, b) => acc + b.amount, 0)
  const totalSpent = (expenses as Expense[]).reduce((acc, e) => acc + e.amount, 0)

  async function saveBudget(categoryId: string) {
    const amount = parseFloat(editValue.replace(',', '.'))
    if (isNaN(amount) || amount < 0) { toast.error('Montant invalide'); return }
    if (!couple || !userId) return
    try {
      await upsertBudget.mutateAsync({ couple_id: couple.id, category_id: categoryId, month, amount, created_by: userId })
      toast.success('Budget mis à jour')
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
    setEditingId(null)
  }

  async function handleDuplicate() {
    if (!couple || !userId) return
    try {
      await duplicatePrev.mutateAsync({ coupleId: couple.id, targetMonth: month, userId })
      toast.success('Budgets dupliqués depuis le mois précédent')
    } catch {
      toast.error('Aucun budget le mois précédent')
    }
  }

  const isLoading = catsLoading || budgetsLoading

  return (
    <div className="pt-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">Budget</h1>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200/50 dark:border-zinc-800">
          <p className="text-xs text-zinc-400 mb-1">Budget total</p>
          <p className="font-mono font-semibold text-zinc-800 dark:text-zinc-100">{formatCurrency(totalBudget, currency)}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200/50 dark:border-zinc-800">
          <p className="text-xs text-zinc-400 mb-1">Dépensé</p>
          <p className="font-mono font-semibold text-zinc-800 dark:text-zinc-100">{formatCurrency(totalSpent, currency)}</p>
        </div>
      </div>

      {/* Duplicate button */}
      <button
        onClick={handleDuplicate}
        disabled={duplicatePrev.isPending}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors active:scale-[0.98]"
      >
        <CopySimple size={16} />
        Dupliquer le mois précédent
      </button>

      {/* Category list */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat, i) => {
            const budget = budgetMap.get(cat.id)
            const spent = spentMap.get(cat.id) ?? 0
            const isEditing = editingId === cat.id

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 bg-white dark:bg-zinc-900 rounded-2xl px-4 py-3 border border-zinc-200/50 dark:border-zinc-800"
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex-1 truncate">{cat.name}</span>
                {spent > 0 && (
                  <span className="text-xs font-mono text-zinc-400">{formatCurrency(spent, currency)}</span>
                )}
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      autoFocus
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveBudget(cat.id); if (e.key === 'Escape') setEditingId(null) }}
                      className="w-24 text-right text-sm font-mono border border-zinc-300 dark:border-zinc-600 rounded-xl px-2 py-1 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#e07a5f]/50"
                    />
                    <button onClick={() => saveBudget(cat.id)} className="p-1.5 rounded-xl bg-[#e07a5f]/10 text-[#e07a5f] hover:bg-[#e07a5f]/20 transition-colors">
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingId(cat.id); setEditValue(String(budget?.amount ?? '')) }}
                    className="text-sm font-mono text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors min-w-[60px] text-right"
                  >
                    {budget ? formatCurrency(budget.amount, currency) : '—'}
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
