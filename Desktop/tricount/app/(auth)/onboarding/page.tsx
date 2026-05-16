'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { insertCouple, insertCoupleMember, updateProfile, selectInviteByToken, markInviteUsed } from '@/lib/supabase/typed'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Heart, LinkSimple, Plus } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { createDefaultCategories } from '@/lib/utils/categories'
import type { Couple } from '@/lib/supabase/types'

const COLORS = ['#e07a5f', '#81b29a', '#3d405b', '#f2cc8f', '#457b9d', '#e63946']

export default function OnboardingPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [coupleName, setCoupleName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [inviteToken, setInviteToken] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!coupleName.trim() || !displayName.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Non connecté'); setLoading(false); return }

    try {
      const { data: couple, error: coupleError } = await insertCouple(supabase, { name: coupleName.trim() })
      if (coupleError || !couple) throw coupleError ?? new Error('Création échouée')

      await insertCoupleMember(supabase, { couple_id: couple.id, user_id: user.id, display_name: displayName.trim(), color })
      await updateProfile(supabase, user.id, { couple_id: couple.id, display_name: displayName.trim(), color })
      await createDefaultCategories(supabase, couple.id)

      toast.success('Couple créé ! Invitez votre partenaire.')
      router.push('/')
    } catch {
      toast.error('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (!inviteToken.trim() || !displayName.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Non connecté'); setLoading(false); return }

    try {
      const token = inviteToken.trim().split('/').pop() ?? inviteToken.trim()
      const { data: invite, error: inviteError } = await selectInviteByToken(supabase, token)
      if (inviteError || !invite) throw new Error('Lien invalide')
      if (invite.used_at) throw new Error('Ce lien a déjà été utilisé')
      if (new Date(invite.expires_at) < new Date()) throw new Error('Ce lien a expiré')

      await insertCoupleMember(supabase, { couple_id: invite.couple_id, user_id: user.id, display_name: displayName.trim(), color })
      await updateProfile(supabase, user.id, { couple_id: invite.couple_id, display_name: displayName.trim(), color })
      await markInviteUsed(supabase, invite.id)

      toast.success('Bienvenue dans le couple !')
      router.push('/')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#e07a5f] flex items-center justify-center">
            <Heart size={16} weight="fill" className="text-white" />
          </div>
          <span className="font-semibold tracking-tight">ONKHALASS</span>
        </div>

        {mode === 'choose' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Commençons</h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
                Créez un nouveau couple ou rejoignez celui de votre partenaire.
              </p>
            </div>

            <button
              onClick={() => setMode('create')}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-[#e07a5f]/50 hover:bg-[#e07a5f]/5 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[#e07a5f]/10 flex items-center justify-center">
                <Plus size={20} className="text-[#e07a5f]" />
              </div>
              <div>
                <p className="font-medium text-zinc-800 dark:text-zinc-100 text-sm">Créer un couple</p>
                <p className="text-xs text-zinc-400">Invitez votre partenaire ensuite</p>
              </div>
            </button>

            <button
              onClick={() => setMode('join')}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-[#81b29a]/50 hover:bg-[#81b29a]/5 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[#81b29a]/10 flex items-center justify-center">
                <LinkSimple size={20} className="text-[#81b29a]" />
              </div>
              <div>
                <p className="font-medium text-zinc-800 dark:text-zinc-100 text-sm">Rejoindre via lien</p>
                <p className="text-xs text-zinc-400">Votre partenaire vous a envoyé un lien</p>
              </div>
            </button>
          </motion.div>
        )}

        {(mode === 'create' || mode === 'join') && (
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <h1 className="text-2xl font-semibold tracking-tight">
              {mode === 'create' ? 'Créer un couple' : 'Rejoindre un couple'}
            </h1>

            <div className="space-y-2">
              <Label className="text-zinc-600 dark:text-zinc-400">Votre prénom</Label>
              <Input placeholder="Ex : Marie" className="rounded-2xl" value={displayName} onChange={e => setDisplayName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-600 dark:text-zinc-400">Votre couleur</Label>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className="w-8 h-8 rounded-full transition-transform active:scale-95"
                    style={{ backgroundColor: c, outline: color === c ? `2px solid ${c}` : '2px solid transparent', outlineOffset: '2px' }}
                  />
                ))}
              </div>
            </div>

            {mode === 'create' && (
              <div className="space-y-2">
                <Label className="text-zinc-600 dark:text-zinc-400">Nom du couple</Label>
                <Input placeholder="Ex : Marie & Paul" className="rounded-2xl" value={coupleName} onChange={e => setCoupleName(e.target.value)} />
              </div>
            )}

            {mode === 'join' && (
              <div className="space-y-2">
                <Label className="text-zinc-600 dark:text-zinc-400">Lien ou code d'invitation</Label>
                <Input placeholder="Collez le lien ici" className="rounded-2xl" value={inviteToken} onChange={e => setInviteToken(e.target.value)} />
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setMode('choose')} className="flex-1 rounded-2xl">Retour</Button>
              <Button
                onClick={mode === 'create' ? handleCreate : handleJoin}
                disabled={loading}
                className="flex-1 rounded-2xl bg-[#e07a5f] hover:bg-[#d06a4f] text-white font-semibold active:scale-[0.98] transition-transform"
              >
                {loading ? 'Chargement…' : mode === 'create' ? 'Créer' : 'Rejoindre'}
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
