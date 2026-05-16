'use client'

import { useState, useEffect, useMemo } from 'react'
import { useCouple, useCoupleMembers, useSettlements, useCreateSettlement } from '@/lib/queries/useCouple'
import { useAllExpenses } from '@/lib/queries/useExpenses'
import { MemberAvatar } from '@/components/MemberAvatar'
import { formatCurrency, formatShortDate } from '@/lib/utils/format'
import { computeBalance } from '@/lib/utils/balance'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Link as LinkIcon, ArrowsLeftRight, Copy } from '@phosphor-icons/react'
import { MOCK_USER_ID } from '@/lib/mock/data'
import type { Expense, ExpenseShare, Settlement } from '@/lib/supabase/types'

export default function CouplePage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [showSettle, setShowSettle] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)

  const { data: couple, isLoading: coupleLoading } = useCouple()
  const { data: members = [] } = useCoupleMembers()
  const { data: expenses = [] } = useAllExpenses()
  const { data: settlements = [] } = useSettlements()
  const createSettlement = useCreateSettlement()

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') { setUserId(MOCK_USER_ID); return }
    createClient().auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null))
  }, [])

  const currency = couple?.currency ?? 'EUR'
  const allShares = (expenses as (Expense & { expense_shares: ExpenseShare[] })[]).flatMap(e => e.expense_shares ?? [])

  const balance = userId ? computeBalance(userId, expenses as Expense[], allShares, settlements) : 0

  const otherMember = members.find(m => m.user_id !== userId)
  const myMember = members.find(m => m.user_id === userId)

  async function generateInvite() {
    if (!couple) return
    setInviteLoading(true)
    const supabase = createClient()
    const token = crypto.randomUUID()
    const expires = new Date()
    expires.setDate(expires.getDate() + 7)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('couple_invites').insert({
      couple_id: couple.id,
      token,
      expires_at: expires.toISOString(),
    })

    const link = `${window.location.origin}/invite/${token}`
    setInviteLink(link)
    setInviteLoading(false)
  }

  async function copyInvite() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    toast.success('Lien copié !')
  }

  async function settle(amount: number) {
    if (!couple || !userId || !otherMember) return
    try {
      await createSettlement.mutateAsync({
        couple_id: couple.id,
        from_user: balance < 0 ? userId : otherMember.user_id,
        to_user: balance < 0 ? otherMember.user_id : userId,
        amount: Math.abs(amount),
      })
      toast.success('Règlement enregistré')
      setShowSettle(false)
    } catch {
      toast.error('Erreur')
    }
  }

  return (
    <div className="pt-6 space-y-5">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">Couple</h1>

      {coupleLoading ? (
        <Skeleton className="h-28 rounded-2xl" />
      ) : (
        <>
          {/* Couple info */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/50 dark:border-zinc-800">
            <h2 className="font-semibold text-zinc-800 dark:text-zinc-100 text-lg">{couple?.name}</h2>
            <div className="mt-4 flex gap-4">
              {members.map(m => (
                <div key={m.user_id} className="flex items-center gap-2">
                  <MemberAvatar userId={m.user_id} name={m.display_name} color={m.color} size="lg" />
                  <div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{m.display_name}</p>
                    <p className="text-xs font-mono text-zinc-400">{Math.round(m.share_ratio * 100)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Balance */}
          {members.length === 2 && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/50 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Solde équité</h2>
                <button
                  onClick={() => setShowSettle(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#e07a5f] hover:text-[#d06a4f] transition-colors"
                >
                  <ArrowsLeftRight size={14} />
                  Régler
                </button>
              </div>
              {balance === 0 ? (
                <p className="text-sm text-zinc-500">Tout est équilibré</p>
              ) : (
                <div className="flex items-center gap-2">
                  <MemberAvatar name={balance < 0 ? (myMember?.display_name ?? '') : (otherMember?.display_name ?? '')} color={balance < 0 ? (myMember?.color ?? '#e07a5f') : (otherMember?.color ?? '#81b29a')} size="md" />
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    <strong>{balance < 0 ? 'Vous devez' : otherMember?.display_name + ' doit'}</strong>{' '}
                    <span className="font-mono font-semibold text-[#e07a5f]">{formatCurrency(Math.abs(balance), currency)}</span>
                    {balance < 0 ? ` à ${otherMember?.display_name ?? 'votre partenaire'}` : ' vous'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Invite if solo */}
          {members.length < 2 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-200/50 dark:border-amber-900/50">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-3">Invitez votre partenaire</p>
              {inviteLink ? (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-amber-600 dark:text-amber-500 flex-1 break-all">{inviteLink}</p>
                  <button onClick={copyInvite} className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700">
                    <Copy size={14} />
                  </button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={generateInvite}
                  disabled={inviteLoading}
                  className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <LinkIcon size={14} className="mr-1.5" />
                  Générer un lien d'invitation
                </Button>
              )}
            </div>
          )}

          {/* Settlement history */}
          {settlements.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Règlements</h2>
              {settlements.slice(0, 10).map(s => {
                const fromM = members.find(m => m.user_id === s.from_user)
                const toM = members.find(m => m.user_id === s.to_user)
                return (
                  <div key={s.id} className="flex items-center gap-3 bg-white dark:bg-zinc-900 rounded-2xl px-4 py-3 border border-zinc-200/50 dark:border-zinc-800">
                    <div className="flex items-center gap-1.5">
                      {fromM && <MemberAvatar userId={fromM.user_id} name={fromM.display_name} color={fromM.color} size="sm" />}
                      <ArrowsLeftRight size={12} className="text-zinc-300" />
                      {toM && <MemberAvatar userId={toM.user_id} name={toM.display_name} color={toM.color} size="sm" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-zinc-400">{formatShortDate(s.occurred_at)}</p>
                      {s.note && <p className="text-xs text-zinc-500">{s.note}</p>}
                    </div>
                    <span className="font-mono text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      {formatCurrency(s.amount, currency)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Settle modal */}
      <Dialog open={showSettle} onOpenChange={v => !v && setShowSettle(false)}>
        <DialogContent className="sm:max-w-sm rounded-3xl">
          <DialogHeader><DialogTitle>Enregistrer un règlement</DialogTitle></DialogHeader>
          <SettleForm
            defaultAmount={Math.abs(balance)}
            currency={currency}
            onSubmit={settle}
            isLoading={createSettlement.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SettleForm({ defaultAmount, currency, onSubmit, isLoading }: {
  defaultAmount: number
  currency: string
  onSubmit: (amount: number) => void
  isLoading: boolean
}) {
  const [amount, setAmount] = useState(String(defaultAmount.toFixed(2)))
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Montant ({currency})</Label>
        <Input
          type="number"
          step="0.01"
          className="rounded-2xl font-mono text-center text-xl h-14"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
      </div>
      <Button
        onClick={() => onSubmit(parseFloat(amount))}
        disabled={isLoading || isNaN(parseFloat(amount))}
        className="w-full rounded-2xl bg-[#e07a5f] hover:bg-[#d06a4f] text-white"
      >
        {isLoading ? 'Enregistrement…' : 'Confirmer le règlement'}
      </Button>
    </div>
  )
}
