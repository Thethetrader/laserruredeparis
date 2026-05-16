'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { MonthPicker } from '@/components/MonthPicker'
import { useBudgets, useUpsertBudget, useDeleteBudget, useDuplicatePreviousMonth } from '@/lib/queries/useBudget'
import { useCategories } from '@/lib/queries/useCategories'
import { useCouple } from '@/lib/queries/useCouple'
import { useExpenses } from '@/lib/queries/useExpenses'
import { formatCurrency } from '@/lib/utils/format'
import { computeBudgetStatus, budgetStatusColor } from '@/lib/utils/balance'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { CopySimple, Check, X, PencilSimple, Plus, Warning } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
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
  const deleteBudget = useDeleteBudget()
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
  const overBudgetCount = categories.filter(c => {
    const b = budgetMap.get(c.id)
    const s = spentMap.get(c.id) ?? 0
    return b && s > b.amount
  }).length

  const globalPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0
  const globalStatus = computeBudgetStatus(totalSpent, totalBudget)
  const globalColor = budgetStatusColor(globalStatus)

  async function saveBudget(categoryId: string) {
    const amount = parseFloat(editValue.replace(',', '.'))
    if (isNaN(amount) || amount < 0) { toast.error('Montant invalide'); return }
    if (!couple || !userId) return
    try {
      await upsertBudget.mutateAsync({ couple_id: couple.id, category_id: categoryId, month, amount, created_by: userId })
      toast.success('Limite mise à jour')
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
    setEditingId(null)
  }

  async function handleDuplicate() {
    if (!couple || !userId) return
    try {
      await duplicatePrev.mutateAsync({ coupleId: couple.id, targetMonth: month, userId })
      toast.success('Limites copiées depuis le mois précédent')
    } catch {
      toast.error('Aucune limite le mois précédent')
    }
  }

  const isLoading = catsLoading || budgetsLoading

  return (
    <div className="pt-6 space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">Budget</h1>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {/* Global gauge */}
      {totalBudget > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/50 dark:border-zinc-800 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Total du mois</span>
            {overBudgetCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-medium text-red-500 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-full">
                <Warning size={12} weight="fill" />
                {overBudgetCount} dépassement{overBudgetCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-mono font-bold" style={{ color: globalColor }}>
              {formatCurrency(totalSpent, currency)}
            </span>
            <span className="text-sm font-mono text-zinc-400">
              / {formatCurrency(totalBudget, currency)}
            </span>
          </div>
          <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: globalColor }}
              initial={{ width: 0 }}
              animate={{ width: `${globalPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-zinc-400">
            {totalBudget - totalSpent >= 0
              ? `${formatCurrency(totalBudget - totalSpent, currency)} restants`
              : `${formatCurrency(totalSpent - totalBudget, currency)} de dépassement`}
          </p>
        </motion.div>
      )}

      {/* Duplicate button */}
      <button
        onClick={handleDuplicate}
        disabled={duplicatePrev.isPending}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors active:scale-[0.98]"
      >
        <CopySimple size={16} />
        Copier le mois précédent
      </button>

      {/* Category list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat, i) => {
            const budget = budgetMap.get(cat.id)
            const spent = spentMap.get(cat.id) ?? 0
            const isEditing = editingId === cat.id
            const hasBudget = budget && budget.amount > 0
            const pct = hasBudget ? Math.min((spent / budget.amount) * 100, 100) : 0
            const status = hasBudget ? computeBudgetStatus(spent, budget.amount) : 'safe'
            const statusColor = budgetStatusColor(status)
            const isOver = hasBudget && spent > budget.amount
            const hasActivity = spent > 0 || hasBudget

            if (!hasActivity && !isEditing) return null

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`bg-white dark:bg-zinc-900 rounded-2xl px-4 py-3 border transition-colors ${
                  isOver
                    ? 'border-red-200 dark:border-red-900/50'
                    : 'border-zinc-200/50 dark:border-zinc-800'
                }`}
              >
                {/* Header row */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex-1 truncate">{cat.name}</span>
                  {isOver && (
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded-full flex-shrink-0">
                      DÉPASSÉ
                    </span>
                  )}
                  {/* Edit / set budget button */}
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        autoFocus
                        placeholder="Limite…"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveBudget(cat.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        className="w-24 text-right text-sm font-mono border border-zinc-300 dark:border-zinc-600 rounded-xl px-2 py-1 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#e07a5f]/50"
                      />
                      <button
                        onClick={() => saveBudget(cat.id)}
                        className="p-1.5 rounded-xl bg-[#e07a5f]/10 text-[#e07a5f] hover:bg-[#e07a5f]/20 transition-colors"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingId(cat.id); setEditValue(hasBudget ? String(budget.amount) : '') }}
                      className="flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors flex-shrink-0"
                    >
                      {hasBudget ? (
                        <>
                          <span style={{ color: statusColor }}>{formatCurrency(spent, currency)}</span>
                          <span className="text-zinc-300 dark:text-zinc-600">/ {formatCurrency(budget.amount, currency)}</span>
                          <PencilSimple size={12} className="ml-1 text-zinc-300" />
                        </>
                      ) : (
                        <>
                          {spent > 0 && <span className="text-zinc-500">{formatCurrency(spent, currency)}</span>}
                          <span className="flex items-center gap-0.5 text-[#e07a5f]">
                            <Plus size={12} />
                            Limite
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Gauge */}
                {hasBudget && (
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: statusColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                )}

                {/* Over budget detail */}
                {isOver && (
                  <p className="text-[10px] text-red-400 mt-1.5">
                    +{formatCurrency(spent - budget.amount, currency)} au-dessus de la limite
                  </p>
                )}
              </motion.div>
            )
          })}

          {/* Categories with no activity — show as "add budget" */}
          <div className="space-y-1 pt-2">
            <p className="text-xs text-zinc-400 px-1">Sans limite définie</p>
            <div className="space-y-1.5">
              {categories
                .filter(cat => {
                  const hasBudget = budgetMap.has(cat.id) && (budgetMap.get(cat.id)?.amount ?? 0) > 0
                  const hasSpend = (spentMap.get(cat.id) ?? 0) > 0
                  return !hasBudget && !hasSpend
                })
                .map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setEditingId(cat.id); setEditValue('') }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 hover:border-[#e07a5f]/50 hover:bg-[#e07a5f]/5 transition-all text-left"
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 flex-1">{cat.name}</span>
                    <span className="text-[10px] text-[#e07a5f] flex items-center gap-0.5">
                      <Plus size={10} />
                      Définir
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
