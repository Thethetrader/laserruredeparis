'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { SavingsPot, SavingsTransaction } from '@/lib/supabase/types'
import { MOCK_SAVINGS_POTS, MOCK_SAVINGS_TRANSACTIONS } from '@/lib/mock/data'

const DEV = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = () => createClient() as any

export function useSavingsPots() {
  return useQuery<SavingsPot[]>({
    queryKey: ['savings-pots'],
    queryFn: async (): Promise<SavingsPot[]> => {
      if (DEV) return MOCK_SAVINGS_POTS
      const supabase = sb()
      const { data, error } = await supabase
        .from('savings_pots')
        .select('*')
        .eq('is_archived', false)
        .order('is_shared', { ascending: false })
      if (error) throw error
      return (data as SavingsPot[]) ?? []
    },
  })
}

export function useSavingsTransactions(potId?: string) {
  return useQuery<SavingsTransaction[]>({
    queryKey: ['savings-transactions', potId],
    queryFn: async (): Promise<SavingsTransaction[]> => {
      if (DEV) return potId ? MOCK_SAVINGS_TRANSACTIONS.filter(t => t.pot_id === potId) : MOCK_SAVINGS_TRANSACTIONS
      const supabase = sb()
      let query = supabase.from('savings_transactions').select('*').order('occurred_at', { ascending: false })
      if (potId) query = query.eq('pot_id', potId)
      const { data, error } = await query
      if (error) throw error
      return (data as SavingsTransaction[]) ?? []
    },
  })
}

export function useAllSavingsTransactions() {
  return useQuery<SavingsTransaction[]>({
    queryKey: ['savings-transactions-all'],
    queryFn: async (): Promise<SavingsTransaction[]> => {
      if (DEV) return MOCK_SAVINGS_TRANSACTIONS
      const supabase = sb()
      const { data, error } = await supabase
        .from('savings_transactions')
        .select('*')
        .order('occurred_at', { ascending: false })
      if (error) throw error
      return (data as SavingsTransaction[]) ?? []
    },
  })
}

export function useCreateSavingsPot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (pot: Omit<SavingsPot, 'id'>) => {
      if (DEV) return { ...pot, id: 'pot-new-' + Date.now() } as SavingsPot
      const supabase = sb()
      const { data, error } = await supabase.from('savings_pots').insert(pot).select().single()
      if (error) throw error
      return data as SavingsPot
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['savings-pots'] }),
  })
}

export function useCreateSavingsTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (tx: Omit<SavingsTransaction, 'id' | 'occurred_at'>) => {
      if (DEV) return { ...tx, id: 'stx-new-' + Date.now(), occurred_at: new Date().toISOString() } as SavingsTransaction
      const supabase = sb()
      const { data, error } = await supabase.from('savings_transactions').insert(tx).select().single()
      if (error) throw error
      return data as SavingsTransaction
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['savings-pots'] })
      qc.invalidateQueries({ queryKey: ['savings-transactions'] })
      qc.invalidateQueries({ queryKey: ['savings-transactions-all'] })
    },
  })
}
