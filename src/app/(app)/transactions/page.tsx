import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TransactionsView from './transactions-view'
import { getCurrentMonthKey, getMonthRange } from '@/lib/utils'

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, display_name, household_id, created_at')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) {
    redirect('/setup')
  }

  const householdId = profile.household_id
  const monthKey = params.month ?? getCurrentMonthKey()
  const { start: monthStart, end: monthEnd } = getMonthRange(monthKey)

  const [
    { data: categories },
    { data: members },
    { data: transactions },
  ] = await Promise.all([
    supabase
      .from('categories')
      .select('id, household_id, name, icon, color, is_default')
      .eq('household_id', householdId)
      .order('name'),
    supabase
      .from('user_profiles')
      .select('id, display_name, household_id, created_at')
      .eq('household_id', householdId),
    supabase
      .from('transactions')
      .select('*')
      .eq('household_id', householdId)
      .gte('date', monthStart)
      .lte('date', monthEnd)
      .order('date', { ascending: false }),
  ])

  return (
    <TransactionsView
      householdId={householdId}
      currentUserId={profile.id}
      categories={categories ?? []}
      members={members ?? []}
      transactions={transactions ?? []}
      monthKey={monthKey}
    />
  )
}
