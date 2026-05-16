'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { MonthlyBudget } from '@/lib/supabase/types'
import { getMockBudgets } from '@/lib/mock/data'

const DEV = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = () => createClient() as any

export function useBudgets(month: string) {
  return useQuery<MonthlyBudget[]>({
    queryKey: ['budgets', month],
    queryFn: async (): Promise<MonthlyBudget[]> => {
      if (DEV) return getMockBudgets(month)
      const supabase = sb()
      const { data, error } = await supabase.from('monthly_budgets').select('*').eq('month', month + '-01')
      if (error) throw error
      return (data as MonthlyBudget[]) ?? []
    },
  })
}

export function useUpsertBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (budget: {
      couple_id: string
      category_id: string
      month: string
      amount: number
      created_by: string
    }) => {
      if (DEV) return { ...budget, id: 'bud-new', month: budget.month + '-01' } as MonthlyBudget
      const supabase = sb()
      const { data, error } = await supabase
        .from('monthly_budgets')
        .upsert({ ...budget, month: budget.month + '-01' }, { onConflict: 'couple_id,category_id,month' })
        .select()
        .single()
      if (error) throw error
      return data as MonthlyBudget
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['budgets', vars.month] }),
  })
}

export function useDeleteBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, month }: { id: string; month: string }) => {
      if (DEV) return
      const supabase = sb()
      const { error } = await supabase.from('monthly_budgets').delete().eq('id', id)
      if (error) throw error
      return month
    },
    onSuccess: (month) => { if (month) qc.invalidateQueries({ queryKey: ['budgets', month] }) },
  })
}

export function useDuplicatePreviousMonth() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ coupleId, targetMonth, userId }: { coupleId: string; targetMonth: string; userId: string }) => {
      if (DEV) return
      const supabase = sb()
      const d = new Date(targetMonth + '-01')
      d.setMonth(d.getMonth() - 1)
      const prevMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`

      const { data: prev } = await supabase
        .from('monthly_budgets')
        .select('*')
        .eq('couple_id', coupleId)
        .eq('month', prevMonth)

      if (!prev?.length) return

      const inserts = (prev as MonthlyBudget[]).map(b => ({
        couple_id: coupleId,
        category_id: b.category_id,
        month: targetMonth + '-01',
        amount: b.amount,
        created_by: userId,
      }))

      await supabase.from('monthly_budgets').upsert(inserts, { onConflict: 'couple_id,category_id,month' })
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['budgets', vars.targetMonth] }),
  })
}
