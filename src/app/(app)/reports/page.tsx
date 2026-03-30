import { BarChart2 } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background pb-20 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
        <BarChart2 className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-lg font-semibold">レポート</h1>
      <p className="mt-2 text-sm text-muted-foreground text-center">
        カテゴリ別・月別の支出グラフを確認できます
      </p>
      <p className="mt-1 text-xs text-muted-foreground/60">近日公開予定</p>
    </div>
  )
}
