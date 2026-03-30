'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import MonthNav from '@/components/month-nav'
import TransactionModal from '@/components/transaction-modal'
import { Search, Pencil, Trash2, Plus } from 'lucide-react'
import type { Category, UserProfile, Transaction } from '@/types/database'

interface TransactionsViewProps {
  householdId: string
  currentUserId: string
  categories: Category[]
  members: UserProfile[]
  transactions: Transaction[]
  monthKey: string
}

export default function TransactionsView({
  householdId,
  currentUserId,
  categories,
  members,
  transactions,
  monthKey,
}: TransactionsViewProps) {
  const [tab, setTab] = useState<'all' | 'shared' | 'personal'>('all')
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null)
  const [filterMemberId, setFilterMemberId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const getCategoryById = (id: string | null) => categories.find((c) => c.id === id)
  const getMemberById = (id: string | null) => members.find((m) => m.id === id)

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (tab === 'shared' && !tx.is_shared) return false
      if (tab === 'personal' && tx.is_shared) return false
      if (filterCategoryId && tx.category_id !== filterCategoryId) return false
      if (filterMemberId && tx.user_id !== filterMemberId) return false
      if (search) {
        const q = search.toLowerCase()
        const catName = getCategoryById(tx.category_id)?.name?.toLowerCase() ?? ''
        const desc = tx.description?.toLowerCase() ?? ''
        const memberName = getMemberById(tx.user_id)?.display_name?.toLowerCase() ?? ''
        if (!catName.includes(q) && !desc.includes(q) && !memberName.includes(q)) return false
      }
      return true
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, tab, filterCategoryId, filterMemberId, search])

  const handleDelete = async (id: string) => {
    if (!confirm('この取引を削除しますか？')) return
    setDeletingId(id)
    await supabase.from('transactions').delete().eq('id', id)
    setDeletingId(null)
    router.refresh()
  }

  const totalExpense = filtered
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[390px] items-center justify-between px-4 py-3">
          <h1 className="text-base font-semibold">取引一覧</h1>
          <MonthNav monthKey={monthKey} basePath="/transactions" />
        </div>
      </header>

      <main className="mx-auto max-w-[390px] space-y-3 px-4 py-4 pb-24">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border/50 bg-white pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Shared / Personal tabs */}
        <div className="flex rounded-xl bg-muted p-1 gap-1">
          {(['all', 'shared', 'personal'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors',
                tab === t ? 'bg-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t === 'all' ? 'すべて' : t === 'shared' ? '共有' : '個人'}
            </button>
          ))}
        </div>

        {/* Category filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFilterCategoryId(null)}
            className={cn(
              'flex-shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              filterCategoryId === null
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/50 hover:bg-accent'
            )}
          >
            全カテゴリ
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategoryId(cat.id === filterCategoryId ? null : cat.id)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                filterCategoryId === cat.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/50 hover:bg-accent'
              )}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Member filter */}
        {members.length > 1 && (
          <div className="flex gap-2">
            <button
              onClick={() => setFilterMemberId(null)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                filterMemberId === null
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/50 hover:bg-accent'
              )}
            >
              全員
            </button>
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => setFilterMemberId(m.id === filterMemberId ? null : m.id)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  filterMemberId === m.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/50 hover:bg-accent'
                )}
              >
                {m.display_name}
              </button>
            ))}
          </div>
        )}

        {/* Totals */}
        <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-2">
          <span className="text-xs text-muted-foreground">{filtered.length}件</span>
          <span className="text-sm font-semibold">{formatCurrency(totalExpense)}</span>
        </div>

        {/* Transaction list */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-border/50 bg-white py-12 text-center">
            <p className="text-3xl mb-3">📂</p>
            <p className="text-sm text-muted-foreground">取引がありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((tx) => {
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
                      {tx.is_shared && <span className="ml-1 text-primary/60">共有</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="text-right mr-1">
                      <p className={`text-sm font-semibold ${tx.type === 'expense' ? 'text-foreground' : 'text-green-600'}`}>
                        {tx.type === 'expense' ? '-' : '+'}
                        {formatCurrency(tx.amount)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditTx(tx)
                        setModalOpen(true)
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-accent transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      disabled={deletingId === tx.id}
                      className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => {
          setEditTx(null)
          setModalOpen(true)
        }}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="取引を追加"
      >
        <Plus className="h-6 w-6" />
      </button>

      <TransactionModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditTx(null)
          router.refresh()
        }}
        householdId={householdId}
        categories={categories}
        members={members}
        currentUserId={currentUserId}
        editTransaction={editTx}
      />
    </div>
  )
}
