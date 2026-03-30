'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import MonthNav from '@/components/month-nav'
import { formatCurrency, formatMonthLabel, getMonthRange } from '@/lib/utils'
import type { Transaction, Category, UserProfile } from '@/types/database'

interface CalendarViewProps {
  transactions: Transaction[]
  categories: Category[]
  members: UserProfile[]
  monthKey: string
}

const WEEK_LABELS = ['月', '火', '水', '木', '金', '土', '日']

export default function CalendarView({ transactions, categories, members, monthKey }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const getCategoryById = (id: string | null) => categories.find((c) => c.id === id)
  const getMemberById = (id: string | null) => members.find((m) => m.id === id)

  // Group transactions by date
  const txByDate = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = []
    acc[tx.date].push(tx)
    return acc
  }, {})

  // Build calendar grid (Mon-start)
  const { start } = getMonthRange(monthKey)
  const [year, month] = monthKey.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDow = new Date(start).getDay() // 0=Sun
  const startOffset = (firstDow + 6) % 7    // Mon=0

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  const toDateStr = (day: number) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const today = new Date().toISOString().split('T')[0]

  const selectedTx = selectedDate ? (txByDate[selectedDate] ?? []) : []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[390px] items-center justify-between px-4 py-3">
          <h1 className="text-base font-semibold">カレンダー</h1>
          <MonthNav monthKey={monthKey} basePath="/calendar" />
        </div>
      </header>

      <main className="mx-auto max-w-[390px] px-3 py-4 pb-24">
        {/* Month label */}
        <p className="mb-3 text-center text-sm font-medium text-muted-foreground">
          {formatMonthLabel(monthKey)}
        </p>

        {/* Week header */}
        <div className="mb-1 grid grid-cols-7">
          {WEEK_LABELS.map((d, i) => (
            <div
              key={d}
              className={`py-1 text-center text-xs font-medium ${
                i === 5 ? 'text-blue-500' : i === 6 ? 'text-red-500' : 'text-muted-foreground'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />

            const dateStr = toDateStr(day)
            const dayTx = txByDate[dateStr] ?? []
            const isToday = dateStr === today
            const isSelected = dateStr === selectedDate
            const dow = (startOffset + day - 1) % 7 // 0=Mon

            // Build dots: max 3
            const expenses = dayTx.filter((t) => t.type === 'expense')
            const income = dayTx.filter((t) => t.type === 'income')
            const dots: { color: string; key: string }[] = []

            const seenCats = new Set<string>()
            for (const tx of expenses) {
              if (dots.length >= 3) break
              const catKey = tx.category_id ?? '__none'
              if (seenCats.has(catKey)) continue
              seenCats.add(catKey)
              const cat = getCategoryById(tx.category_id)
              dots.push({
                color: tx.is_recurring ? '#9ca3af' : (cat?.color ?? '#ef4444'),
                key: tx.id,
              })
            }
            if (income.length > 0 && dots.length < 3) {
              dots.push({ color: '#22c55e', key: 'income' })
            }

            const total = expenses.reduce((s, t) => s + t.amount, 0)

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`flex flex-col items-center rounded-xl py-1.5 transition-colors ${
                  isSelected
                    ? 'bg-primary/10'
                    : 'hover:bg-muted/60'
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                    isToday
                      ? 'bg-primary text-white'
                      : isSelected
                      ? 'text-primary font-semibold'
                      : dow === 5
                      ? 'text-blue-500'
                      : dow === 6
                      ? 'text-red-500'
                      : 'text-foreground'
                  }`}
                >
                  {day}
                </span>

                {/* Dots */}
                <div className="mt-0.5 flex gap-0.5 h-2 items-center">
                  {dots.map((dot) => (
                    <span
                      key={dot.key}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: dot.color }}
                    />
                  ))}
                </div>

                {/* Amount */}
                {total > 0 && (
                  <span className="mt-0.5 text-[9px] text-muted-foreground leading-none">
                    {total >= 10000
                      ? `${Math.round(total / 1000)}k`
                      : total >= 1000
                      ? `${(total / 1000).toFixed(1)}k`
                      : total}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 justify-center">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            <span className="text-xs text-muted-foreground">支出</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">収入</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-gray-400" />
            <span className="text-xs text-muted-foreground">固定費</span>
          </div>
        </div>
      </main>

      {/* Day detail popup */}
      {selectedDate && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSelectedDate(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[390px] rounded-t-2xl bg-white shadow-xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <div>
                <p className="text-base font-semibold">
                  {selectedDate.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1年$2月$3日')}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedTx.length > 0 ? `${selectedTx.length}件の取引` : '取引なし'}
                </p>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto px-5 py-3 pb-8 space-y-2">
              {selectedTx.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">この日の取引はありません</p>
              ) : (
                selectedTx.map((tx) => {
                  const cat = getCategoryById(tx.category_id)
                  const member = getMemberById(tx.user_id)
                  return (
                    <div key={tx.id} className="flex items-center gap-3 rounded-xl border border-border/50 bg-background p-3">
                      <div
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-base"
                        style={{ backgroundColor: tx.is_recurring ? '#f3f4f6' : (cat?.color ?? '#f9fafb') }}
                      >
                        {cat?.icon ?? '💰'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tx.description ?? cat?.name ?? '取引'}</p>
                        <p className="text-xs text-muted-foreground">
                          {member?.display_name}
                          {tx.is_recurring && <span className="ml-1 text-gray-400">固定</span>}
                          {tx.is_shared && <span className="ml-1 text-primary/60">共有</span>}
                        </p>
                      </div>
                      <p className={`text-sm font-semibold flex-shrink-0 ${tx.type === 'income' ? 'text-green-600' : ''}`}>
                        {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
