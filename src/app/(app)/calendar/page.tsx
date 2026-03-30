import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CalendarView from './calendar-view'
import { getCurrentMonthKey, getMonthRange } from '@/lib/utils'

export default async function CalendarPage({
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
  const { start, end } = getMonthRange(monthKey)

  const [{ data: transactions }, { data: categories }, { data: members }] = await Promise.all([
    supabase
      .from('transactions')
      .select('*')
      .eq('household_id', householdId)
      .gte('date', start)
      .lte('date', end)
      .order('date'),
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
    <CalendarView
      transactions={transactions ?? []}
      categories={categories ?? []}
      members={members ?? []}
      monthKey={monthKey}
    />
  )
}
