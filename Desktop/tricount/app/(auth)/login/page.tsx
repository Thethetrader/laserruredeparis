'use client'

import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { EnvelopeSimple, Heart, House } from '@phosphor-icons/react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const schema = z.object({
  email: z.string().email('Adresse email invalide'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })
  const email = watch('email')

  async function onSubmit(data: FormData) {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })
    if (error) {
      console.error('Supabase auth error:', error)
      toast.error(`Erreur : ${error.message}`)
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-[100dvh] flex">
      {/* Left — form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 max-w-md mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-8"
        >
          {/* Logo + home */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" alt="ONKHALASS" className="w-8 h-8 rounded-xl object-cover" />
              <span className="font-bold tracking-[0.05em] text-zinc-800 dark:text-zinc-100">ONKHALASS</span>
            </div>
            <Link href="/" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors">
              <House size={16} />
              Accueil
            </Link>
          </div>

          {!sent ? (
            <>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
                  Bon retour
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed max-w-[65ch]">
                  Gérez vos finances à deux sans prise de tête. Entre le lien magique dans ta boîte mail.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-600 dark:text-zinc-400">Adresse email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="toi@exemple.fr"
                    autoComplete="email"
                    className="rounded-2xl h-12"
                    {...register('email')}
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-2xl bg-[#e07a5f] hover:bg-[#d06a4f] text-white font-semibold gap-2 active:scale-[0.98] transition-transform"
                >
                  <EnvelopeSimple size={18} />
                  {isSubmitting ? 'Envoi en cours…' : 'Recevoir le lien magique'}
                </Button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#e07a5f]/10 flex items-center justify-center">
                <EnvelopeSimple size={28} className="text-[#e07a5f]" weight="duotone" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
                  Vérifie ta boîte mail
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                  Un lien de connexion a été envoyé à <strong>{email}</strong>. Clique dessus pour accéder à l'application.
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Right — decorative (hidden on mobile) */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-[#e07a5f]/10 to-[#f2cc8f]/10 dark:from-[#e07a5f]/5 dark:to-[#f2cc8f]/5">
        <div className="text-center space-y-4 px-12">
          <div className="text-6xl font-semibold tracking-tighter text-zinc-200 dark:text-zinc-800 select-none">
            Ensemble.
          </div>
          <p className="text-zinc-400 dark:text-zinc-600 text-sm max-w-xs">
            Dépenses partagées, budgets communs, épargne visualisée — pour avancer à deux sans les frictions.
          </p>
        </div>
      </div>
    </div>
  )
}
