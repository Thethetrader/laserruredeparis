'use client'

import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { Plus, MagnifyingGlass, Funnel } from '@phosphor-icons/react'
import { MonthPicker } from '@/components/MonthPicker'
import { ExpenseCard } from '@/components/ExpenseCard'
import { AddExpenseModal } from '@/components/AddExpenseModal'
import { useExpenses, useDeleteExpense } from '@/lib/queries/useExpenses'
import { useCouple, useCoupleMembers } from '@/lib/queries/useCouple'
import { useCategories } from '@/lib/queries/useCategories'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Expense, ExpenseShare } from '@/lib/supabase/types'
import { formatCurrency } from '@/lib/utils/format'
import { motion, AnimatePresence } from 'framer-motion'

export default function ExpensesPage() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterPayer, setFilterPayer] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editExpense, setEditExpense] = useState<(Expense & { expense_shares: ExpenseShare[] }) | undefined>()
  const [userId, setUserId] = useState<string | null>(null)

  const { data: couple } = useCouple()
  const { data: members = [] } = useCoupleMembers()
  const { data: expenses = [], isLoading } = useExpenses(month)
  const { data: categories = [] } = useCategories()
  const deleteExpense = useDeleteExpense()

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null))
  }, [])

  const filtered = useMemo(() => {
    return (expenses as (Expense & { expense_shares: ExpenseShare[] })[]).filter(e => {
      const matchSearch = search === '' || e.description.toLowerCase().includes(search.toLowerCase())
      const matchCat = filterCat === '' || e.category_id === filterCat
      const matchPayer = filterPayer === '' || e.paid_by === filterPayer
      return matchSearch && matchCat && matchPayer
    })
  }, [expenses, search, filterCat, filterPayer])

  const total = filtered.reduce((acc, e) => acc + e.amount, 0)

  async function handleDelete(id: string) {
    try {
      await deleteExpense.mutateAsync(id)
      toast.success('Dépense supprimée')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const catMap = new Map(categories.map(c => [c.id, c]))
  const memberMap = new Map(members.map(m => [m.user_id, m]))

  return (
    <div className="pt-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">Dépenses</h1>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="relative">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Rechercher…"
            className="pl-9 rounded-2xl"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <select
            className="text-xs border border-zinc-200 dark:border-zinc-700 rounded-xl px-2 py-1.5 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 flex-shrink-0"
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
          >
            <option value="">Toutes catégories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            className="text-xs border border-zinc-200 dark:border-zinc-700 rounded-xl px-2 py-1.5 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 flex-shrink-0"
            value={filterPayer}
            onChange={e => setFilterPayer(e.target.value)}
          >
            <option value="">Tous les payeurs</option>
            {members.map(m => <option key={m.user_id} value={m.user_id}>{m.display_name}</option>)}
          </select>
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">{filtered.length} dépense{filtered.length !== 1 ? 's' : ''}</span>
        <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">
          {formatCurrency(total, couple?.currency ?? 'EUR')}
        </span>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <p className="text-zinc-400 text-sm">Aucune dépense</p>
          <p className="text-xs text-zinc-300 dark:text-zinc-600">Appuyez sur + pour en ajouter une</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-2">
            {filtered.map((expense, i) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.03 }}
              >
                <ExpenseCard
                  expense={expense}
                  category={catMap.get(expense.category_id)}
                  paidByMember={memberMap.get(expense.paid_by)}
                  onEdit={() => setEditExpense(expense)}
                  onDelete={() => handleDelete(expense.id)}
                />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-2xl bg-[#e07a5f] hover:bg-[#d06a4f] text-white shadow-lg shadow-[#e07a5f]/30 flex items-center justify-center transition-transform active:scale-95 z-30"
        aria-label="Ajouter une dépense"
      >
        <Plus size={24} weight="bold" />
      </button>

      {couple && userId && (
        <>
          <AddExpenseModal
            open={showAdd}
            onClose={() => setShowAdd(false)}
            coupleId={couple.id}
            members={members}
            currentUserId={userId}
            currency={couple.currency}
          />
          {editExpense && (
            <AddExpenseModal
              open={!!editExpense}
              onClose={() => setEditExpense(undefined)}
              coupleId={couple.id}
              members={members}
              currentUserId={userId}
              currency={couple.currency}
              expense={editExpense}
            />
          )}
        </>
      )}
    </div>
  )
}
