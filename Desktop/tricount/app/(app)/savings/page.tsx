'use client'

import { useState, useMemo } from 'react'
import { Plus, PiggyBank } from '@phosphor-icons/react'
import { PotCard } from '@/components/PotCard'
import { useSavingsPots, useSavingsTransactions, useAllSavingsTransactions, useCreateSavingsPot, useCreateSavingsTransaction } from '@/lib/queries/useSavings'
import { useCouple, useCoupleMembers } from '@/lib/queries/useCouple'
import { formatCurrency } from '@/lib/utils/format'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'
import type { SavingsTransaction } from '@/lib/supabase/types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function SavingsPage() {
  const [showAddPot, setShowAddPot] = useState(false)
  const [showAddTx, setShowAddTx] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const { data: couple } = useCouple()
  const { data: members = [] } = useCoupleMembers()
  const { data: pots = [], isLoading } = useSavingsPots()
  const { data: allTx = [] } = useAllSavingsTransactions()
  const createPot = useCreateSavingsPot()
  const createTx = useCreateSavingsTransaction()

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null))
  }, [])

  const currency = couple?.currency ?? 'EUR'

  const potTxMap = useMemo(() => {
    const map = new Map<string, SavingsTransaction[]>()
    for (const tx of allTx) {
      if (!map.has(tx.pot_id)) map.set(tx.pot_id, [])
      map.get(tx.pot_id)!.push(tx)
    }
    return map
  }, [allTx])

  const totalSaved = pots.reduce((total, pot) => {
    const txs = potTxMap.get(pot.id) ?? []
    return total + txs.reduce((acc, tx) => tx.type === 'deposit' ? acc + tx.amount : acc - tx.amount, 0)
  }, 0)

  // Monthly evolution for chart
  const monthlyEvolution = useMemo(() => {
    const map = new Map<string, number>()
    const sorted = [...allTx].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at))
    let running = 0
    for (const tx of sorted) {
      const m = tx.occurred_at.slice(0, 7)
      running += tx.type === 'deposit' ? tx.amount : -tx.amount
      map.set(m, running)
    }
    return Array.from(map.entries()).map(([month, total]) => ({
      month: format(new Date(month + '-01'), 'MMM yy', { locale: fr }),
      total,
    }))
  }, [allTx])

  return (
    <div className="pt-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">Épargne</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowAddTx(true)} className="rounded-xl text-xs">
            + Transaction
          </Button>
          <Button size="sm" onClick={() => setShowAddPot(true)} className="rounded-xl text-xs bg-[#e07a5f] hover:bg-[#d06a4f] text-white">
            + Pot
          </Button>
        </div>
      </div>

      {/* Total */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/50 dark:border-zinc-800">
        <p className="text-xs text-zinc-400 mb-1">Épargne totale</p>
        <p className="font-mono text-3xl font-semibold text-[#2a9d8f] tracking-tight">{formatCurrency(totalSaved, currency)}</p>
      </div>

      {/* Area chart */}
      {monthlyEvolution.length > 1 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200/50 dark:border-zinc-800">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Évolution</h2>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={monthlyEvolution} margin={{ left: -20 }}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: unknown) => formatCurrency(Number(v), currency)} />
              <Area type="monotone" dataKey="total" stroke="#2a9d8f" fill="#2a9d8f22" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pots list */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      ) : pots.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#2a9d8f]/10 flex items-center justify-center mx-auto">
            <PiggyBank size={24} className="text-[#2a9d8f]" />
          </div>
          <p className="text-zinc-400 text-sm">Aucun pot d'épargne</p>
          <p className="text-xs text-zinc-300 dark:text-zinc-600">Créez votre premier pot pour commencer</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pots</h2>
          {pots.map(pot => (
            <PotCard key={pot.id} pot={pot} transactions={potTxMap.get(pot.id) ?? []} currency={currency} />
          ))}
        </div>
      )}

      <AddPotModal
        open={showAddPot}
        onClose={() => setShowAddPot(false)}
        coupleId={couple?.id ?? ''}
        userId={userId ?? ''}
        onCreate={async (pot) => {
          try {
            await createPot.mutateAsync(pot as Parameters<typeof createPot.mutateAsync>[0])
            toast.success('Pot créé')
            setShowAddPot(false)
          } catch { toast.error('Erreur') }
        }}
      />
      <AddTxModal
        open={showAddTx}
        onClose={() => setShowAddTx(false)}
        pots={pots}
        coupleId={couple?.id ?? ''}
        userId={userId ?? ''}
        onCreate={async (tx) => {
          try {
            await createTx.mutateAsync(tx as Parameters<typeof createTx.mutateAsync>[0])
            toast.success('Transaction ajoutée')
            setShowAddTx(false)
          } catch { toast.error('Erreur') }
        }}
      />
    </div>
  )
}

function AddPotModal({ open, onClose, coupleId, userId, onCreate }: { open: boolean; onClose: () => void; coupleId: string; userId: string; onCreate: (pot: object) => void }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#2a9d8f')
  const [target, setTarget] = useState('')
  const [isShared, setIsShared] = useState(true)

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-sm rounded-3xl">
        <DialogHeader><DialogTitle>Nouveau pot</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Nom</Label>
            <Input placeholder="Ex : Vacances été" className="rounded-2xl" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Objectif (optionnel)</Label>
            <Input type="number" placeholder="0,00" className="rounded-2xl" value={target} onChange={e => setTarget(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="shared" checked={isShared} onChange={e => setIsShared(e.target.checked)} className="rounded" />
            <Label htmlFor="shared">Pot commun</Label>
          </div>
          <Button
            className="w-full rounded-2xl bg-[#2a9d8f] hover:bg-[#21887b] text-white"
            onClick={() => onCreate({ couple_id: coupleId, name, icon: 'PiggyBank', color, target_amount: target ? parseFloat(target) : null, is_shared: isShared, owner_user_id: isShared ? null : userId, is_archived: false })}
          >
            Créer le pot
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

import type { SavingsPot as SPot } from '@/lib/supabase/types'

function AddTxModal({ open, onClose, pots, coupleId, userId, onCreate }: { open: boolean; onClose: () => void; pots: SPot[]; coupleId: string; userId: string; onCreate: (tx: object) => void }) {
  const [potId, setPotId] = useState(pots[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit')
  const [desc, setDesc] = useState('')

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-sm rounded-3xl">
        <DialogHeader><DialogTitle>Nouvelle transaction</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Pot</Label>
            <select className="w-full h-10 px-3 rounded-2xl border border-input bg-background text-sm" value={potId} onChange={e => setPotId(e.target.value)}>
              {pots?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setType('deposit')} className={`flex-1 py-2 rounded-xl text-sm font-medium border ${type === 'deposit' ? 'bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent' : 'border-zinc-200 text-zinc-500'}`}>Versement</button>
            <button onClick={() => setType('withdrawal')} className={`flex-1 py-2 rounded-xl text-sm font-medium border ${type === 'withdrawal' ? 'bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent' : 'border-zinc-200 text-zinc-500'}`}>Retrait</button>
          </div>
          <div className="space-y-1">
            <Label>Montant</Label>
            <Input type="number" step="0.01" placeholder="0,00" className="rounded-2xl font-mono text-center" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Description (optionnel)</Label>
            <Input placeholder="Ex : Salaire juillet" className="rounded-2xl" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <Button
            className="w-full rounded-2xl bg-[#e07a5f] hover:bg-[#d06a4f] text-white"
            onClick={() => onCreate({ couple_id: coupleId, pot_id: potId, amount: parseFloat(amount), type, description: desc || null, made_by: userId, source_month: null })}
          >
            Ajouter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
