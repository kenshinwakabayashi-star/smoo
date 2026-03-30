'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import MonthNav from '@/components/month-nav'
import TransactionModal from '@/components/transaction-modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Household, UserProfile, Category, Transaction, Budget } from '@/types/database'
import {
  Copy, Check, LogOut, Users, TrendingDown, TrendingUp,
  AlertTriangle, Plus, ArrowRight,
} from 'lucide-react'
import { SmooLogoIcon } from '@/components/smoo-logo'

interface DashboardProps {
  household: Household
  currentUser: UserProfile
  members: UserProfile[]
  categories: Category[]
  recentTransactions: Transaction[]
  currentMonthTx: Transaction[]
  prevMonthTx: Transaction[]
  budgets: Budget[]
  monthKey: string
}

export default function Dashboard({
  household,
  currentUser,
  members,
  categories,
  recentTransactions,
  currentMonthTx,
  prevMonthTx,
  budgets,
  monthKey,
}: DashboardProps) {
  const [copied, setCopied] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const copyInviteCode = async () => {
    await navigator.clipboard.writeText(household.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  const getCategoryById = (id: string | null) => categories.find((c) => c.id === id)
  const getMemberById = (id: string | null) => members.find((m) => m.id === id)

  // Aggregation
  const monthlyExpense = currentMonthTx
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  const monthlyIncome = currentMonthTx
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const balance = monthlyIncome - monthlyExpense

  // Spending pattern warnings: categories where spending > prev month by >20%
  const warnings: { category: Category; current: number; prev: number; pct: number }[] = []
  categories.forEach((cat) => {
    const current = currentMonthTx
      .filter((t) => t.type === 'expense' && t.category_id === cat.id)
      .reduce((sum, t) => sum + t.amount, 0)
    const prev = prevMonthTx
      .filter((t) => t.type === 'expense' && t.category_id === cat.id)
      .reduce((sum, t) => sum + t.amount, 0)
    if (prev > 0 && current > prev * 1.2) {
      warnings.push({ category: cat, current, prev, pct: Math.round(((current - prev) / prev) * 100) })
    }
  })

  // Budget progress
  const budgetsWithProgress = budgets.map((b) => {
    const spent = currentMonthTx
      .filter((t) => t.type === 'expense' && t.category_id === b.category_id)
      .reduce((sum, t) => sum + t.amount, 0)
    const pct = Math.min(Math.round((spent / b.amount) * 100), 100)
    const cat = getCategoryById(b.category_id)
    return { ...b, spent, pct, cat }
  })

  // Settlement calculation (2-member model)
  // Each person should pay half of shared expenses
  // Person A paid X in shared, Person B paid Y in shared
  // If X > Y: B owes A (X - Y) / 2
  const sharedTx = currentMonthTx.filter((t) => t.type === 'expense' && t.is_shared)
  const memberPayments = members.reduce<Record<string, number>>((acc, m) => {
    acc[m.id] = sharedTx
      .filter((t) => t.user_id === m.id)
      .reduce((sum, t) => sum + t.amount, 0)
    return acc
  }, {})

  let settlementText: string | null = null
  if (members.length === 2) {
    const [a, b] = members
    const diff = memberPayments[a.id] - memberPayments[b.id]
    if (Math.abs(diff) >= 1) {
      const payer = diff > 0 ? b : a
      const receiver = diff > 0 ? a : b
      settlementText = `${payer.display_name} → ${receiver.display_name}: ${formatCurrency(Math.round(Math.abs(diff) / 2))}`
    } else {
      settlementText = '精算不要'
    }
  }

  // Payment distribution
  const totalShared = sharedTx.reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[390px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <SmooLogoIcon size={32} variant="dark" />
            <div>
              <p className="text-xs font-bold text-[#1a5c3a] leading-none">smoo</p>
              <p className="text-sm font-semibold leading-none mt-0.5">{household.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MonthNav monthKey={monthKey} basePath="/" />
            <button
              onClick={handleLogout}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors"
            >
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[390px] space-y-4 px-4 py-5 pb-24">
        {/* Summary cards */}
        <section className="grid grid-cols-3 gap-2">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingDown className="h-3 w-3 text-red-500" />
                <span className="text-[10px] text-muted-foreground">支出</span>
              </div>
              <p className="text-base font-bold leading-tight">{formatCurrency(monthlyExpense)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-[10px] text-muted-foreground">収入</span>
              </div>
              <p className="text-base font-bold leading-tight">{formatCurrency(monthlyIncome)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[10px] text-muted-foreground">残高</span>
              </div>
              <p className={`text-base font-bold leading-tight ${balance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {formatCurrency(balance)}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Spending pattern warnings */}
        {warnings.length > 0 && (
          <section className="space-y-2">
            {warnings.map(({ category, pct }) => (
              <div
                key={category.id}
                className="flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3"
              >
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-yellow-500" />
                <p className="text-xs text-yellow-800">
                  <span className="font-semibold">{category.icon} {category.name}</span> が先月より{' '}
                  <span className="font-semibold">{pct}%</span> 増加しています
                </p>
              </div>
            ))}
          </section>
        )}

        {/* Budget progress */}
        {budgetsWithProgress.length > 0 && (
          <section>
            <p className="mb-3 text-xs font-medium text-muted-foreground">予算</p>
            <div className="space-y-3">
              {budgetsWithProgress.map((b) => {
                const variant = b.pct >= 100 ? 'red' : b.pct >= 80 ? 'yellow' : 'default'
                return (
                  <div key={b.id} className="rounded-xl border border-border/50 bg-white p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{b.cat?.icon}</span>
                        <span className="text-sm font-medium">{b.cat?.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(b.spent)} / {formatCurrency(b.amount)}
                      </span>
                    </div>
                    <Progress value={b.pct} variant={variant} />
                    <p className={`mt-1 text-right text-xs font-medium ${
                      variant === 'red' ? 'text-red-600' : variant === 'yellow' ? 'text-yellow-600' : 'text-muted-foreground'
                    }`}>
                      {b.pct}%
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Settlement card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ArrowRight className="h-4 w-4" />
              今月の精算
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members.length < 2 ? (
              <p className="text-xs text-muted-foreground">メンバーが揃うと精算を計算できます</p>
            ) : settlementText ? (
              <div className="rounded-xl bg-primary/5 px-4 py-3 text-center">
                <p className="text-sm font-semibold text-primary">{settlementText}</p>
                {totalShared > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    共有支出合計: {formatCurrency(totalShared)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">共有支出がまだありません</p>
            )}

            {/* Payment distribution */}
            {members.length >= 2 && totalShared > 0 && (
              <div className="mt-3 space-y-2">
                {members.map((m) => {
                  const paid = memberPayments[m.id] ?? 0
                  const pct = totalShared > 0 ? Math.round((paid / totalShared) * 100) : 0
                  return (
                    <div key={m.id} className="flex items-center gap-2">
                      <span className="w-16 text-xs text-muted-foreground truncate">{m.display_name}</span>
                      <div className="flex-1">
                        <Progress value={pct} />
                      </div>
                      <span className="w-12 text-right text-xs font-medium">{formatCurrency(paid)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Member & invite code */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              メンバー ({members.length}人)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-1.5 rounded-full border border-border/50 bg-secondary/50 px-3 py-1"
                >
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                    {member.display_name[0] ?? '?'}
                  </div>
                  <span className="text-sm font-medium">{member.display_name}</span>
                  {member.id === currentUser.id && (
                    <Badge variant="secondary" className="text-xs py-0 px-1.5 h-4">自分</Badge>
                  )}
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="mb-1.5 text-xs text-muted-foreground">招待コード</p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-bold tracking-[0.2em] text-foreground">
                  {household.invite_code}
                </span>
                <button
                  onClick={copyInviteCode}
                  className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
                >
                  {copied ? (
                    <><Check className="h-3 w-3 text-green-500" />コピー済み</>
                  ) : (
                    <><Copy className="h-3 w-3" />コピー</>
                  )}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">最近の取引</p>
            <button
              onClick={() => router.push('/transactions')}
              className="text-xs text-primary font-medium hover:underline"
            >
              すべて見る
            </button>
          </div>
          {recentTransactions.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-3xl mb-3">📝</p>
                <p className="text-sm text-muted-foreground">まだ取引が登録されていません</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  右下の + ボタンで追加してみましょう
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((tx) => {
                const cat = getCategoryById(tx.category_id)
                const member = getMemberById(tx.user_id)
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 rounded-xl border border-border/50 bg-white p-3"
                  >
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg"
                      style={{ backgroundColor: cat?.color ?? '#f9fafb' }}
                    >
                      {cat?.icon ?? '💰'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {tx.description ?? cat?.name ?? '取引'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member?.display_name} · {formatDate(tx.date)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-semibold ${tx.type === 'expense' ? 'text-foreground' : 'text-green-600'}`}>
                        {tx.type === 'expense' ? '-' : '+'}
                        {formatCurrency(tx.amount)}
                      </p>
                      {tx.is_shared && (
                        <span className="text-xs text-muted-foreground/60">共有</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {/* FAB */}
      <button
        onClick={() => setModalOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="取引を追加"
      >
        <Plus className="h-6 w-6" />
      </button>

      <TransactionModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          router.refresh()
        }}
        householdId={household.id}
        categories={categories}
        members={members}
        currentUserId={currentUser.id}
      />
    </div>
  )
}
