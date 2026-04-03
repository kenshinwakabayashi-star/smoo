'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SmooLogoFull } from '@/components/smoo-logo'


const step1Schema = z.object({
  displayName: z
    .string()
    .min(1, '表示名を入力してください')
    .max(20, '表示名は20文字以内で入力してください'),
})

const createHouseholdSchema = z.object({
  householdName: z
    .string()
    .min(1, '家計名を入力してください')
    .max(30, '家計名は30文字以内で入力してください'),
})

const joinSchema = z.object({
  inviteCode: z
    .string()
    .length(8, '招待コードは8文字で入力してください'),
})

type Step1Values = z.infer<typeof step1Schema>
type CreateHouseholdValues = z.infer<typeof createHouseholdSchema>
type JoinValues = z.infer<typeof joinSchema>

type Step = 'name' | 'choice' | 'create' | 'join' | 'created'

export default function SetupForm() {
  const [step, setStep] = useState<Step>('name')
  const [displayName, setDisplayName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const step1Form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
  })

  const createForm = useForm<CreateHouseholdValues>({
    resolver: zodResolver(createHouseholdSchema),
  })

  const joinForm = useForm<JoinValues>({
    resolver: zodResolver(joinSchema),
  })

  const handleStep1 = (data: Step1Values) => {
    setDisplayName(data.displayName)
    setStep('choice')
  }

  const handleCreateHousehold = async (data: CreateHouseholdValues) => {
    setLoading(true)
    setError(null)
    try {
      // SECURITY DEFINER RPC でアトミックに household 作成 + カテゴリ挿入 + profile 作成
      const { data: result, error } = await supabase.rpc(
        'create_household_with_categories',
        {
          p_household_name: data.householdName,
          p_display_name: displayName,
        }
      )

      if (error) throw error

      const res = result as { success?: boolean; error?: string; invite_code?: string }
      if (res.error) {
        setError(res.error === 'Already joined a household'
          ? '既に家計に参加しています'
          : '作成に失敗しました。再度お試しください。')
      } else if (res.invite_code) {
        setInviteCode(res.invite_code)
        setStep('created')
      }
    } catch {
      setError('作成に失敗しました。再度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (data: JoinValues) => {
    setLoading(true)
    setError(null)
    try {
      // SECURITY DEFINER RPC で招待コード検索 (RLS バイパス) + profile 作成
      const { data: result, error } = await supabase.rpc(
        'join_household_by_invite_code',
        {
          p_invite_code: data.inviteCode,
          p_display_name: displayName,
        }
      )

      if (error) throw error

      const res = result as { success?: boolean; error?: string }
      if (res.error) {
        if (res.error === 'Invalid invite code') {
          setError('招待コードが見つかりません。確認してください。')
        } else if (res.error === 'Already joined a household') {
          setError('既に家計に参加しています')
        } else {
          setError('参加に失敗しました。再度お試しください。')
        }
      } else {
        window.location.href = '/'
      }
    } catch {
      setError('参加に失敗しました。再度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-[390px]">
        {/* ヘッダー */}
        <div className="mb-8 text-center">
          <SmooLogoFull size="lg" variant="dark" tagline />
          <p className="mt-3 text-xs text-muted-foreground">初回セットアップ</p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-white p-6 shadow-sm">
          {/* Step 1: 表示名 */}
          {step === 'name' && (
            <form onSubmit={step1Form.handleSubmit(handleStep1)} className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold">あなたの表示名</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  パートナーに表示される名前を入力してください
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="displayName">表示名</Label>
                <Input
                  id="displayName"
                  placeholder="例: たろう"
                  {...step1Form.register('displayName')}
                />
                {step1Form.formState.errors.displayName && (
                  <p className="text-xs text-destructive">
                    {step1Form.formState.errors.displayName.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full">
                次へ
              </Button>
            </form>
          )}

          {/* Step 2: 選択 */}
          {step === 'choice' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {displayName}さん、ようこそ！
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  新しく家計を作るか、招待コードで参加しますか？
                </p>
              </div>
              <button
                onClick={() => setStep('create')}
                className="flex w-full items-center gap-4 rounded-xl border border-border/50 bg-background p-4 text-left transition-colors hover:bg-accent"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xl">
                  ✨
                </div>
                <div>
                  <div className="font-medium">新しい家計を作る</div>
                  <div className="text-sm text-muted-foreground">
                    招待コードを発行してパートナーを招待
                  </div>
                </div>
              </button>
              <button
                onClick={() => setStep('join')}
                className="flex w-full items-center gap-4 rounded-xl border border-border/50 bg-background p-4 text-left transition-colors hover:bg-accent"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xl">
                  🔑
                </div>
                <div>
                  <div className="font-medium">招待コードで参加</div>
                  <div className="text-sm text-muted-foreground">
                    パートナーが作った家計に参加
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Step 3a: 家計作成 */}
          {step === 'create' && (
            <form
              onSubmit={createForm.handleSubmit(handleCreateHousehold)}
              className="space-y-5"
            >
              <div>
                <button
                  type="button"
                  onClick={() => setStep('choice')}
                  className="mb-3 text-sm text-muted-foreground hover:text-foreground"
                >
                  ← 戻る
                </button>
                <h2 className="text-lg font-semibold">家計名を決めよう</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  2人の家計の名前を入力してください
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="householdName">家計名</Label>
                <Input
                  id="householdName"
                  placeholder="例: たろうとはなこの家"
                  {...createForm.register('householdName')}
                />
                {createForm.formState.errors.householdName && (
                  <p className="text-xs text-destructive">
                    {createForm.formState.errors.householdName.message}
                  </p>
                )}
              </div>
              {error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '作成中...' : '家計を作成する'}
              </Button>
            </form>
          )}

          {/* Step 3b: 招待コードで参加 */}
          {step === 'join' && (
            <form
              onSubmit={joinForm.handleSubmit(handleJoin)}
              className="space-y-5"
            >
              <div>
                <button
                  type="button"
                  onClick={() => setStep('choice')}
                  className="mb-3 text-sm text-muted-foreground hover:text-foreground"
                >
                  ← 戻る
                </button>
                <h2 className="text-lg font-semibold">招待コードを入力</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  パートナーから受け取った8文字のコードを入力してください
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inviteCode">招待コード</Label>
                <Input
                  id="inviteCode"
                  placeholder="例: abc12345"
                  className="font-mono tracking-widest"
                  maxLength={8}
                  {...joinForm.register('inviteCode')}
                />
                {joinForm.formState.errors.inviteCode && (
                  <p className="text-xs text-destructive">
                    {joinForm.formState.errors.inviteCode.message}
                  </p>
                )}
              </div>
              {error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '参加中...' : '参加する'}
              </Button>
            </form>
          )}

          {/* 完了: 招待コードを表示 */}
          {step === 'created' && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="mb-3 text-4xl">🎉</div>
                <h2 className="text-lg font-semibold">家計を作成しました！</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  下の招待コードをパートナーに共有してください
                </p>
              </div>
              <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-5 text-center">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  招待コード
                </p>
                <p className="font-mono text-3xl font-bold tracking-[0.25em] text-primary">
                  {inviteCode}
                </p>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                コードはいつでもダッシュボードから確認できます
              </p>
              <Button
                className="w-full"
                onClick={() => (window.location.href = '/')}
              >
                ダッシュボードへ
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
