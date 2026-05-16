'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Expense, ExpenseShare } from '@/lib/supabase/types'
import { getMockExpenses, getAllMockExpenses } from '@/lib/mock/data'

type ExpenseWithShares = Expense & { expense_shares: ExpenseShare[] }

const DEV = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = () => createClient() as any

export function useExpenses(month: string) {
  return useQuery<ExpenseWithShares[]>({
    queryKey: ['expenses', month],
    queryFn: async (): Promise<ExpenseWithShares[]> => {
      if (DEV) return getMockExpenses(month)
      const supabase = sb()
      const start = month + '-01'
      const d = new Date(month + '-01')
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
      const end = `${month}-${String(lastDay).padStart(2, '0')}`

      const { data, error } = await supabase
        .from('expenses')
        .select('*, expense_shares(*)')
        .gte('spent_at', start)
        .lte('spent_at', end)
        .order('spent_at', { ascending: false })

      if (error) throw error
      return (data as ExpenseWithShares[]) ?? []
    },
  })
}

export function useAllExpenses() {
  return useQuery<ExpenseWithShares[]>({
    queryKey: ['expenses-all'],
    queryFn: async (): Promise<ExpenseWithShares[]> => {
      if (DEV) return getAllMockExpenses()
      const supabase = sb()
      const { data, error } = await supabase
        .from('expenses')
        .select('*, expense_shares(*)')
        .order('spent_at', { ascending: false })
      if (error) throw error
      return (data as ExpenseWithShares[]) ?? []
    },
  })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      expense,
      shares,
    }: {
      expense: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'recurring_expense_id'> & { recurring_expense_id?: string | null }
      shares: { user_id: string; share_amount: number }[]
    }) => {
      if (DEV) return { ...expense, id: 'exp-new-' + Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Expense
      const supabase = sb()
      const { data, error } = await supabase.from('expenses').insert(expense).select().single()
      if (error) throw error
      const { error: shareError } = await supabase.from('expense_shares').insert(
        shares.map(s => ({ expense_id: (data as Expense).id, ...s }))
      )
      if (shareError) throw shareError
      return data as Expense
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['expenses-all'] })
    },
  })
}

export function useUpdateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      expense,
      shares,
    }: {
      id: string
      expense: Partial<Expense>
      shares: { user_id: string; share_amount: number }[]
    }) => {
      if (DEV) return
      const supabase = sb()
      const { error } = await supabase.from('expenses').update(expense).eq('id', id)
      if (error) throw error
      await supabase.from('expense_shares').delete().eq('expense_id', id)
      await supabase.from('expense_shares').insert(shares.map(s => ({ expense_id: id, ...s })))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['expenses-all'] })
    },
  })
}

export function useDeleteExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (DEV) return
      const supabase = sb()
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['expenses-all'] })
    },
  })
}
