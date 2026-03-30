'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Category, UserProfile, Transaction } from '@/types/database'

const schema = z.object({
  amount: z
    .string()
    .min(1, '金額を入力してください')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, '正の金額を入力してください'),
  description: z.string().max(100).optional(),
  date: z.string().min(1, '日付を入力してください'),
  category_id: z.string().min(1, 'カテゴリを選択してください'),
  user_id: z.string().min(1, '支払者を選択してください'),
  is_shared: z.boolean(),
})

type FormValues = z.infer<typeof schema>

interface TransactionModalProps {
  open: boolean
  onClose: () => void
  householdId: string
  categories: Category[]
  members: UserProfile[]
  currentUserId: string
  editTransaction?: Transaction | null
}

export default function TransactionModal({
  open,
  onClose,
  householdId,
  categories,
  members,
  currentUserId,
  editTransaction,
}: TransactionModalProps) {
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: today,
      user_id: currentUserId,
      is_shared: true,
    },
  })

  const selectedCategoryId = watch('category_id')
  const isShared = watch('is_shared')

  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type as 'expense' | 'income')
      reset({
        amount: String(editTransaction.amount),
        description: editTransaction.description ?? '',
        date: editTransaction.date,
        category_id: editTransaction.category_id ?? '',
        user_id: editTransaction.user_id ?? currentUserId,
        is_shared: editTransaction.is_shared,
      })
    } else {
      setType('expense')
      reset({
        amount: '',
        description: '',
        date: today,
        category_id: '',
        user_id: currentUserId,
        is_shared: true,
      })
    }
    setError(null)
  }, [editTransaction, open, reset, today, currentUserId])

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    setError(null)
    try {
      const payload = {
        household_id: householdId,
        user_id: data.user_id,
        type,
        amount: Number(data.amount),
        description: data.description || null,
        date: data.date,
        category_id: data.category_id,
        is_shared: data.is_shared,
      }

      if (editTransaction) {
        const { error } = await supabase
          .from('transactions')
          .update(payload)
          .eq('id', editTransaction.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('transactions').insert(payload)
        if (error) throw error
      }
      onClose()
    } catch {
      setError('保存に失敗しました。再度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[390px] rounded-t-2xl bg-white pb-safe shadow-xl animate-in slide-in-from-bottom duration-300">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="text-base font-semibold">
            {editTransaction ? '取引を編集' : '取引を追加'}
          </h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-5 pb-6">
          {/* Type toggle */}
          <div className="flex rounded-xl bg-muted p-1 gap-1">
            {(['expense', 'income'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  'flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors',
                  type === t ? 'bg-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t === 'expense' ? '支出' : '収入'}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="0"
              className="h-14 text-center font-mono text-3xl font-bold tracking-tight"
              {...register('amount')}
            />
            {errors.amount && (
              <p className="mt-1 text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label>日付</Label>
            <Input type="date" {...register('date')} />
            {errors.date && (
              <p className="text-xs text-destructive">{errors.date.message}</p>
            )}
          </div>

          {/* Payer */}
          <div className="space-y-1.5">
            <Label>支払者</Label>
            <div className="flex gap-2">
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setValue('user_id', m.id)}
                  className={cn(
                    'flex-1 rounded-xl border py-2 text-sm font-medium transition-colors',
                    watch('user_id') === m.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/50 hover:bg-accent'
                  )}
                >
                  {m.display_name}
                </button>
              ))}
            </div>
            {errors.user_id && (
              <p className="text-xs text-destructive">{errors.user_id.message}</p>
            )}
          </div>

          {/* Category chips */}
          <div className="space-y-1.5">
            <Label>カテゴリ</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setValue('category_id', cat.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    selectedCategoryId === cat.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/50 hover:bg-accent'
                  )}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
            {errors.category_id && (
              <p className="text-xs text-destructive">{errors.category_id.message}</p>
            )}
          </div>

          {/* Memo */}
          <div className="space-y-1.5">
            <Label>メモ（任意）</Label>
            <Input placeholder="例: スーパーで買い物" {...register('description')} />
          </div>

          {/* Shared toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium">共有支出</p>
              <p className="text-xs text-muted-foreground">精算の計算に含める</p>
            </div>
            <button
              type="button"
              onClick={() => setValue('is_shared', !isShared)}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors',
                isShared ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                  isShared ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '保存中...' : editTransaction ? '更新する' : '追加する'}
          </Button>
        </form>
      </div>
    </>
  )
}
