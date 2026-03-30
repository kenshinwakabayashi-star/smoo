'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatMonthLabel, getPrevMonth, getNextMonth, getCurrentMonthKey } from '@/lib/utils'

interface MonthNavProps {
  monthKey: string
  basePath?: string
}

export default function MonthNav({ monthKey, basePath = '' }: MonthNavProps) {
  const router = useRouter()
  const currentMonth = getCurrentMonthKey()
  const isCurrentMonth = monthKey === currentMonth

  const navigate = (key: string) => {
    router.push(`${basePath}?month=${key}`)
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => navigate(getPrevMonth(monthKey))}
        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-accent transition-colors"
        aria-label="前の月"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm font-semibold min-w-[80px] text-center">
        {formatMonthLabel(monthKey)}
      </span>
      <button
        onClick={() => navigate(getNextMonth(monthKey))}
        disabled={isCurrentMonth}
        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="次の月"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
