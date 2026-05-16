'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Couple, CoupleMember, Profile, Settlement } from '@/lib/supabase/types'
import { MOCK_COUPLE, MOCK_MEMBERS, MOCK_PROFILE, MOCK_SETTLEMENTS } from '@/lib/mock/data'

const DEV = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = () => createClient() as any

export function useProfile() {
  return useQuery<Profile | null>({
    queryKey: ['profile'],
    queryFn: async (): Promise<Profile | null> => {
      if (DEV) return MOCK_PROFILE
      const supabase = sb()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      return (data as Profile) ?? null
    },
  })
}

export function useCouple() {
  return useQuery<Couple | null>({
    queryKey: ['couple'],
    queryFn: async (): Promise<Couple | null> => {
      if (DEV) return MOCK_COUPLE
      const supabase = sb()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data: profile } = await supabase.from('profiles').select('couple_id').eq('id', user.id).single()
      if (!(profile as Profile)?.couple_id) return null
      const { data } = await supabase.from('couples').select('*').eq('id', (profile as Profile).couple_id).single()
      return (data as Couple) ?? null
    },
  })
}

export function useCoupleMembers() {
  return useQuery<CoupleMember[]>({
    queryKey: ['couple-members'],
    queryFn: async (): Promise<CoupleMember[]> => {
      if (DEV) return MOCK_MEMBERS
      const supabase = sb()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data: profile } = await supabase.from('profiles').select('couple_id').eq('id', user.id).single()
      if (!(profile as Profile)?.couple_id) return []
      const { data } = await supabase
        .from('couple_members')
        .select('*')
        .eq('couple_id', (profile as Profile).couple_id)
        .order('joined_at')
      return (data as CoupleMember[]) ?? []
    },
  })
}

export function useSettlements() {
  return useQuery<Settlement[]>({
    queryKey: ['settlements'],
    queryFn: async (): Promise<Settlement[]> => {
      if (DEV) return MOCK_SETTLEMENTS
      const supabase = sb()
      const { data } = await supabase
        .from('settlements')
        .select('*')
        .order('occurred_at', { ascending: false })
      return (data as Settlement[]) ?? []
    },
  })
}

export function useCreateSettlement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (settlement: {
      couple_id: string
      from_user: string
      to_user: string
      amount: number
      note?: string
    }) => {
      if (DEV) return { ...settlement, id: 'mock-set-new', occurred_at: new Date().toISOString(), created_at: new Date().toISOString() } as Settlement
      const supabase = sb()
      const { data, error } = await supabase.from('settlements').insert(settlement).select().single()
      if (error) throw error
      return data as Settlement
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settlements'] }),
  })
}
