'use client'

import { useState, useRef } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Heart, ArrowRight, EnvelopeSimple, CaretDown, Check, Sparkle,
  Question, Repeat, HeartBreak, Lightning, Camera, Scales,
  ChartBar, ArrowsClockwise, PiggyBank, ShieldCheck, House,
  CheckCircle, Star,
} from '@phosphor-icons/react'
import { DashboardMock, AddExpenseMock, RecurringMock, DebtMock, SavingsMock } from './PhoneMocks'

const TERRA = '#e07a5f'
const TERRA_DARK = '#c8654f'
const SAGE = '#81b29a'
const SAND = '#f2cc8f'
const CREAM = '#faf4ed'
const INK = '#2d2a26'

// ─── Reusable animation wrapper ─────────────────────────────────────
function Reveal({ children, delay = 0, y = 24, className = '' }: { children: React.ReactNode; delay?: number; y?: number; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Logo ───────────────────────────────────────────────────────────
function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'text-base', md: 'text-lg', lg: 'text-2xl' }
  const imgSize = size === 'lg' ? 44 : size === 'md' ? 32 : 24
  return (
    <div className="flex items-center gap-2 select-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.jpg" alt="ONKHALASS" width={imgSize} height={imgSize} className="rounded-xl object-cover shadow-sm" style={{ width: imgSize, height: imgSize }} />
      <span className={`font-bold tracking-[0.05em] ${sizes[size]}`} style={{ color: INK, fontFamily: 'var(--font-geist-sans), system-ui' }}>
        ONKHALASS
      </span>
    </div>
  )
}

// ─── Nav ────────────────────────────────────────────────────────────
function Nav() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md" style={{ background: CREAM + 'd9' }}>
      <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
        <Logo size="md" />
        <nav className="hidden md:flex items-center gap-7 text-sm" style={{ color: INK }}>
          <a href="#solution" className="hover:opacity-70 transition-opacity">Fonctionnalités</a>
          <a href="#faq" className="hover:opacity-70 transition-opacity">FAQ</a>
          <Link href="/login" className="px-4 py-2 rounded-full text-white text-sm font-medium transition-transform hover:-translate-y-0.5" style={{ background: TERRA }}>
            Se connecter
          </Link>
        </nav>
        <Link href="/login" className="md:hidden px-3 py-1.5 rounded-full text-white text-xs font-medium" style={{ background: TERRA }}>
          Se connecter
        </Link>
      </div>
    </header>
  )
}

// ─── Hero ───────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Zellige-inspired subtle pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, ${TERRA} 1.5px, transparent 1.5px), radial-gradient(circle at 75% 75%, ${SAGE} 1px, transparent 1px)`,
          backgroundSize: '60px 60px, 40px 40px',
        }}
      />
      <div className="relative max-w-6xl mx-auto px-5 pt-12 pb-20 md:pt-20 md:pb-32 grid md:grid-cols-12 gap-10 md:gap-6 items-center">
        <div className="md:col-span-7 space-y-7">
          <Reveal delay={0.05}>
            <h1 className="text-[2.5rem] leading-[1.05] md:text-[4.25rem] md:leading-[1] tracking-tight font-semibold" style={{ color: INK, fontFamily: 'var(--font-instrument), Georgia, serif' }}>
              Le budget de votre couple, <em className="italic font-normal" style={{ color: TERRA }}>enfin clair.</em>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-lg md:text-xl text-zinc-600 leading-relaxed max-w-[60ch]">
              Suivez vos dépenses à deux, programmez vos charges fixes, et soldez vos comptes chaque mois. À la fin : <span className="font-bold" style={{ color: TERRA }}>ONKHALASS</span>.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/login" className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full text-white font-medium shadow-lg transition-transform hover:-translate-y-0.5 active:scale-[0.98]" style={{ background: TERRA, boxShadow: `0 10px 30px -10px ${TERRA}80` }}>
                Se connecter
                <ArrowRight size={16} weight="bold" />
              </Link>
              <a href="#demo" className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full font-medium border-2 transition-transform hover:-translate-y-0.5 active:scale-[0.98]" style={{ color: INK, borderColor: INK + '20' }}>
                Voir une démo
              </a>
            </div>
          </Reveal>
          <Reveal delay={0.25}>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-500 pt-2">
              <span className="flex items-center gap-1.5"><Check size={12} weight="bold" style={{ color: SAGE }} /> Sans pub</span>
              <span className="flex items-center gap-1.5"><Check size={12} weight="bold" style={{ color: SAGE }} /> Données privées</span>
              <span className="flex items-center gap-1.5"><Check size={12} weight="bold" style={{ color: SAGE }} /> Made in France</span>
            </div>
          </Reveal>
        </div>

        <div className="md:col-span-5 flex justify-center md:justify-end">
          <Reveal delay={0.2}>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, ease: 'easeInOut', repeat: Infinity }}
            >
              <DashboardMock />
            </motion.div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// ─── Problem ────────────────────────────────────────────────────────
function Problem() {
  const items = [
    { i: Question, title: 'Des doutes', text: '« C\'est encore moi qui ai payé les courses ce mois ? Ou c\'était toi ? »' },
    { i: Repeat, title: 'Des oublis', text: 'Le prélèvement Netflix qu\'on oublie de répartir. Le loyer recompté à chaque fois.' },
    { i: HeartBreak, title: 'De la dette qui traîne', text: '« Je te dois encore 80€ du mois dernier. Ou c\'était le mois d\'avant ? »' },
  ]
  return (
    <section className="py-20 md:py-28" style={{ background: '#fff' }}>
      <div className="max-w-5xl mx-auto px-5">
        <Reveal>
          <h2 className="text-3xl md:text-5xl tracking-tight font-semibold text-center max-w-3xl mx-auto" style={{ color: INK, fontFamily: 'var(--font-instrument), Georgia, serif' }}>
            Gérer un budget à deux, ça crée souvent...
          </h2>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-5 md:gap-7 mt-14">
          {items.map((it, i) => {
            const Ic = it.i
            return (
              <Reveal key={it.title} delay={i * 0.1}>
                <div className="rounded-3xl p-6 md:p-7 h-full border border-zinc-100" style={{ background: CREAM }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: TERRA + '15' }}>
                    <Ic size={22} weight="duotone" color={TERRA} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: INK }}>{it.title}</h3>
                  <p className="text-zinc-600 leading-relaxed">{it.text}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── Solution pillar component ─────────────────────────────────────
function Pillar({ index, badge, title, description, bullets, mockup, reverse = false }: {
  index: number
  badge?: string
  title: React.ReactNode
  description: string
  bullets: string[]
  mockup: React.ReactNode
  reverse?: boolean
}) {
  return (
    <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center py-12 md:py-20">
      <div className={`space-y-5 ${reverse ? 'md:order-2' : ''}`}>
        <Reveal>
          <div className="inline-flex items-center gap-2 text-xs font-medium font-mono" style={{ color: TERRA }}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px]" style={{ background: TERRA + '15' }}>0{index}</span>
            {badge}
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <h3 className="text-3xl md:text-4xl tracking-tight font-semibold leading-tight" style={{ color: INK, fontFamily: 'var(--font-instrument), Georgia, serif' }}>
            {title}
          </h3>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-lg text-zinc-600 leading-relaxed max-w-[55ch]">{description}</p>
        </Reveal>
        <Reveal delay={0.15}>
          <ul className="space-y-2 pt-2">
            {bullets.map(b => (
              <li key={b} className="flex items-start gap-2.5 text-zinc-700">
                <Check size={18} weight="bold" className="mt-0.5 flex-shrink-0" style={{ color: SAGE }} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
      <div className={`flex justify-center ${reverse ? 'md:order-1' : ''}`}>
        <Reveal delay={0.1} y={32}>
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity, delay: index * 0.4 }}>
            {mockup}
          </motion.div>
        </Reveal>
      </div>
    </div>
  )
}

function Solution() {
  return (
    <section id="solution" className="py-12 md:py-20" style={{ background: CREAM }}>
      <div className="max-w-6xl mx-auto px-5">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
            <span className="text-xs font-mono font-medium uppercase tracking-widest" style={{ color: TERRA }}>La solution</span>
            <h2 className="text-3xl md:text-5xl tracking-tight font-semibold mt-3" style={{ color: INK, fontFamily: 'var(--font-instrument), Georgia, serif' }}>
              Une app conçue pour vivre <em className="italic font-normal" style={{ color: TERRA }}>la vraie vie</em> du couple.
            </h2>
          </div>
        </Reveal>

        <div className="divide-y divide-zinc-200/60">
          <Pillar
            index={1}
            badge="Saisie éclair"
            title="En 5 secondes, c'est dans la cagnotte commune."
            description="Tap, montant, catégorie. Pas de menus profonds. Pas de scroll infini. ONKHALASS est pensé pour la vraie vie : la queue à la caisse, le restaurant, la pompe."
            bullets={['Pré-rempli intelligent (dernière catégorie, payeur courant)', 'Photo du ticket en option', 'Notification temps réel à ton/ta partenaire']}
            mockup={<AddExpenseMock />}
          />
          <Pillar
            index={2}
            badge="Charges fixes auto"
            title={<>Programmez une fois. <em className="italic font-normal" style={{ color: TERRA }}>Auto-injecté chaque mois.</em></>}
            description="Loyer, abonnements, mutuelle, crédits : configurez vos charges récurrentes une seule fois. ONKHALASS les ajoute automatiquement au bon nom, le bon jour, avec la bonne répartition."
            bullets={['Chaque charge rattachée à UNE personne (qui paye réellement)', 'Répartition libre : 50/50, 70/30, ou 100% perso', 'Indicateur visuel "récurrent" sur les dépenses concernées']}
            mockup={<RecurringMock />}
            reverse
          />
          <Pillar
            index={3}
            badge="Budget vivant"
            title="Des jauges en temps réel, pas un fichier Excel."
            description="Fixez un budget mensuel par catégorie. Voyez instantanément où vous en êtes. Code couleur du vert vers le rouge : clair, immédiat, sans calcul mental."
            bullets={['Budget prévisionnel par catégorie', 'Projection fin de mois calculée en live', 'Alertes douces avant le dépassement']}
            mockup={<DashboardMock />}
          />
          <Pillar
            index={4}
            badge="Dette cumulée"
            title={<>La dette se reporte. <em className="italic font-normal" style={{ color: TERRA }}>Rien ne se perd.</em></>}
            description="Tous les mois, ONKHALASS calcule qui doit combien à l'autre. Si vous ne soldez pas, la dette se reporte avec un historique limpide. Un clic sur « On khalass ! » remet le compteur à zéro."
            bullets={['Solde mensuel + cumulé visibles en permanence', 'Historique complet, jamais d\'oubli', 'Bouton "On khalass !" pour archiver le règlement']}
            mockup={<DebtMock />}
            reverse
          />
          <Pillar
            index={5}
            badge="Épargne par projets"
            title="Vos rêves, en jauges qui montent."
            description="Pots avec objectifs : Vacances, Maison, Voiture, Imprévu. Communs ou perso. Visualisez votre progression et célébrez les paliers ensemble."
            bullets={['Pots communs ou personnels', 'Objectifs avec date cible', 'Suivi des virements et historique']}
            mockup={<SavingsMock />}
          />
        </div>
      </div>
    </section>
  )
}

// ─── Demo interactive ──────────────────────────────────────────────
function Demo() {
  const screens = [
    { key: 'dashboard', label: 'Dashboard', text: 'Vue d\'ensemble : solde, dépensé, restant, épargne, tout en un coup d\'œil.', mock: <DashboardMock /> },
    { key: 'expense', label: 'Saisie', text: 'Une dépense en 5 secondes, partage 50/50 ou personnalisé.', mock: <AddExpenseMock /> },
    { key: 'recurring', label: 'Charges fixes', text: 'Loyer, abos, mutuelle : programmez une fois, c\'est répété chaque mois.', mock: <RecurringMock /> },
    { key: 'debt', label: 'Dette & règlement', text: 'L\'historique mensuel, et le bouton « On khalass ! » qui clos le mois.', mock: <DebtMock /> },
    { key: 'savings', label: 'Épargne', text: 'Vos pots d\'épargne avec objectifs et progression visuelle.', mock: <SavingsMock /> },
  ]
  const [active, setActive] = useState(0)

  return (
    <section id="demo" className="py-20 md:py-28" style={{ background: '#fff' }}>
      <div className="max-w-6xl mx-auto px-5">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-mono font-medium uppercase tracking-widest" style={{ color: TERRA }}>L'app en action</span>
            <h2 className="text-3xl md:text-5xl tracking-tight font-semibold mt-3" style={{ color: INK, fontFamily: 'var(--font-instrument), Georgia, serif' }}>
              Glissez à travers ONKHALASS.
            </h2>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-5 order-2 md:order-1 space-y-2">
            {screens.map((s, i) => (
              <button
                key={s.key}
                onClick={() => setActive(i)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${i === active ? 'shadow-sm' : 'hover:bg-zinc-50'}`}
                style={{
                  borderColor: i === active ? TERRA : 'transparent',
                  background: i === active ? TERRA + '10' : '#fff',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: i === active ? TERRA : INK }}>
                    {i + 1}. {s.label}
                  </span>
                  {i === active && <ArrowRight size={16} weight="bold" style={{ color: TERRA }} />}
                </div>
                {i === active && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-sm text-zinc-600 mt-2 leading-relaxed"
                  >
                    {s.text}
                  </motion.p>
                )}
              </button>
            ))}
          </div>
          <div className="md:col-span-7 order-1 md:order-2 flex justify-center md:justify-end">
            <AnimatePresence mode="wait">
              <motion.div
                key={screens[active].key}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                {screens[active].mock}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Differentiators ──────────────────────────────────────────────
function Differentiators() {
  const feats = [
    { i: Scales, title: 'Parts inégales', text: '60/40 ? 70/30 ? Ajustez selon vos revenus respectifs.' },
    { i: Repeat, title: 'Charges fixes auto', text: 'Programmez une fois, c\'est répété chaque mois.' },
    { i: ChartBar, title: 'Dette cumulée', text: 'Plus rien ne se perd entre les mois.' },
    { i: ArrowsClockwise, title: 'Sync temps réel', text: 'Quand l\'un saisit, l\'autre voit instantanément.' },
    { i: Camera, title: 'Photos de tickets', text: 'Gardez vos justificatifs avec chaque dépense.' },
    { i: PiggyBank, title: 'Pots d\'épargne', text: 'Communs ou personnels, avec objectifs visuels.' },
  ]
  return (
    <section className="py-20 md:py-28" style={{ background: CREAM }}>
      <div className="max-w-6xl mx-auto px-5">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-medium uppercase tracking-widest" style={{ color: TERRA }}>Différences</span>
            <h2 className="text-3xl md:text-5xl tracking-tight font-semibold mt-3" style={{ color: INK, fontFamily: 'var(--font-instrument), Georgia, serif' }}>
              Ce que les autres apps ne font pas.
            </h2>
          </div>
        </Reveal>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {feats.map((f, i) => {
            const Ic = f.i
            return (
              <Reveal key={f.title} delay={i * 0.05}>
                <div className="p-6 rounded-3xl bg-white border border-zinc-100 h-full">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: SAGE + '20' }}>
                    <Ic size={20} weight="duotone" color={SAGE} />
                  </div>
                  <h3 className="font-semibold mb-1.5" style={{ color: INK }}>{f.title}</h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">{f.text}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── How it works ──────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { num: '01', title: 'Vous vous inscrivez tous les deux', text: 'Créez votre couple en 30 secondes. Magic link reçu par email, pas de mot de passe à retenir.' },
    { num: '02', title: 'Vous configurez vos charges fixes', text: 'Loyer, abonnements, crédits, mutuelle : qui paye quoi, à quelle date, avec quelle répartition.' },
    { num: '03', title: 'Vous saisissez au fil de l\'eau', text: 'À la fin du mois, ONKHALASS vous dit qui doit combien. Vous cliquez "On khalass". Compteur à zéro.' },
  ]
  return (
    <section className="py-20 md:py-28" style={{ background: '#fff' }}>
      <div className="max-w-5xl mx-auto px-5">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono font-medium uppercase tracking-widest" style={{ color: TERRA }}>Démarrage</span>
            <h2 className="text-3xl md:text-5xl tracking-tight font-semibold mt-3" style={{ color: INK, fontFamily: 'var(--font-instrument), Georgia, serif' }}>
              3 étapes, pas une de plus.
            </h2>
          </div>
        </Reveal>
        <div className="relative grid md:grid-cols-3 gap-8 md:gap-6">
          <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px" style={{ background: `linear-gradient(to right, ${TERRA}40, ${SAGE}40, ${TERRA}40)` }} />
          {steps.map((s, i) => (
            <Reveal key={s.num} delay={i * 0.12}>
              <div className="relative text-center md:text-left">
                <div className="relative inline-flex md:flex w-16 h-16 rounded-full items-center justify-center font-bold text-lg mb-5" style={{ background: '#fff', border: `2px solid ${TERRA}`, color: TERRA, fontFamily: 'var(--font-geist-mono), monospace' }}>
                  {s.num}
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: INK }}>{s.title}</h3>
                <p className="text-zinc-600 leading-relaxed">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── For who ───────────────────────────────────────────────────────
function ForWho() {
  const cols = [
    { i: House, t: 'Qui emménagent ensemble', text: 'Un démarrage clair sur les charges partagées, sans tensions ni quiproquos dès le mois 1.' },
    { i: Sparkle, t: 'Qui préparent un gros projet', text: 'Mariage, achat immobilier, premier enfant : planifiez l\'épargne et alignez les efforts.' },
    { i: ShieldCheck, t: 'Qui en ont marre des dettes', text: 'Plus jamais "tu me dois quoi déjà ?". L\'historique est limpide, le solde toujours juste.' },
  ]
  return (
    <section className="py-20 md:py-28" style={{ background: CREAM }}>
      <div className="max-w-6xl mx-auto px-5">
        <Reveal>
          <h2 className="text-3xl md:text-5xl tracking-tight font-semibold text-center max-w-3xl mx-auto mb-14" style={{ color: INK, fontFamily: 'var(--font-instrument), Georgia, serif' }}>
            Pensé pour les couples qui...
          </h2>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-5 md:gap-6">
          {cols.map((c, i) => {
            const Ic = c.i
            return (
              <Reveal key={c.t} delay={i * 0.1}>
                <div className="p-6 md:p-8 rounded-3xl bg-white border border-zinc-100 h-full">
                  <Ic size={28} weight="duotone" style={{ color: TERRA }} className="mb-4" />
                  <h3 className="text-lg font-semibold mb-2" style={{ color: INK }}>{c.t}</h3>
                  <p className="text-zinc-600 leading-relaxed">{c.text}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials ──────────────────────────────────────────────────
function Testimonials() {
  const reviews = [
    { name: 'Sarah & Karim', city: 'Marseille', text: '« On a arrêté de se prendre la tête avec les comptes. La feature "on khalass" change la vie. »', avatar: { bg: TERRA, txt: 'SK' } },
    { name: 'Léa & Thomas', city: 'Lyon', text: '« Enfin une app qui comprend qu\'on a des revenus différents. Le 60/40 par défaut, c\'est cadeau. »', avatar: { bg: SAGE, txt: 'LT' } },
    { name: 'Amel & Yanis', city: 'Paris', text: '« Les charges fixes auto-ajoutées, c\'est magique. On avait l\'habitude d\'oublier la moitié. »', avatar: { bg: SAND, txt: 'AY' } },
  ]
  return (
    <section className="py-20 md:py-28" style={{ background: '#fff' }}>
      <div className="max-w-6xl mx-auto px-5">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-medium uppercase tracking-widest" style={{ color: TERRA }}>Témoignages</span>
            <h2 className="text-3xl md:text-5xl tracking-tight font-semibold mt-3" style={{ color: INK, fontFamily: 'var(--font-instrument), Georgia, serif' }}>
              Des couples qui respirent.
            </h2>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-5 md:gap-6">
          {reviews.map((r, i) => (
            <Reveal key={r.name} delay={i * 0.1}>
              <div className="p-6 md:p-7 rounded-3xl border border-zinc-100 h-full" style={{ background: CREAM }}>
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} size={14} weight="fill" style={{ color: SAND }} />)}
                </div>
                <p className="text-zinc-700 leading-relaxed mb-5">{r.text}</p>
                <div className="flex items-center gap-3 pt-4 border-t border-zinc-200/60">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-semibold" style={{ background: r.avatar.bg }}>
                    {r.avatar.txt}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: INK }}>{r.name}</p>
                    <p className="text-xs text-zinc-500">{r.city}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.3}>
          <p className="text-center mt-10 text-sm text-zinc-500">
            Bientôt rejoints par <span className="font-semibold" style={{ color: TERRA }}>274 couples</span> sur la liste d'attente.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

// ─── FAQ ───────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-zinc-200/70">
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-5 flex items-center justify-between gap-4 text-left"
      >
        <span className="font-medium text-base md:text-lg" style={{ color: INK }}>{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <CaretDown size={18} style={{ color: TERRA }} weight="bold" />
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
            <p className="text-zinc-600 leading-relaxed pb-5 pr-8 max-w-[60ch]">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Faq() {
  const qs = [
    { q: "C'est gratuit ?", a: "Oui, totalement gratuit pendant la beta. Un plan premium très abordable arrivera plus tard avec des features avancées (analyses fines, multi-comptes), mais le cœur restera gratuit pour toujours." },
    { q: "Mes données sont-elles privées ?", a: "Absolument. Vos données sont stockées en Europe, chiffrées au repos. Pas de revente, pas de pub, pas de croisement avec des tiers. Vous pouvez exporter ou supprimer votre compte à tout moment." },
    { q: "Ça marche sur iPhone et Android ?", a: "ONKHALASS est une PWA : installable depuis le navigateur sur iOS et Android comme une app native. Des apps iOS et Android natives sont prévues après la beta." },
    { q: "Faut-il que mon/ma partenaire ait un compte aussi ?", a: "Oui. Le couple comporte 2 comptes séparés mais reliés, pour que chacun voie en temps réel ce que l'autre saisit. Vous l'invitez par email en un clic depuis l'app." },
    { q: "Comment fonctionnent les charges fixes récurrentes ?", a: "Vous créez une charge (Loyer 850 € le 1er, payé par Walid, 50/50). Chaque mois, ONKHALASS l'ajoute automatiquement comme une dépense normale. Vous pouvez l'ajuster ou la mettre en pause à tout moment." },
    { q: "Que se passe-t-il si on ne solde pas la dette d'un mois ?", a: "Rien de grave. La dette se reporte sur le mois suivant avec un indicateur visuel \"Solde reporté\" en haut du dashboard. L'historique reste consultable mois par mois pour comprendre exactement comment elle s'est constituée." },
    { q: "Peut-on importer depuis Tricount ou Excel ?", a: "L'import CSV depuis Excel/Sheets sera dispo à la sortie. L'import Tricount est prévu pour la v1.1 (mi-2026)." },
    { q: "Quand l'app sera-t-elle disponible ?", a: "La beta privée ouvre fin 2026 pour les premiers inscrits de la liste d'attente. Sortie publique début 2027. Inscrivez-vous pour être prévenu en premier." },
  ]
  return (
    <section id="faq" className="py-20 md:py-28" style={{ background: CREAM }}>
      <div className="max-w-3xl mx-auto px-5">
        <Reveal>
          <div className="text-center mb-10">
            <span className="text-xs font-mono font-medium uppercase tracking-widest" style={{ color: TERRA }}>FAQ</span>
            <h2 className="text-3xl md:text-5xl tracking-tight font-semibold mt-3" style={{ color: INK, fontFamily: 'var(--font-instrument), Georgia, serif' }}>
              Les questions qui reviennent.
            </h2>
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <div className="rounded-3xl bg-white border border-zinc-100 px-5 md:px-7">
            {qs.map(item => <FaqItem key={item.q} {...item} />)}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ─── CTA + waitlist ────────────────────────────────────────────────
function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email invalide')
      setState('error')
      return
    }
    setState('loading')
    setError('')
    try {
      const r = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!r.ok) throw new Error('fail')
      setState('success')
    } catch {
      setError('Erreur. Réessaie dans un instant.')
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl bg-white p-8 md:p-10 border border-zinc-100 shadow-xl max-w-xl mx-auto text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: SAGE + '20' }}>
          <CheckCircle size={30} weight="fill" style={{ color: SAGE }} />
        </div>
        <h3 className="text-2xl font-semibold mb-2" style={{ color: INK, fontFamily: 'var(--font-instrument), Georgia, serif' }}>
          On khalass ! Tu es sur la liste.
        </h3>
        <p className="text-zinc-600 mb-5 leading-relaxed">
          On t'écrit dès que ta place beta est prête. En attendant, fais découvrir ONKHALASS à un couple qui en a besoin.
        </p>
        <div className="flex gap-2 justify-center text-sm">
          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("Je viens de rejoindre la liste d'attente d'ONKHALASS, l'app pour gérer le budget du couple sans prise de tête. ")}&url=${encodeURIComponent('https://onkhalass.netlify.app')}`} target="_blank" rel="noopener" className="px-4 py-2 rounded-full border-2 text-xs font-medium hover:-translate-y-0.5 transition-transform" style={{ borderColor: INK + '20', color: INK }}>
            Partager sur X
          </a>
          <button onClick={() => { navigator.clipboard.writeText('https://onkhalass.netlify.app'); }} className="px-4 py-2 rounded-full text-xs font-medium text-white hover:-translate-y-0.5 transition-transform" style={{ background: TERRA }}>
            Copier le lien
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-3xl bg-white p-6 md:p-8 border border-zinc-100 shadow-xl max-w-xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <EnvelopeSimple size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="email"
            placeholder="vous@email.fr"
            value={email}
            onChange={e => { setEmail(e.target.value); if (state === 'error') setState('idle') }}
            required
            className="w-full h-12 pl-11 pr-4 rounded-full border-2 outline-none transition-colors focus:border-[color:var(--tw-ring-color)]"
            style={{ borderColor: INK + '15', color: INK, ['--tw-ring-color' as string]: TERRA } as React.CSSProperties}
            aria-label="Adresse email"
          />
        </div>
        <button
          type="submit"
          disabled={state === 'loading'}
          className="h-12 px-6 rounded-full text-white font-semibold transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 whitespace-nowrap"
          style={{ background: TERRA, boxShadow: `0 8px 20px -8px ${TERRA}80` }}
        >
          {state === 'loading' ? 'Envoi…' : 'Je m\'inscris'}
          {state !== 'loading' && <ArrowRight size={16} weight="bold" />}
        </button>
      </div>
      {error && <p className="text-sm text-red-500 px-2">{error}</p>}
      <p className="text-xs text-zinc-500 text-center">Pas de spam. Une seule notif : quand ta place est prête.</p>
    </form>
  )
}

function FinalCTA() {
  return (
    <section id="cta" className="py-20 md:py-32 relative overflow-hidden" style={{ background: INK }}>
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 30%, ${TERRA}, transparent 50%), radial-gradient(circle at 70% 70%, ${SAGE}, transparent 50%)`,
        }}
      />
      <div className="relative max-w-3xl mx-auto px-5 text-center space-y-7">
        <Reveal>
          <Sparkle size={32} weight="fill" style={{ color: SAND }} className="mx-auto" />
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="text-3xl md:text-5xl tracking-tight font-semibold leading-tight text-white" style={{ fontFamily: 'var(--font-instrument), Georgia, serif' }}>
            Prêts à dire <em className="italic font-normal" style={{ color: SAND }}>« on khalass »</em><br />à la fin de chaque mois ?
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-lg text-white/70 max-w-xl mx-auto leading-relaxed">
            Créez votre compte et commencez à gérer votre budget à deux.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <Link href="/login" className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full text-white font-semibold shadow-lg transition-transform hover:-translate-y-0.5 active:scale-[0.98]" style={{ background: TERRA, boxShadow: `0 10px 30px -10px ${TERRA}80` }}>
            Se connecter
            <ArrowRight size={16} weight="bold" />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

// ─── Footer ────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="py-12 md:py-16" style={{ background: CREAM }}>
      <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-12 gap-10">
        <div className="md:col-span-5 space-y-4">
          <Logo size="md" />
          <p className="text-sm text-zinc-600 leading-relaxed max-w-sm">
            « <em>Khalass</em> », en arabe dialectal, signifie « <em>fini, réglé, on en parle plus</em> ». ONKHALASS, c'est l'app qui met enfin tout à plat dans le budget du couple, pour qu'à la fin du mois, on puisse dire « on khalass » et passer à autre chose.
          </p>
        </div>
        <div className="md:col-span-2">
          <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3">Produit</h4>
          <ul className="space-y-2 text-sm text-zinc-700">
            <li><a href="#solution" className="hover:opacity-70">Fonctionnalités</a></li>
            <li><a href="#demo" className="hover:opacity-70">Démo</a></li>
            <li><a href="#faq" className="hover:opacity-70">FAQ</a></li>
          </ul>
        </div>
        <div className="md:col-span-2">
          <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3">Légal</h4>
          <ul className="space-y-2 text-sm text-zinc-700">
            <li><Link href="/legal/privacy" className="hover:opacity-70">Confidentialité</Link></li>
            <li><Link href="/legal/terms" className="hover:opacity-70">CGU</Link></li>
            <li><a href="mailto:hello@onkhalass.app" className="hover:opacity-70">Contact</a></li>
          </ul>
        </div>
        <div className="md:col-span-3">
          <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3">Suivre</h4>
          <div className="flex gap-2 text-sm">
            <a href="#" className="px-3 py-1.5 rounded-full border border-zinc-200 hover:bg-zinc-50">Instagram</a>
            <a href="#" className="px-3 py-1.5 rounded-full border border-zinc-200 hover:bg-zinc-50">X</a>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-5 mt-10 pt-6 border-t border-zinc-200/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
        <p>© 2026 ONKHALASS · Tous droits réservés</p>
        <p className="flex items-center gap-1.5">Made with <Heart size={11} weight="fill" style={{ color: TERRA }} /> in France</p>
      </div>
    </footer>
  )
}

// ─── Main ──────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{ background: CREAM, color: INK }}>
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <Demo />
        <Differentiators />
        <HowItWorks />
        <ForWho />
        <Testimonials />
        <Faq />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
