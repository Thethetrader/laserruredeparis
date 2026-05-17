'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, EnvelopeSimple, CaretDown, CheckCircle, Heart } from '@phosphor-icons/react'
import { DashboardMock, AddExpenseMock, RecurringMock, DebtMock, SavingsMock } from './landing/PhoneMocks'

const TERRA = '#e07a5f'
const SAGE = '#81b29a'
const SAND = '#f2cc8f'
const CREAM = '#faf4ed'
const INK = '#2d2a26'

// ─── Nav ──────────────────────────────────────────────────────────────
function Nav() {
  return (
    <header className="absolute top-0 left-0 right-0 z-40">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="ONKHALASS" width={30} height={30} className="rounded-xl object-cover" style={{ width: 30, height: 30 }} />
          <span className="font-bold tracking-[0.06em] text-white text-base" style={{ fontFamily: 'var(--font-geist-sans), system-ui' }}>
            ONKHALASS
          </span>
        </div>
        <Link
          href="/login"
          className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:opacity-90"
          style={{ background: 'rgba(255,255,255,0.12)', color: 'white', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          Se connecter
        </Link>
      </div>
    </header>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative overflow-hidden min-h-screen flex flex-col" style={{ background: INK }}>
      {/* Subtle gradient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20" style={{ background: `radial-gradient(circle, ${TERRA}, transparent 70%)` }} />
        <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] rounded-full opacity-15" style={{ background: `radial-gradient(circle, ${SAGE}, transparent 70%)` }} />
      </div>

      <Nav />

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-5 pt-24 pb-0 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-5 max-w-2xl"
        >
          <h1
            className="text-[2.8rem] leading-[1.0] md:text-[5.5rem] md:leading-[0.95] tracking-tight font-semibold text-white"
            style={{ fontFamily: 'var(--font-instrument), Georgia, serif' }}
          >
            Le budget à deux,{' '}
            <em className="italic font-normal" style={{ color: TERRA }}>enfin clair.</em>
          </h1>
          <p className="text-lg text-white/60 max-w-sm mx-auto leading-relaxed">
            Mieux dépenser. Plus épargner. Ensemble.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 h-12 px-7 rounded-full text-white font-semibold transition-transform hover:-translate-y-0.5 active:scale-95"
              style={{ background: TERRA, boxShadow: `0 12px 35px -10px ${TERRA}90` }}
            >
              Commencer
              <ArrowRight size={16} weight="bold" />
            </Link>
            <a
              href="#screens"
              className="h-12 px-7 rounded-full font-medium transition-all hover:-translate-y-0.5 flex items-center justify-center"
              style={{ color: 'white', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              Voir l'app
            </a>
          </div>
        </motion.div>

        {/* Three phones */}
        <div className="relative mt-14 flex items-end justify-center gap-4 md:gap-6 w-full max-w-4xl mx-auto">
          {/* Left phone */}
          <motion.div
            initial={{ opacity: 0, y: 60, rotate: -8 }}
            animate={{ opacity: 1, y: 0, rotate: -6 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="hidden sm:block scale-[0.78] origin-bottom mb-[-20px] opacity-80"
            style={{ transform: 'rotate(-6deg) scale(0.78)', transformOrigin: 'bottom center' }}
          >
            <AddExpenseMock />
          </motion.div>

          {/* Center phone — full size, prominent */}
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10"
          >
            <DashboardMock />
          </motion.div>

          {/* Right phone */}
          <motion.div
            initial={{ opacity: 0, y: 60, rotate: 8 }}
            animate={{ opacity: 1, y: 0, rotate: 6 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="hidden sm:block scale-[0.78] origin-bottom mb-[-20px] opacity-80"
            style={{ transform: 'rotate(6deg) scale(0.78)', transformOrigin: 'bottom center' }}
          >
            <DebtMock />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─── Problems ─────────────────────────────────────────────────────────
const PAINS = [
  "« Je fais quoi de mon argent à la fin du mois ? »",
  "« On avait pas prévu assez pour les vacances. »",
  "« C'est toujours moi qui paie tout. »",
  "« On dépense trop mais on sait pas où. »",
]

function Problems() {
  return (
    <section style={{ background: '#fff' }} className="py-20 md:py-28 overflow-hidden">
      <div className="max-w-4xl mx-auto px-5">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-xs font-mono uppercase tracking-widest mb-10"
          style={{ color: TERRA }}
        >
          Ça vous parle ?
        </motion.p>

        <div className="space-y-0 divide-y" style={{ borderColor: INK + '08' }}>
          {PAINS.map((pain, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="py-6 md:py-7"
            >
              <p
                className="text-2xl md:text-3xl font-medium italic leading-snug"
                style={{ color: INK, fontFamily: 'var(--font-instrument), Georgia, serif' }}
              >
                {pain}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex items-center gap-3"
        >
          <div className="h-px flex-1" style={{ background: TERRA + '30' }} />
          <p className="text-sm font-semibold" style={{ color: TERRA }}>ONKHALASS règle ça.</p>
          <div className="h-px flex-1" style={{ background: TERRA + '30' }} />
        </motion.div>
      </div>
    </section>
  )
}

// ─── Screens strip ────────────────────────────────────────────────────
const FEATURES = [
  { mock: <DashboardMock />, label: 'Vue d\'ensemble', sub: 'Budget, épargne, solde — tout visible en temps réel.' },
  { mock: <AddExpenseMock />, label: 'Dépenses', sub: 'Saisie en 5s. Moins vous dépensez, plus vous épargnez.' },
  { mock: <RecurringMock />, label: 'Charges fixes', sub: 'Loyer, abos automatiques — zéro oubli, zéro friction.' },
  { mock: <SavingsMock />, label: 'Épargne d\'abord', sub: 'Posez vos objectifs. L\'app optimise le reste pour y arriver.' },
  { mock: <DebtMock />, label: 'Solde rapide', sub: 'En fin de mois, soldez l\'équité en un clic et libérez du cash.' },
]

function Screens() {
  const [active, setActive] = useState(0)

  return (
    <section id="screens" className="py-24 md:py-32 overflow-hidden" style={{ background: CREAM }}>
      <div className="max-w-6xl mx-auto px-5">

        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none justify-center flex-wrap">
          {FEATURES.map((f, i) => (
            <button
              key={f.label}
              onClick={() => setActive(i)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0"
              style={{
                background: i === active ? INK : 'transparent',
                color: i === active ? 'white' : INK + '80',
                border: `1.5px solid ${i === active ? INK : INK + '20'}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Mock + text */}
        <div className="mt-12 flex flex-col md:flex-row items-center gap-10 md:gap-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex-shrink-0"
            >
              {FEATURES[active].mock}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={active + '-text'}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4 text-center md:text-left"
            >
              <p className="text-xs font-mono uppercase tracking-widest" style={{ color: TERRA }}>
                {String(active + 1).padStart(2, '0')} / {String(FEATURES.length).padStart(2, '0')}
              </p>
              <h2
                className="text-4xl md:text-5xl tracking-tight font-semibold leading-tight"
                style={{ color: INK, fontFamily: 'var(--font-instrument), Georgia, serif' }}
              >
                {FEATURES[active].label}
              </h2>
              <p className="text-xl text-zinc-500 max-w-xs">{FEATURES[active].sub}</p>

              {/* Next button */}
              {active < FEATURES.length - 1 && (
                <button
                  onClick={() => setActive(active + 1)}
                  className="inline-flex items-center gap-2 text-sm font-medium mt-2 transition-opacity hover:opacity-60"
                  style={{ color: INK }}
                >
                  Suivant
                  <ArrowRight size={14} weight="bold" />
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

// ─── CTA ──────────────────────────────────────────────────────────────
function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setState('error'); return }
    setState('loading')
    try {
      const r = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      if (!r.ok) throw new Error()
      setState('success')
    } catch { setState('error') }
  }

  if (state === 'success') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: SAGE + '25' }}>
          <CheckCircle size={28} weight="fill" style={{ color: SAGE }} />
        </div>
        <p className="text-white font-semibold text-lg">Tu es sur la liste.</p>
        <p className="text-white/50 text-sm">On t'écrit dès que ta place beta est prête.</p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto">
      <div className="flex-1 relative">
        <EnvelopeSimple size={17} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.4)' }} />
        <input
          type="email"
          placeholder="ton@email.fr"
          value={email}
          onChange={e => { setEmail(e.target.value); setState('idle') }}
          className="w-full h-12 pl-11 pr-4 rounded-full outline-none text-sm"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: `1.5px solid ${state === 'error' ? '#f87171' : 'rgba(255,255,255,0.15)'}`,
            color: 'white',
          }}
        />
      </div>
      <button
        type="submit"
        disabled={state === 'loading'}
        className="h-12 px-6 rounded-full text-white font-semibold text-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50 whitespace-nowrap"
        style={{ background: TERRA }}
      >
        {state === 'loading' ? '…' : 'Rejoindre la liste'}
      </button>
    </form>
  )
}

function CTA() {
  return (
    <section style={{ background: INK }} className="py-24 md:py-36 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-10" style={{ background: `radial-gradient(ellipse, ${TERRA}, transparent 70%)` }} />
      </div>
      <div className="relative max-w-2xl mx-auto px-5 text-center space-y-8">
        <h2
          className="text-4xl md:text-6xl tracking-tight font-semibold text-white leading-tight"
          style={{ fontFamily: 'var(--font-instrument), Georgia, serif' }}
        >
          Votre épargne commune,{' '}
          <em className="italic font-normal" style={{ color: SAND }}>enfin qui progresse.</em>
        </h2>
        <p className="text-white/50">Optimisez vos dépenses, faites grossir vos projets.</p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 h-12 px-8 rounded-full text-white font-semibold transition-transform hover:-translate-y-0.5 active:scale-95"
          style={{ background: TERRA, boxShadow: `0 12px 35px -10px ${TERRA}90` }}
        >
          Se connecter
          <ArrowRight size={16} weight="bold" />
        </Link>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  { q: "C'est gratuit ?", a: "Oui, totalement gratuit pendant la beta. Un plan premium très abordable arrivera plus tard, mais le cœur restera gratuit." },
  { q: "Ça marche sur iPhone et Android ?", a: "ONKHALASS est une PWA — installable depuis le navigateur sur iOS et Android comme une app native." },
  { q: "Faut-il que mon/ma partenaire ait un compte ?", a: "Oui, vous êtes deux comptes reliés. Vous l'invitez par email en un clic depuis l'app." },
  { q: "Que se passe-t-il si on ne solde pas un mois ?", a: "La dette se reporte automatiquement avec un historique clair mois par mois." },
  { q: "Mes données sont-elles privées ?", a: "Données stockées en Europe, chiffrées au repos. Pas de pub, pas de revente, export possible à tout moment." },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b last:border-b-0" style={{ borderColor: INK + '12' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-5 flex items-center justify-between gap-4 text-left"
      >
        <span className="font-medium" style={{ color: INK }}>{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <CaretDown size={16} weight="bold" style={{ color: TERRA }} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="text-zinc-500 leading-relaxed pb-5 pr-8 text-sm max-w-[55ch]">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Faq() {
  return (
    <section style={{ background: CREAM }} className="py-20 md:py-28">
      <div className="max-w-2xl mx-auto px-5">
        <h2
          className="text-3xl md:text-4xl font-semibold tracking-tight mb-10"
          style={{ color: INK, fontFamily: 'var(--font-instrument), Georgia, serif' }}
        >
          Questions fréquentes
        </h2>
        {FAQ_ITEMS.map(item => <FaqItem key={item.q} {...item} />)}
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: INK }} className="py-10">
      <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="ONKHALASS" width={24} height={24} className="rounded-lg object-cover" style={{ width: 24, height: 24 }} />
          <span className="text-sm font-bold tracking-wider text-white/70">ONKHALASS</span>
        </div>
        <div className="flex items-center gap-5 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          <Link href="/legal/privacy" className="hover:text-white/60 transition-colors">Confidentialité</Link>
          <Link href="/legal/terms" className="hover:text-white/60 transition-colors">CGU</Link>
          <a href="mailto:hello@onkhalass.app" className="hover:text-white/60 transition-colors">Contact</a>
        </div>
        <p className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Made with <Heart size={10} weight="fill" style={{ color: TERRA }} /> in France
        </p>
      </div>
    </footer>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────
export default function LandingClient() {
  return (
    <div>
      <Hero />
      <Problems />
      <Screens />
      <CTA />
      <Faq />
      <Footer />
    </div>
  )
}
