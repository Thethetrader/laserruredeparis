'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { RecurringExpense, CoupleMember } from '@/lib/supabase/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = () => createClient() as any

export function useRecurringExpenses() {
  return useQuery<RecurringExpense[]>({
    queryKey: ['recurring-expenses'],
    queryFn: async () => {
      const { data, error } = await sb()
        .from('recurring_expenses')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data as RecurringExpense[]) ?? []
    },
  })
}

export function useCreateRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: Omit<RecurringExpense, 'id' | 'created_at'>) => {
      const { data, error } = await sb().from('recurring_expenses').insert(values).select().single()
      if (error) throw error
      return data as RecurringExpense
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring-expenses'] }),
  })
}

export function useUpdateRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<Omit<RecurringExpense, 'id' | 'couple_id' | 'created_at'>> }) => {
      const { error } = await sb().from('recurring_expenses').update(values).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring-expenses'] }),
  })
}

export function useDeleteRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb().from('recurring_expenses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring-expenses'] }),
  })
}

export function useAutoFillMonth() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      month,
      coupleId,
      currency,
      members,
      recurringExpenses,
    }: {
      month: string
      coupleId: string
      currency: string
      members: CoupleMember[]
      recurringExpenses: RecurringExpense[]
    }): Promise<number> => {
      const supabase = sb()
      const active = recurringExpenses.filter(r => r.is_active)
      if (active.length === 0) return 0

      const [year, monthNum] = month.split('-').map(Number)
      const lastDay = new Date(year, monthNum, 0).getDate()
      const start = `${month}-01`
      const end = `${month}-${String(lastDay).padStart(2, '0')}`

      const { data: existing } = await supabase
        .from('expenses')
        .select('recurring_expense_id')
        .not('recurring_expense_id', 'is', null)
        .gte('spent_at', start)
        .lte('spent_at', end)

      const existingIds = new Set((existing ?? []).map((e: { recurring_expense_id: string }) => e.recurring_expense_id))
      const missing = active.filter(r => !existingIds.has(r.id))
      if (missing.length === 0) return 0

      for (const r of missing) {
        const day = Math.min(r.day_of_month, lastDay)
        const spent_at = `${month}-${String(day).padStart(2, '0')}`

        const { data: exp, error } = await supabase
          .from('expenses')
          .insert({
            couple_id: coupleId,
            paid_by: r.paid_by,
            category_id: r.category_id,
            amount: r.amount,
            currency,
            description: r.description,
            spent_at,
            recurring_expense_id: r.id,
          })
          .select()
          .single()

        if (error || !exp) continue

        const shareRows =
          r.split_mode === 'equal' && members.length === 2
            ? (() => {
                const half = Math.round(r.amount / 2 * 100) / 100
                return [
                  { expense_id: exp.id, user_id: members[0].user_id, share_amount: half },
                  { expense_id: exp.id, user_id: members[1].user_id, share_amount: Math.round((r.amount - half) * 100) / 100 },
                ]
              })()
            : [{ expense_id: exp.id, user_id: r.paid_by, share_amount: r.amount }]

        await supabase.from('expense_shares').insert(shareRows)
      }

      return missing.length
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['expenses-all'] })
    },
  })
}
