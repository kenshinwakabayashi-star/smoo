import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReportsView from './reports-view'
import { getCurrentMonthKey, getMonthRange, getPrevMonth } from '@/lib/utils'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, display_name, household_id, created_at')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) redirect('/setup')

  const householdId = profile.household_id
  const monthKey = params.month ?? getCurrentMonthKey()

  // Build 6-month range
  const months: string[] = []
  let mk = monthKey
  for (let i = 0; i < 6; i++) {
    months.unshift(mk)
    mk = getPrevMonth(mk)
  }
  const oldest = getMonthRange(months[0]).start
  const newest = getMonthRange(monthKey).end

  const [{ data: transactions }, { data: categories }, { data: members }] = await Promise.all([
    supabase
      .from('transactions')
      .select('*')
      .eq('household_id', householdId)
      .gte('date', oldest)
      .lte('date', newest),
    supabase
      .from('categories')
      .select('id, household_id, name, icon, color, is_default')
      .eq('household_id', householdId),
    supabase
      .from('user_profiles')
      .select('id, display_name, household_id, created_at')
      .eq('household_id', householdId),
  ])

  return (
    <ReportsView
      transactions={transactions ?? []}
      categories={categories ?? []}
      members={members ?? []}
      monthKey={monthKey}
      months={months}
    />
  )
}
