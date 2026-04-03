import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error_description = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/'

  // エラーがある場合（Supabase からのエラーリダイレクト）
  if (error_description) {
    console.error('Auth callback error:', error_description)
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(error_description)}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('Session exchange error:', error.message)
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent('セッションの作成に失敗しました')}`
    )
  }

  return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent('認証コードがありません')}`)
}
