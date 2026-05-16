'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  House,
  CurrencyEur,
  ChartBar,
  PiggyBank,
  ClockCounterClockwise,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', icon: House, label: 'Accueil' },
  { href: '/expenses', icon: CurrencyEur, label: 'Dépenses' },
  { href: '/budget', icon: ChartBar, label: 'Budget' },
  { href: '/savings', icon: PiggyBank, label: 'Épargne' },
  { href: '/history', icon: ClockCounterClockwise, label: 'Historique' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-200/50 dark:border-zinc-800/50 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-colors',
                active
                  ? 'text-zinc-900 dark:text-zinc-50'
                  : 'text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400'
              )}
              aria-label={label}
            >
              <Icon
                size={22}
                weight={active ? 'fill' : 'regular'}
              />
              <span className={cn('text-[10px] font-medium', active ? 'opacity-100' : 'opacity-70')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
