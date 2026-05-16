'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/lib/supabase/types'
import { MOCK_CATEGORIES } from '@/lib/mock/data'

const DEV = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = () => createClient() as any

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      if (DEV) return MOCK_CATEGORIES
      const supabase = sb()
      const { data, error } = await supabase.from('categories').select('*').eq('is_archived', false).order('sort_order')
      if (error) throw error
      return (data as Category[]) ?? []
    },
  })
}

export function useUpsertCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (category: Partial<Category> & { couple_id: string; name: string }) => {
      if (DEV) return { ...category, id: category.id ?? 'cat-new', is_archived: false, sort_order: 99 } as Category
      const supabase = sb()
      if (category.id) {
        const { data, error } = await supabase.from('categories').update(category).eq('id', category.id).select().single()
        if (error) throw error
        return data as Category
      } else {
        const { data, error } = await supabase.from('categories').insert(category).select().single()
        if (error) throw error
        return data as Category
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}

export function useArchiveCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (DEV) return
      const supabase = sb()
      const { error } = await supabase.from('categories').update({ is_archived: true }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}
