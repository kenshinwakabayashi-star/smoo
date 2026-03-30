'use client'

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Legend,
} from 'recharts'
import MonthNav from '@/components/month-nav'
import { formatCurrency, formatMonthLabel, getMonthRange } from '@/lib/utils'
import type { Transaction, Category, UserProfile } from '@/types/database'

interface ReportsViewProps {
  transactions: Transaction[]
  categories: Category[]
  members: UserProfile[]
  monthKey: string
  months: string[]  // 6 months array oldest→newest
}

export default function ReportsView({ transactions, categories, members, monthKey, months }: ReportsViewProps) {
  const getCategoryById = (id: string | null) => categories.find((c) => c.id === id)

  const txInMonth = (mk: string) => {
    const { start, end } = getMonthRange(mk)
    return transactions.filter((t) => t.date >= start && t.date <= end)
  }

  const currentTx = txInMonth(monthKey)
  const prevMonthKey = months[months.length - 2]
  const prevTx = txInMonth(prevMonthKey)

  // --- Pie: current month expenses by category ---
  const catExpenseMap: Record<string, number> = {}
  currentTx.filter((t) => t.type === 'expense').forEach((t) => {
    const key = t.category_id ?? '__none'
    catExpenseMap[key] = (catExpenseMap[key] ?? 0) + t.amount
  })
  const pieData = Object.entries(catExpenseMap)
    .map(([catId, value]) => {
      const cat = getCategoryById(catId === '__none' ? null : catId)
      return { name: cat ? `${cat.icon} ${cat.name}` : 'その他', value, color: cat?.color ?? '#9ca3af' }
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  const totalExpense = currentTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  // --- Bar: current vs prev month by category ---
  const topCats = pieData.slice(0, 5)
  const barData = topCats.map(({ name, color }) => {
    const catId = categories.find((c) => `${c.icon} ${c.name}` === name)?.id ?? null
    const curr = currentTx.filter((t) => t.type === 'expense' && t.category_id === catId).reduce((s, t) => s + t.amount, 0)
    const prev = prevTx.filter((t) => t.type === 'expense' && t.category_id === catId).reduce((s, t) => s + t.amount, 0)
    return { name: name.split(' ')[0], curr, prev, color }
  })

  // --- Line: 6-month expense trend ---
  const lineData = months.map((mk) => {
    const tx = txInMonth(mk)
    const expense = tx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const income = tx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const [, m] = mk.split('-')
    return { month: `${Number(m)}月`, expense, income }
  })

  // --- Gauge: payment burden (shared expenses) ---
  const sharedTx = currentTx.filter((t) => t.type === 'expense' && t.is_shared)
  const totalShared = sharedTx.reduce((s, t) => s + t.amount, 0)
  const memberPayments = members.map((m) => ({
    ...m,
    paid: sharedTx.filter((t) => t.user_id === m.id).reduce((s, t) => s + t.amount, 0),
  }))

  const CHART_HEIGHT = 200

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[390px] items-center justify-between px-4 py-3">
          <h1 className="text-base font-semibold">レポート</h1>
          <MonthNav monthKey={monthKey} basePath="/reports" />
        </div>
      </header>

      <main className="mx-auto max-w-[390px] space-y-4 px-4 py-4 pb-24">

        {/* Pie chart */}
        <div className="rounded-2xl border border-border/50 bg-white p-4">
          <p className="mb-1 text-sm font-semibold">カテゴリ別支出</p>
          <p className="mb-3 text-xs text-muted-foreground">{formatMonthLabel(monthKey)} 合計 {formatCurrency(totalExpense)}</p>
          {pieData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">データなし</p>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-40 flex-shrink-0">
                <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5 min-w-0">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="flex-1 truncate text-xs">{d.name}</span>
                    <span className="flex-shrink-0 text-xs font-medium">{Math.round((d.value / totalExpense) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bar chart: current vs prev */}
        <div className="rounded-2xl border border-border/50 bg-white p-4">
          <p className="mb-1 text-sm font-semibold">前月比</p>
          <p className="mb-3 text-xs text-muted-foreground">カテゴリ別 今月 vs 先月</p>
          {barData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">データなし</p>
          ) : (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <BarChart data={barData} barGap={2} barCategoryGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={40}
                  tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="curr" name="今月" fill="#1a5c3a" radius={[3, 3, 0, 0]} />
                <Bar dataKey="prev" name="先月" fill="#c2dccb" radius={[3, 3, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Line chart: 6-month trend */}
        <div className="rounded-2xl border border-border/50 bg-white p-4">
          <p className="mb-1 text-sm font-semibold">6ヶ月推移</p>
          <p className="mb-3 text-xs text-muted-foreground">月次支出・収入の推移</p>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={40}
                tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Line type="monotone" dataKey="expense" name="支出" stroke="#1a5c3a" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="income" name="収入" stroke="#5dcaa5" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gauge: payment burden */}
        <div className="rounded-2xl border border-border/50 bg-white p-4">
          <p className="mb-1 text-sm font-semibold">支払い負担割合</p>
          <p className="mb-3 text-xs text-muted-foreground">
            共有支出 {formatCurrency(totalShared)}
          </p>
          {totalShared === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">共有支出がありません</p>
          ) : (
            <div className="space-y-3">
              {memberPayments.map((m, i) => {
                const pct = totalShared > 0 ? Math.round((m.paid / totalShared) * 100) : 0
                const colors = ['#1a5c3a', '#5dcaa5']
                return (
                  <div key={m.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{m.display_name}</span>
                      <span className="text-sm font-semibold" style={{ color: colors[i % 2] }}>
                        {formatCurrency(m.paid)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: colors[i % 2] }}
                      />
                    </div>
                  </div>
                )
              })}
              {/* Arc gauge visualization */}
              {members.length === 2 && (
                <div className="mt-4 flex justify-center">
                  <svg width="200" height="110" viewBox="0 0 200 110">
                    {/* Background arc */}
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#e5e7eb" strokeWidth="16" strokeLinecap="round" />
                    {/* Member 0 arc */}
                    {(() => {
                      const pct0 = totalShared > 0 ? memberPayments[0].paid / totalShared : 0
                      const angle = Math.PI * pct0
                      const x = 100 - 80 * Math.cos(angle)
                      const y = 100 - 80 * Math.sin(angle)
                      const largeArc = pct0 > 0.5 ? 1 : 0
                      return (
                        <path
                          d={`M 20 100 A 80 80 0 ${largeArc} 1 ${x.toFixed(1)} ${y.toFixed(1)}`}
                          fill="none" stroke="#1a5c3a" strokeWidth="16" strokeLinecap="round"
                        />
                      )
                    })()}
                    {/* Labels */}
                    <text x="20" y="108" textAnchor="middle" fontSize="10" fill="#6b7280">{memberPayments[0]?.display_name}</text>
                    <text x="180" y="108" textAnchor="middle" fontSize="10" fill="#6b7280">{memberPayments[1]?.display_name}</text>
                  </svg>
                </div>
              )}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
