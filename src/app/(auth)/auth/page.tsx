'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SmooLogoFull } from '@/components/smoo-logo'

const authSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
})

type AuthFormValues = z.infer<typeof authSchema>

function AuthForm() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // URLのエラーパラメータを表示
  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError) {
      setError(urlError)
      // URLパラメータをクリア（リロード時の再表示防止）
      window.history.replaceState({}, '', '/auth')
    }
  }, [searchParams])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
  })

  const handleLogin = async (data: AuthFormValues) => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      // メール未確認の場合のエラーをわかりやすく
      if (error.message.includes('Email not confirmed')) {
        setError('メールアドレスの確認が完了していません。確認メールのリンクをクリックしてください。')
      } else {
        setError('メールアドレスまたはパスワードが正しくありません')
      }
    } else {
      window.location.href = '/'
    }
    setLoading(false)
  }

  const handleSignUp = async (data: AuthFormValues) => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    if (error) {
      // 内部エラーメッセージを直接表示しない
      setError('登録に失敗しました。しばらく経ってから再度お試しください。')
    } else {
      setMessage(
        '確認メールを送信しました。メールのリンクをクリックして登録を完了してください。'
      )
    }
    setLoading(false)
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-white p-6 shadow-sm">
      <Tabs defaultValue="login">
        <TabsList className="w-full">
          <TabsTrigger value="login" className="flex-1">
            ログイン
          </TabsTrigger>
          <TabsTrigger value="signup" className="flex-1">
            新規登録
          </TabsTrigger>
        </TabsList>

        {/* ログイン */}
        <TabsContent value="login">
          <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email">メールアドレス</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-password">パスワード</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>
        </TabsContent>

        {/* サインアップ */}
        <TabsContent value="signup">
          <form onSubmit={handleSubmit(handleSignUp)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="signup-email">メールアドレス</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signup-password">パスワード</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="6文字以上"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            {message && (
              <p className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
                {message}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登録中...' : '新規登録'}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function AuthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-[390px]">
        {/* ロゴ */}
        <div className="mb-8 text-center">
          <SmooLogoFull size="lg" variant="dark" tagline />
        </div>

        <Suspense fallback={
          <div className="rounded-2xl border border-border/50 bg-white p-6 shadow-sm">
            <div className="h-64 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">読み込み中...</p>
            </div>
          </div>
        }>
          <AuthForm />
        </Suspense>
      </div>
    </div>
  )
}
