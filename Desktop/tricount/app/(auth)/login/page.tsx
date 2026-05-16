'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Eye, EyeSlash, House } from '@phosphor-icons/react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const schema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Au moins 6 caractères'),
})

type FormData = z.infer<typeof schema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/dashboard'
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    const supabase = createClient()

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (error) {
        toast.error(
          error.message === 'Invalid login credentials'
            ? 'Email ou mot de passe incorrect'
            : error.message
        )
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile, error: profileError } = await (supabase as any).from('profiles').select('couple_id').eq('id', user.id).single()
        if (profileError || !profile) {
          router.push(redirectTo)
        } else {
          router.push(profile.couple_id ? redirectTo : '/onboarding')
        }
      }
    } else {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      })
      if (error) {
        toast.error(
          error.message.includes('already registered')
            ? 'Cet email est déjà utilisé. Essayez de vous connecter.'
            : error.message
        )
        return
      }
      if (authData.session) {
        router.push('/onboarding')
      } else {
        setEmailSent(true)
      }
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm space-y-4 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#e07a5f]/10 flex items-center justify-center mx-auto">
            <span className="text-2xl">📬</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
            Vérifie ta boîte mail
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            Un lien de confirmation a été envoyé. Clique dessus pour activer ton compte, puis reviens te connecter.
          </p>
          <Button
            variant="outline"
            className="rounded-2xl w-full"
            onClick={() => { setEmailSent(false); setMode('login') }}
          >
            Retour à la connexion
          </Button>
        </motion.div>
      </div>
    )
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

          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
              {mode === 'login' ? 'Bon retour' : 'Créer un compte'}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
              {mode === 'login'
                ? 'Connectez-vous à votre espace partagé.'
                : 'Rejoignez ONKHALASS pour gérer vos finances à deux.'}
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

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-600 dark:text-zinc-400">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="rounded-2xl h-12 pr-12"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-2xl bg-[#e07a5f] hover:bg-[#d06a4f] text-white font-semibold active:scale-[0.98] transition-transform"
            >
              {isSubmitting ? 'Chargement…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-500">
            {mode === 'login' ? "Pas encore de compte ? " : "Déjà un compte ? "}
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-[#e07a5f] font-medium hover:underline"
            >
              {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
            </button>
          </p>
        </motion.div>
      </div>

      {/* Right — decorative */}
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
