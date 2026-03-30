'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, ChevronRight, X, LogOut, Copy } from 'lucide-react'
import type { UserProfile, Category, Household } from '@/types/database'

const PRESET_ICONS = [
  '🏠','🍽️','🚃','🛒','💊','👗','🎮','☕',
  '🎬','📚','💡','🐾','✈️','💰','🎁','🏋️',
  '💳','🔧','🎵','🌿','🍺','🎓','💼','🏥',
]

const PRESET_COLORS = [
  '#ef4444','#f97316','#eab308','#84cc16',
  '#22c55e','#14b8a6','#06b6d4','#3b82f6',
  '#8b5cf6','#ec4899','#64748b','#1a5c3a',
]

interface SettingsViewProps {
  profile: UserProfile
  categories: Category[]
  household: Household
}

export default function SettingsView({ profile, categories: initCategories, household }: SettingsViewProps) {
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [savingName, setSavingName] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)

  const [categories, setCategories] = useState(initCategories)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [editColor, setEditColor] = useState('')
  const [savingCat, setSavingCat] = useState(false)

  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSaveName = async () => {
    if (!displayName.trim()) return
    setSavingName(true)
    await supabase.from('user_profiles').update({ display_name: displayName.trim() }).eq('id', profile.id)
    setSavingName(false)
    setNameSaved(true)
    setTimeout(() => setNameSaved(false), 2000)
    router.refresh()
  }

  const openEditCat = (cat: Category) => {
    setEditingCat(cat)
    setEditName(cat.name)
    setEditIcon(cat.icon)
    setEditColor(cat.color)
  }

  const handleSaveCat = async () => {
    if (!editingCat || !editName.trim()) return
    setSavingCat(true)
    const { data } = await supabase
      .from('categories')
      .update({ name: editName.trim(), icon: editIcon, color: editColor })
      .eq('id', editingCat.id)
      .select()
      .single()
    if (data) {
      setCategories((prev) => prev.map((c) => (c.id === data.id ? data : c)))
    }
    setSavingCat(false)
    setEditingCat(null)
    router.refresh()
  }

  const copyInviteCode = async () => {
    await navigator.clipboard.writeText(household.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[390px] items-center px-4 py-3">
          <h1 className="text-base font-semibold">設定</h1>
        </div>
      </header>

      <main className="mx-auto max-w-[390px] space-y-5 px-4 py-4 pb-24">

        {/* Profile */}
        <section>
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">プロフィール</p>
          <div className="rounded-2xl border border-border/50 bg-white p-4 space-y-3">
            <div className="space-y-1.5">
              <Label>表示名</Label>
              <div className="flex gap-2">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={20}
                  placeholder="表示名"
                />
                <Button onClick={handleSaveName} disabled={savingName || displayName === profile.display_name} className="flex-shrink-0">
                  {nameSaved ? <Check className="h-4 w-4" /> : savingName ? '保存中' : '保存'}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section>
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">カテゴリ</p>
          <div className="rounded-2xl border border-border/50 bg-white divide-y divide-border/50 overflow-hidden">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => openEditCat(cat)}
                className="flex w-full items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
              >
                <span
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ backgroundColor: cat.color }}
                >
                  {cat.icon}
                </span>
                <span className="flex-1 text-sm font-medium">{cat.name}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </section>

        {/* Household */}
        <section>
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">家計</p>
          <div className="rounded-2xl border border-border/50 bg-white p-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">家計名</p>
              <p className="text-sm font-medium">{household.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">招待コード</p>
              <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
                <span className="font-mono text-lg font-bold tracking-[0.2em]">{household.invite_code}</span>
                <button
                  onClick={copyInviteCode}
                  className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-white px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
                >
                  {copied ? <><Check className="h-3 w-3 text-green-500" />コピー済み</> : <><Copy className="h-3 w-3" />コピー</>}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Logout */}
        <section>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl border border-red-100 bg-white px-4 py-3 text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">ログアウト</span>
          </button>
        </section>

      </main>

      {/* Category edit modal */}
      {editingCat && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setEditingCat(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-h-[85vh] max-w-[390px] flex-col rounded-t-2xl bg-white shadow-xl animate-in slide-in-from-bottom duration-200">
            {/* Handle */}
            <div className="flex flex-shrink-0 justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-muted" />
            </div>
            {/* Header */}
            <div className="flex flex-shrink-0 items-center justify-between px-5 py-3 border-b border-border/50">
              <h2 className="text-base font-semibold">カテゴリを編集</h2>
              <button onClick={() => setEditingCat(null)} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Preview */}
              <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: editColor }}>
                  {editIcon}
                </span>
                <span className="text-sm font-medium">{editName || 'カテゴリ名'}</span>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label>名前</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={20} placeholder="カテゴリ名" />
              </div>

              {/* Icon */}
              <div className="space-y-2">
                <Label>アイコン</Label>
                <div className="grid grid-cols-8 gap-1.5">
                  {PRESET_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setEditIcon(icon)}
                      className={cn(
                        'flex h-9 w-full items-center justify-center rounded-lg text-lg transition-colors',
                        editIcon === icon ? 'bg-primary/15 ring-2 ring-primary' : 'bg-muted/40 hover:bg-muted'
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label>カラー</Label>
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setEditColor(color)}
                      className="relative h-9 w-full rounded-xl transition-transform hover:scale-110"
                      style={{ backgroundColor: color }}
                    >
                      {editColor === color && (
                        <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Save button */}
            <div className="flex-shrink-0 border-t border-border/50 px-5 py-4">
              <Button onClick={handleSaveCat} disabled={savingCat || !editName.trim()} className="w-full">
                {savingCat ? '保存中...' : '保存する'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
