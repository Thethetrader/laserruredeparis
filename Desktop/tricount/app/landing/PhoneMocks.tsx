'use client'

import { motion } from 'framer-motion'
import { House, CurrencyEur, ClockCounterClockwise, PiggyBank, TrendUp, Plus, Heart, Gear, ForkKnife, ShoppingCart, FilmSlate, House as HouseIcon, MusicNotes, Lightning, Car, ShieldCheck, ArrowsLeftRight, CaretLeft, CaretRight, Sailboat } from '@phosphor-icons/react'

const TERRA = '#e07a5f'
const SAGE = '#81b29a'
const SAND = '#f2cc8f'
const CREAM = '#faf4ed'
const INK = '#2d2a26'

function PhoneFrame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative mx-auto w-[290px] aspect-[9/19] rounded-[40px] p-3 shadow-[0_30px_80px_-20px_rgba(45,42,38,0.35),0_15px_30px_-10px_rgba(224,122,95,0.25)] ${className}`}
      style={{ background: `linear-gradient(150deg, #2d2a26 0%, #1a1816 100%)` }}
    >
      <div className="relative w-full h-full rounded-[30px] overflow-hidden" style={{ background: CREAM }}>
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-20 w-[80px] h-[20px] rounded-full bg-black/90" />
        {children}
      </div>
    </div>
  )
}

function BottomNav({ active = 0 }: { active?: number }) {
  const items = [
    { i: House, label: 'Accueil' },
    { i: CurrencyEur, label: 'Dépenses' },
    { i: ClockCounterClockwise, label: 'Historique' },
    { i: PiggyBank, label: 'Épargne' },
    { i: TrendUp, label: 'Tendances' },
  ]
  return (
    <div className="absolute bottom-0 inset-x-0 flex items-center justify-around px-1 pt-1 pb-1.5 border-t border-zinc-200/60 bg-white/95 backdrop-blur">
      {items.map((it, i) => {
        const Ic = it.i
        const isActive = i === active
        return (
          <div key={it.label} className="flex flex-col items-center gap-0.5">
            <Ic size={14} weight={isActive ? 'fill' : 'regular'} color={isActive ? TERRA : '#a1a1aa'} />
            <span className="text-[6px]" style={{ color: isActive ? TERRA : '#a1a1aa' }}>{it.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function MemberDot({ name, color }: { name: string; color: string }) {
  return (
    <div
      className="w-6 h-6 rounded-[8px] flex items-center justify-center text-[9px] font-mono font-semibold flex-shrink-0 ring-2 ring-white/90"
      style={{ backgroundColor: color + '22', color, border: `1.5px solid ${color}40` }}
    >
      {name[0]}
    </div>
  )
}

export function DashboardMock() {
  return (
    <PhoneFrame>
      <div className="pt-7 pb-12 px-0 flex flex-col gap-2.5 h-full overflow-hidden">
        {/* Banner */}
        <div className="relative h-[72px] overflow-hidden" style={{ background: `linear-gradient(135deg, ${TERRA} 0%, ${SAND} 50%, ${SAGE} 100%)` }}>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
          <div className="absolute top-2 right-2 p-1 rounded-lg bg-black/20">
            <Gear size={9} color="white" weight="bold" />
          </div>
          <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-lg bg-white/95 flex items-center justify-center">
                <Heart size={10} weight="fill" color={TERRA} />
              </div>
              <span className="text-white text-[11px] font-semibold drop-shadow-sm">Walid & Farah</span>
            </div>
            <div className="flex -space-x-1">
              <MemberDot name="T" color={TERRA} />
              <MemberDot name="M" color={SAGE} />
            </div>
          </div>
        </div>

        {/* Month picker */}
        <div className="flex items-center justify-center gap-3 px-3">
          <CaretLeft size={10} color={INK} weight="bold" />
          <span className="text-[10px] font-medium" style={{ color: INK }}>Mai 2026</span>
          <CaretRight size={10} color={INK} weight="bold" />
        </div>

        {/* Solde reporté */}
        <div className="mx-3 rounded-xl px-2 py-1.5 flex items-center justify-between" style={{ background: SAGE + '15', border: `1px solid ${SAGE}40` }}>
          <div className="flex flex-col">
            <span className="text-[6px] uppercase tracking-wider font-semibold text-zinc-400">Solde reporté</span>
            <span className="text-[8px] text-zinc-600">Farah te doit</span>
          </div>
          <span className="font-mono text-[9px] font-semibold" style={{ color: SAGE }}>1 865,35 €</span>
        </div>

        {/* 4 KPI tiles */}
        <div className="grid grid-cols-2 gap-1.5 mx-3">
          {[
            { label: 'Dépensé', value: '1 395 €', sub: '/ 2 200 €', color: TERRA },
            { label: 'Restant', value: '805 €', sub: 'disponible', color: SAGE },
            { label: 'Solde équité', value: '548 €', sub: 'à recevoir', color: '#f97316' },
            { label: 'Épargné', value: '650 €', sub: 'ce mois', color: '#2a9d8f' },
          ].map((t, i) => (
            <motion.div
              key={t.label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl p-1.5 border border-zinc-200/60"
            >
              <p className="text-[6px] text-zinc-400 mb-0.5">{t.label}</p>
              <p className="font-mono text-[9px] font-semibold" style={{ color: t.color }}>{t.value}</p>
              <p className="text-[6px] text-zinc-400 mt-0.5">{t.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Qui a dépensé */}
        <div className="mx-3 space-y-1">
          <p className="text-[6px] uppercase tracking-wider font-semibold text-zinc-400">Qui a dépensé ce mois</p>
          {[
            { name: 'Walid', color: TERRA, pct: 63 },
            { name: 'Farah', color: SAGE, pct: 37 },
          ].map((m, i) => (
            <div key={m.name} className="space-y-0.5">
              <div className="flex items-center justify-between text-[7px]">
                <div className="flex items-center gap-1">
                  <MemberDot name={m.name[0]} color={m.color} />
                  <span style={{ color: INK }}>{m.name}</span>
                </div>
                <span className="font-mono text-zinc-500">{m.pct}%</span>
              </div>
              <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${m.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: i * 0.1 }}
                  className="h-full rounded-full"
                  style={{ background: m.color }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Par catégorie */}
        <div className="mx-3 space-y-1">
          <p className="text-[6px] uppercase tracking-wider font-semibold text-zinc-400">Par catégorie</p>
          {[
            { name: 'Alimentation', spent: 172, budget: 500, color: '#4CAF50' },
            { name: 'Logement', spent: 850, budget: 900, color: '#2196F3' },
            { name: 'Transport', spent: 72, budget: 150, color: '#FF9800' },
          ].map((c, i) => (
            <div key={c.name} className="space-y-0.5">
              <div className="flex items-center justify-between text-[7px]">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <span className="text-zinc-700">{c.name}</span>
                </div>
                <span className="font-mono text-zinc-500">{c.spent} / {c.budget} €</span>
              </div>
              <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(c.spent / c.budget) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className="h-full rounded-full"
                  style={{ background: c.color }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* FAB */}
        <div className="absolute bottom-10 right-3 w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: TERRA }}>
          <Plus size={16} weight="bold" color="white" />
        </div>
      </div>
      <BottomNav active={0} />
    </PhoneFrame>
  )
}

export function AddExpenseMock() {
  return (
    <PhoneFrame>
      <div className="pt-7 pb-3 px-3 h-full flex flex-col">
        <div className="text-center mb-2">
          <span className="text-[11px] font-semibold" style={{ color: INK }}>Nouvelle dépense</span>
        </div>
        <div className="rounded-2xl bg-white border border-zinc-200/60 p-3 space-y-3 flex-1">
          <div>
            <p className="text-[7px] uppercase tracking-wider text-zinc-400 mb-1">Montant</p>
            <p className="text-2xl font-semibold font-mono" style={{ color: TERRA }}>42,80 €</p>
          </div>
          <div className="border-t border-zinc-100" />
          <div>
            <p className="text-[7px] uppercase tracking-wider text-zinc-400 mb-1.5">Catégorie</p>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { i: ShoppingCart, label: 'Courses', active: true },
                { i: ForkKnife, label: 'Resto' },
                { i: Car, label: 'Trans.' },
                { i: FilmSlate, label: 'Loisirs' },
              ].map(({ i: Ic, label, active }) => (
                <div key={label} className={`px-2 py-1 rounded-lg flex items-center gap-1 text-[8px] ${active ? 'text-white' : 'text-zinc-600 bg-zinc-50'}`} style={active ? { background: TERRA } : undefined}>
                  <Ic size={9} weight={active ? 'fill' : 'regular'} />
                  {label}
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-zinc-100" />
          <div>
            <p className="text-[7px] uppercase tracking-wider text-zinc-400 mb-1.5">Payé par</p>
            <div className="flex gap-2">
              <div className="flex-1 rounded-lg py-1.5 flex items-center justify-center gap-1 text-[8px] font-medium text-white" style={{ background: TERRA }}>
                <MemberDot name="W" color="#fff" />
                Walid
              </div>
              <div className="flex-1 rounded-lg py-1.5 flex items-center justify-center gap-1 text-[8px] text-zinc-500 bg-zinc-50">
                <MemberDot name="F" color={SAGE} />
                Farah
              </div>
            </div>
          </div>
          <div className="border-t border-zinc-100" />
          <div>
            <p className="text-[7px] uppercase tracking-wider text-zinc-400 mb-1.5">Partage</p>
            <div className="flex items-center gap-1 text-[8px]">
              <span className="font-medium" style={{ color: INK }}>50%</span>
              <div className="flex-1 h-1 bg-zinc-100 rounded-full relative">
                <div className="absolute inset-y-0 left-0 w-1/2 rounded-full" style={{ background: TERRA }} />
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white ring-2" style={{ '--tw-ring-color': TERRA } as React.CSSProperties} />
              </div>
              <span className="font-medium" style={{ color: INK }}>50%</span>
            </div>
          </div>
        </div>
        <button className="mt-3 w-full h-9 rounded-xl text-white text-[10px] font-semibold" style={{ background: TERRA }}>
          Ajouter
        </button>
      </div>
    </PhoneFrame>
  )
}

export function RecurringMock() {
  const items = [
    { i: HouseIcon, name: 'Loyer', amount: '850 €', who: 'T', day: '1' },
    { i: Lightning, name: 'EDF', amount: '68 €', who: 'M', day: '5' },
    { i: FilmSlate, name: 'Netflix', amount: '17,99 €', who: 'T', day: '2' },
    { i: MusicNotes, name: 'Spotify', amount: '9,99 €', who: 'M', day: '2' },
    { i: ShieldCheck, name: 'Assurance habit.', amount: '28,50 €', who: 'T', day: '5' },
  ]
  return (
    <PhoneFrame>
      <div className="pt-7 pb-3 px-3 h-full flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] font-semibold" style={{ color: INK }}>Charges fixes</span>
          <span className="text-[9px] font-mono text-zinc-500">974,48 €/mois</span>
        </div>
        <div className="rounded-2xl bg-white border border-zinc-200/60 p-2 space-y-1">
          {items.map((it, i) => {
            const Ic = it.i
            return (
              <motion.div
                key={it.name}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-2 py-1.5 px-1 border-b border-zinc-50 last:border-b-0"
              >
                <div className="w-6 h-6 rounded-[8px] flex items-center justify-center" style={{ background: TERRA + '15' }}>
                  <Ic size={11} weight="fill" color={TERRA} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-medium" style={{ color: INK }}>{it.name}</p>
                  <p className="text-[7px] text-zinc-400">le {it.day} du mois</p>
                </div>
                <MemberDot name={it.who} color={it.who === 'T' ? TERRA : SAGE} />
                <span className="text-[9px] font-mono font-semibold" style={{ color: INK }}>{it.amount}</span>
              </motion.div>
            )
          })}
        </div>
        <div className="rounded-xl px-2 py-1.5" style={{ background: SAGE + '15', border: `1px solid ${SAGE}40` }}>
          <p className="text-[7px] text-center" style={{ color: SAGE }}>Auto-ajoutées chaque 1er du mois</p>
        </div>
      </div>
    </PhoneFrame>
  )
}

export function DebtMock() {
  const months = [
    { m: 'Jan', d: 412 },
    { m: 'Fév', d: 290 },
    { m: 'Mar', d: 540 },
    { m: 'Avr', d: 380 },
    { m: 'Mai', d: 554, cur: true },
  ]
  const total = 1865
  return (
    <PhoneFrame>
      <div className="pt-7 pb-3 px-3 h-full flex flex-col gap-2">
        <div className="text-center">
          <p className="text-[7px] uppercase tracking-wider text-zinc-400">Solde cumulé</p>
          <p className="text-2xl font-semibold font-mono" style={{ color: TERRA }}>{total.toLocaleString('fr-FR')} €</p>
          <p className="text-[8px] text-zinc-500">Farah doit à Walid</p>
        </div>

        <div className="rounded-2xl bg-white border border-zinc-200/60 p-2.5 space-y-2">
          <p className="text-[7px] uppercase tracking-wider text-zinc-400">Historique mensuel</p>
          <div className="flex items-end gap-1.5 h-16">
            {months.map((m, i) => (
              <motion.div
                key={m.m}
                initial={{ height: 0 }}
                whileInView={{ height: `${(m.d / 600) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 rounded-t-md"
                style={{ background: m.cur ? TERRA : TERRA + '50' }}
              />
            ))}
          </div>
          <div className="flex justify-between">
            {months.map(m => (
              <span key={m.m} className="text-[7px] text-zinc-400 flex-1 text-center">{m.m}</span>
            ))}
          </div>
        </div>

        <button className="mt-auto w-full h-11 rounded-2xl text-white text-[11px] font-semibold flex items-center justify-center gap-2 shadow-lg" style={{ background: TERRA, boxShadow: `0 10px 25px -10px ${TERRA}80` }}>
          <ArrowsLeftRight size={14} weight="bold" />
          On khalass !
        </button>
        <p className="text-center text-[7px] text-zinc-400">Solde le tout et archive le règlement</p>
      </div>
    </PhoneFrame>
  )
}

export function SavingsMock() {
  const pots = [
    { i: Sailboat, name: 'Vacances Bretagne', current: 600, color: SAGE },
    { i: Car, name: 'Nouvelle voiture', current: 400, color: SAND },
    { i: ShieldCheck, name: "Fond d'urgence", current: 650, color: TERRA },
  ]
  const total = pots.reduce((a, p) => a + p.current, 0)

  const points = [300, 500, 700, 900, 1100, 1400, 1650]
  const max = 1800
  const w = 220
  const h = 60
  const pts = points.map((v, i) => `${(i / (points.length - 1)) * w},${h - (v / max) * h}`).join(' ')

  return (
    <PhoneFrame>
      <div className="pt-7 pb-12 px-3 flex flex-col gap-3 h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold" style={{ color: INK }}>Épargne</span>
          <div className="flex gap-1">
            <div className="px-2 py-1 rounded-lg text-[7px] font-medium text-zinc-600 bg-zinc-100">+ Transaction</div>
            <div className="px-2 py-1 rounded-lg text-[7px] font-medium text-white" style={{ background: TERRA }}>+ Pot</div>
          </div>
        </div>

        {/* Total */}
        <div className="rounded-2xl bg-white border border-zinc-200/60 p-3 text-center">
          <p className="text-[7px] uppercase tracking-wider text-zinc-400 mb-1">Épargne totale</p>
          <p className="text-2xl font-semibold font-mono" style={{ color: INK }}>{total.toLocaleString('fr-FR')},00 €</p>
        </div>

        {/* Graph */}
        <div className="rounded-2xl bg-white border border-zinc-200/60 p-2.5">
          <p className="text-[7px] uppercase tracking-wider text-zinc-400 mb-2">Évolution</p>
          <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
            <defs>
              <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SAGE} stopOpacity="0.3" />
                <stop offset="100%" stopColor={SAGE} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#sg)" />
            <polyline points={pts} fill="none" stroke={SAGE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Pots list */}
        <div className="space-y-1">
          <p className="text-[7px] uppercase tracking-wider font-semibold text-zinc-400">Pots</p>
          {pots.map((p, i) => {
            const Ic = p.i
            return (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, x: -6 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                  <span className="text-[9px] font-medium" style={{ color: INK }}>{p.name}</span>
                </div>
                <span className="font-mono text-[9px] font-semibold text-zinc-700">{p.current.toLocaleString('fr-FR')},00 €</span>
              </motion.div>
            )
          })}
        </div>
      </div>
      <BottomNav active={3} />
    </PhoneFrame>
  )
}
