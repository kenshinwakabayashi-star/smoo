'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, List, Calendar, BarChart2, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', icon: Home, label: 'ホーム' },
  { href: '/transactions', icon: List, label: '取引' },
  { href: '/calendar', icon: Calendar, label: 'カレンダー' },
  { href: '/reports', icon: BarChart2, label: 'レポート' },
  { href: '/settings', icon: Settings, label: '設定' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[390px] items-center justify-around px-2 py-2 pb-safe">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'fill-primary/10')} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
