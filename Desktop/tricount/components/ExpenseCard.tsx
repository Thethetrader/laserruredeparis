'use client'

import { formatCurrency, formatShortDate } from '@/lib/utils/format'
import { MemberAvatar } from './MemberAvatar'
import { Trash } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type { Expense, Category, CoupleMember } from '@/lib/supabase/types'

interface ExpenseCardProps {
  expense: Expense
  category?: Category
  paidByMember?: CoupleMember
  onEdit?: () => void
  onDelete?: () => void
}

export function ExpenseCard({ expense, category, paidByMember, onEdit, onDelete }: ExpenseCardProps) {
  return (
    <div className={cn(
      'flex items-center gap-3 py-3 px-4 rounded-2xl',
      'bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800',
      ''
    )}>
      {/* Category icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
        style={{ backgroundColor: (category?.color ?? '#8d99ae') + '22', color: category?.color ?? '#8d99ae' }}
      >
        <span className="font-mono text-xs font-semibold">
          {category?.name?.[0]?.toUpperCase() ?? '?'}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
          {expense.description}
        </p>
        <p className="text-xs text-zinc-400">
          {formatShortDate(expense.spent_at)}
          {category && <span className="ml-1">· {category.name}</span>}
        </p>
      </div>

      {/* Amount + payer */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {expense.receipt_url && (
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Ticket joint" />
        )}
        <span className="font-mono font-semibold text-sm text-zinc-800 dark:text-zinc-100">
          {formatCurrency(expense.amount, expense.currency)}
        </span>
        {paidByMember && (
          <MemberAvatar userId={paidByMember.user_id} name={paidByMember.display_name} color={paidByMember.color} size="sm" />
        )}
      </div>

      {/* Actions */}
      {onDelete && (
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-300 dark:text-zinc-600 hover:text-red-500 active:text-red-500 transition-colors active:scale-95 flex-shrink-0"
          aria-label="Supprimer"
        >
          <Trash size={15} />
        </button>
      )}
    </div>
  )
}
