'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { formatMonth } from '@/lib/utils/format'
import { parseISO, addMonths, subMonths, format } from 'date-fns'

interface MonthPickerProps {
  value: string // 'YYYY-MM'
  onChange: (month: string) => void
}

export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const date = parseISO(value + '-01')

  function prev() {
    onChange(format(subMonths(date, 1), 'yyyy-MM'))
  }

  function next() {
    const next = addMonths(date, 1)
    if (next > new Date()) return
    onChange(format(next, 'yyyy-MM'))
  }

  const isCurrentMonth = format(new Date(), 'yyyy-MM') === value

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={prev}
        className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors active:scale-95"
        aria-label="Mois précédent"
      >
        <CaretLeft size={16} weight="bold" className="text-zinc-500" />
      </button>

      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 min-w-[120px] text-center capitalize"
        >
          {formatMonth(date)}
        </motion.span>
      </AnimatePresence>

      <button
        onClick={next}
        disabled={isCurrentMonth}
        className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Mois suivant"
      >
        <CaretRight size={16} weight="bold" className="text-zinc-500" />
      </button>
    </div>
  )
}
