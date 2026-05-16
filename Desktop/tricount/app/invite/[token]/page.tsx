'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Heart } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import type { CoupleInvite, Couple } from '@/lib/supabase/types'

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [invite, setInvite] = useState<CoupleInvite | null>(null)
  const [couple, setCouple] = useState<Couple | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any
      const { data: inv, error: invError } = await supabase
        .from('couple_invites').select('*').eq('token', token).single()
      if (invError || !inv) { setError('Lien invalide ou expiré'); setLoading(false); return }

      const i = inv as CoupleInvite
      if (i.used_at) { setError('Ce lien a déjà été utilisé'); setLoading(false); return }
      if (new Date(i.expires_at) < new Date()) { setError('Ce lien a expiré'); setLoading(false); return }

      const { data: c } = await supabase.from('couples').select('*').eq('id', i.couple_id).single()
      setInvite(i)
      setCouple(c as Couple)
      setLoading(false)
    }
    load()
  }, [token])

  async function accept() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.info('Connectez-vous d\'abord')
      router.push(`/login?redirect=/invite/${token}`)
      return
    }
    const { data: profile } = await supabase.from('profiles').select('couple_id').eq('id', user.id).single()
    if (profile?.couple_id) { toast.error('Vous êtes déjà dans un couple'); return }

    router.push(`/onboarding?token=${token}`)
  }

  if (loading) return (
    <div className="min-h-[100dvh] flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-[#e07a5f] border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-[#e07a5f]/10 flex items-center justify-center mx-auto">
          <Heart size={32} weight="fill" className="text-[#e07a5f]" />
        </div>

        {error ? (
          <>
            <p className="text-zinc-500">{error}</p>
            <Button onClick={() => router.push('/login')} className="w-full rounded-2xl">
              Retour à l'accueil
            </Button>
          </>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Invitation reçue</h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                Vous êtes invité à rejoindre le couple <strong>{couple?.name}</strong>.
              </p>
            </div>
            <Button
              onClick={accept}
              className="w-full rounded-2xl h-12 bg-[#e07a5f] hover:bg-[#d06a4f] text-white font-semibold"
            >
              Rejoindre le couple
            </Button>
          </>
        )}
      </motion.div>
    </div>
  )
}
