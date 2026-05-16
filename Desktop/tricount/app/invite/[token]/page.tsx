'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { insertCoupleMember, updateProfile } from '@/lib/supabase/typed'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Heart } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import type { CoupleInvite, Couple } from '@/lib/supabase/types'

const COLORS = ['#e07a5f', '#81b29a', '#3d405b', '#f2cc8f', '#457b9d', '#e63946']

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [invite, setInvite] = useState<CoupleInvite | null>(null)
  const [couple, setCouple] = useState<Couple | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<{ id: string } | null | undefined>(undefined)

  // Form state for signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [color, setColor] = useState(COLORS[1])
  const [submitting, setSubmitting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any

      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user ?? null)

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

  async function joinCouple(userId: string) {
    if (!invite) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any

    const { data: profile } = await supabase.from('profiles').select('couple_id').eq('id', userId).single()
    if (profile?.couple_id) { toast.error('Vous êtes déjà dans un couple'); return }

    await insertCoupleMember(supabase, {
      couple_id: invite.couple_id,
      user_id: userId,
      display_name: displayName.trim() || email.split('@')[0],
      color,
    })
    await updateProfile(supabase, userId, {
      couple_id: invite.couple_id,
      display_name: displayName.trim() || email.split('@')[0],
      color,
    })
    await supabase.from('couple_invites').update({ used_at: new Date().toISOString() }).eq('id', invite.id)

    toast.success('Bienvenue dans le couple !')
    router.push('/dashboard')
  }

  async function handleSignupAndJoin() {
    if (!email || !password || !displayName.trim()) {
      toast.error('Remplis tous les champs')
      return
    }
    setSubmitting(true)
    const supabase = createClient()

    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      toast.error(
        error.message.includes('already registered')
          ? 'Cet email est déjà utilisé. Connectez-vous depuis la page de connexion.'
          : error.message
      )
      setSubmitting(false)
      return
    }

    if (authData.session && authData.user) {
      await joinCouple(authData.user.id)
    } else {
      // Email confirmation required — store token so user can come back
      setEmailSent(true)
    }
    setSubmitting(false)
  }

  async function handleAlreadyLoggedIn() {
    if (!currentUser || !invite) return
    setSubmitting(true)
    await joinCouple(currentUser.id)
    setSubmitting(false)
  }

  if (loading) return (
    <div className="min-h-[100dvh] flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-[#e07a5f] border-t-transparent animate-spin" />
    </div>
  )

  if (emailSent) return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm space-y-4 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-[#e07a5f]/10 flex items-center justify-center mx-auto">
          <span className="text-2xl">📬</span>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">Vérifie ta boîte mail</h2>
        <p className="text-zinc-500">
          Un lien de confirmation a été envoyé à <strong>{email}</strong>. Clique dessus, puis reviens sur ce lien d'invitation pour rejoindre le couple.
        </p>
      </motion.div>
    </div>
  )

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-3">
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
              <h1 className="text-2xl font-semibold tracking-tight">Invitation reçue</h1>
              <p className="text-zinc-500 dark:text-zinc-400">
                Vous êtes invité à rejoindre le couple <strong>{couple?.name}</strong>.
              </p>
            </>
          )}
        </div>

        {!error && (
          <>
            {currentUser ? (
              /* Already logged in — just join */
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-600 dark:text-zinc-400">Votre prénom</Label>
                  <Input
                    placeholder="Ex : Marie"
                    className="rounded-2xl"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                  />
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
                <Button
                  onClick={handleAlreadyLoggedIn}
                  disabled={submitting || !displayName.trim()}
                  className="w-full rounded-2xl h-12 bg-[#e07a5f] hover:bg-[#d06a4f] text-white font-semibold"
                >
                  {submitting ? 'Chargement…' : 'Rejoindre le couple'}
                </Button>
              </div>
            ) : (
              /* Not logged in — sign up + join */
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-600 dark:text-zinc-400">Votre prénom</Label>
                  <Input
                    placeholder="Ex : Marie"
                    className="rounded-2xl"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                  />
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

                <div className="space-y-2">
                  <Label className="text-zinc-600 dark:text-zinc-400">Adresse email</Label>
                  <Input
                    type="email"
                    placeholder="toi@exemple.fr"
                    className="rounded-2xl"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-600 dark:text-zinc-400">Mot de passe</Label>
                  <Input
                    type="password"
                    placeholder="Au moins 6 caractères"
                    className="rounded-2xl"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleSignupAndJoin}
                  disabled={submitting}
                  className="w-full rounded-2xl h-12 bg-[#e07a5f] hover:bg-[#d06a4f] text-white font-semibold active:scale-[0.98] transition-transform"
                >
                  {submitting ? 'Chargement…' : 'Créer mon compte et rejoindre'}
                </Button>

                <p className="text-center text-sm text-zinc-500">
                  Déjà un compte ?{' '}
                  <button
                    onClick={() => router.push(`/login?redirect=/invite/${token}`)}
                    className="text-[#e07a5f] font-medium hover:underline"
                  >
                    Se connecter
                  </button>
                </p>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}
