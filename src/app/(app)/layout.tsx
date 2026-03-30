import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/bottom-nav'
import RealtimeProvider from '@/components/realtime-provider'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('household_id')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) {
    redirect('/setup')
  }

  return (
    <div className="min-h-screen bg-background">
      <RealtimeProvider householdId={profile.household_id} />
      {children}
      <BottomNav />
    </div>
  )
}
