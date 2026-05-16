'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { MemberAvatar } from './MemberAvatar'
import { useCreateExpense, useUpdateExpense } from '@/lib/queries/useExpenses'
import { useCategories } from '@/lib/queries/useCategories'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { CoupleMember, Expense } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

const schema = z.object({
  description: z.string().min(1, 'Description requise'),
  amount: z.string().min(1, 'Montant requis').refine(v => !isNaN(Number(v.replace(',', '.'))) && Number(v.replace(',', '.')) > 0, 'Montant invalide'),
  category_id: z.string().min(1, 'Catégorie requise'),
  spent_at: z.string().min(1, 'Date requise'),
  paid_by: z.string().min(1, 'Payeur requis'),
  split_mode: z.enum(['equal', 'custom']),
  custom_ratio: z.number().min(0).max(100).optional(),
})

type FormData = z.infer<typeof schema>

const LAST_CATEGORY_KEY = 'lastCategory'

interface AddExpenseModalProps {
  open: boolean
  onClose: () => void
  coupleId: string
  members: CoupleMember[]
  currentUserId: string
  currency?: string
  expense?: Expense & { expense_shares: { user_id: string; share_amount: number }[] }
}

export function AddExpenseModal({
  open,
  onClose,
  coupleId,
  members,
  currentUserId,
  currency = 'EUR',
  expense,
}: AddExpenseModalProps) {
  const { data: categories = [] } = useCategories()
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const isEditing = !!expense

  const defaultValues: FormData = {
    description: expense?.description ?? '',
    amount: expense ? String(expense.amount) : '',
    category_id: expense?.category_id ?? (typeof window !== 'undefined' ? localStorage.getItem(LAST_CATEGORY_KEY) ?? '' : '') ?? '',
    spent_at: expense?.spent_at ?? format(new Date(), 'yyyy-MM-dd'),
    paid_by: expense?.paid_by ?? currentUserId,
    split_mode: 'equal',
    custom_ratio: 50,
  }

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const paidBy = watch('paid_by')
  const splitMode = watch('split_mode')
  const customRatio = watch('custom_ratio') ?? 50

  useEffect(() => {
    if (open) reset(defaultValues)
  }, [open])

  const onSubmit = useCallback(async (data: FormData) => {
    const amount = Math.round(Number(data.amount.replace(',', '.')) * 100) / 100
    const member0 = members[0]
    const member1 = members[1]

    let share0: number
    let share1: number

    if (data.split_mode === 'equal' || !member1) {
      share0 = Math.round((amount / (member1 ? 2 : 1)) * 100) / 100
      share1 = member1 ? Math.round((amount - share0) * 100) / 100 : 0
    } else {
      const payerIsFirst = data.paid_by === member0?.user_id
      const ratioForPayer = payerIsFirst ? customRatio : 100 - customRatio
      share0 = Math.round((amount * ratioForPayer / 100) * 100) / 100
      share1 = Math.round((amount - share0) * 100) / 100
    }

    const shares = [
      { user_id: member0.user_id, share_amount: share0 },
      ...(member1 ? [{ user_id: member1.user_id, share_amount: share1 }] : []),
    ]

    try {
      if (isEditing && expense) {
        await updateExpense.mutateAsync({
          id: expense.id,
          expense: {
            description: data.description,
            amount,
            category_id: data.category_id,
            spent_at: data.spent_at,
            paid_by: data.paid_by,
          },
          shares,
        })
        toast.success('Dépense modifiée')
      } else {
        await createExpense.mutateAsync({
          expense: {
            couple_id: coupleId,
            paid_by: data.paid_by,
            category_id: data.category_id,
            amount,
            currency,
            description: data.description,
            spent_at: data.spent_at,
            receipt_url: null,
          },
          shares,
        })
        if (typeof window !== 'undefined') localStorage.setItem(LAST_CATEGORY_KEY, data.category_id)
        toast.success('Dépense ajoutée')
      }
      onClose()
    } catch {
      toast.error('Une erreur est survenue')
    }
  }, [members, customRatio, coupleId, currency, isEditing, expense, createExpense, updateExpense, onClose])

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-zinc-800 dark:text-zinc-100">
            {isEditing ? 'Modifier la dépense' : 'Nouvelle dépense'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Amount */}
          <div className="space-y-1">
            <Label htmlFor="amount" className="text-zinc-600 dark:text-zinc-400">Montant ({currency})</Label>
            <Input
              id="amount"
              inputMode="decimal"
              placeholder="0,00"
              className="text-2xl font-mono h-14 rounded-2xl text-center font-semibold"
              {...register('amount')}
            />
            {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="description" className="text-zinc-600 dark:text-zinc-400">Description</Label>
            <Input
              id="description"
              placeholder="Ex: Courses Monoprix"
              className="rounded-2xl"
              {...register('description')}
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
          </div>

          {/* Category */}
          <div className="space-y-1">
            <Label className="text-zinc-600 dark:text-zinc-400">Catégorie</Label>
            <select
              className="w-full h-10 px-3 rounded-2xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('category_id')}
            >
              <option value="">Choisir une catégorie…</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.category_id && <p className="text-xs text-red-500">{errors.category_id.message}</p>}
          </div>

          {/* Date */}
          <div className="space-y-1">
            <Label htmlFor="spent_at" className="text-zinc-600 dark:text-zinc-400">Date</Label>
            <Input
              id="spent_at"
              type="date"
              className="rounded-2xl"
              {...register('spent_at')}
            />
          </div>

          {/* Payer */}
          <div className="space-y-2">
            <Label className="text-zinc-600 dark:text-zinc-400">Payé par</Label>
            <div className="grid grid-cols-2 gap-2">
              {members.map(m => (
                <button
                  key={m.user_id}
                  type="button"
                  onClick={() => setValue('paid_by', m.user_id)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-2xl border-2 transition-all active:scale-[0.98]',
                    paidBy === m.user_id
                      ? 'border-current bg-opacity-5'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                  )}
                  style={paidBy === m.user_id ? { borderColor: m.color, backgroundColor: m.color + '11' } : {}}
                >
                  <MemberAvatar userId={m.user_id} name={m.display_name} color={m.color} size="md" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
                    {m.display_name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Split mode */}
          {members.length === 2 && (
            <div className="space-y-2">
              <Label className="text-zinc-600 dark:text-zinc-400">Répartition</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setValue('split_mode', 'equal')}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-sm font-medium transition-all border',
                    splitMode === 'equal'
                      ? 'bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300'
                  )}
                >
                  50 / 50
                </button>
                <button
                  type="button"
                  onClick={() => setValue('split_mode', 'custom')}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-sm font-medium transition-all border',
                    splitMode === 'custom'
                      ? 'bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300'
                  )}
                >
                  Personnalisé
                </button>
              </div>
              {splitMode === 'custom' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono text-zinc-500">
                    <span style={{ color: members[0]?.color }}>{members[0]?.display_name}: {customRatio}%</span>
                    <span style={{ color: members[1]?.color }}>{members[1]?.display_name}: {100 - customRatio}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={customRatio}
                    onChange={e => setValue('custom_ratio', Number(e.target.value))}
                    className="w-full accent-zinc-800 dark:accent-zinc-100"
                  />
                </div>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl h-12 text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900"
          >
            {isSubmitting ? 'Enregistrement…' : isEditing ? 'Modifier' : 'Ajouter la dépense'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
