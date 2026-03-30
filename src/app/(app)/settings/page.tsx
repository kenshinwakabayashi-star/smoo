import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background pb-20 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
        <Settings className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-lg font-semibold">設定</h1>
      <p className="mt-2 text-sm text-muted-foreground text-center">
        プロフィール・家計・通知の設定ができます
      </p>
      <p className="mt-1 text-xs text-muted-foreground/60">近日公開予定</p>
    </div>
  )
}
