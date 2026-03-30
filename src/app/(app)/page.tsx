import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Dashboard from './dashboard'
import { getCurrentMonthKey, getMonthRange, getPrevMonth } from '@/lib/utils'

export default async function DashboardPage({
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

  if (!profile || !profile.household_id) {
    redirect('/setup')
  }

  const householdId = profile.household_id
  const monthKey = params.month ?? getCurrentMonthKey()
  const { start: monthStart } = getMonthRange(monthKey)
  const { start: prevMonthStart, end: prevMonthEnd } = getMonthRange(getPrevMonth(monthKey))

  const [
    { data: household },
    { data: members },
    { data: categories },
    { data: recentTransactions },
    { data: currentMonthTx },
    { data: prevMonthTx },
    { data: budgets },
  ] = await Promise.all([
    supabase
      .from('households')
      .select('id, name, invite_code, created_at')
      .eq('id', householdId)
      .single(),
    supabase
      .from('user_profiles')
      .select('id, display_name, household_id, created_at')
      .eq('household_id', householdId),
    supabase
      .from('categories')
      .select('id, household_id, name, icon, color, is_default')
      .eq('household_id', householdId)
      .order('name'),
    // Recent 5 transactions (display only)
    supabase
      .from('transactions')
      .select('*')
      .eq('household_id', householdId)
      .order('date', { ascending: false })
      .limit(5),
    // Current month all transactions (for aggregation)
    supabase
      .from('transactions')
      .select('*')
      .eq('household_id', householdId)
      .gte('date', monthStart),
    // Previous month transactions (for spending pattern comparison)
    supabase
      .from('transactions')
      .select('*')
      .eq('household_id', householdId)
      .gte('date', prevMonthStart)
      .lte('date', prevMonthEnd),
    // Budgets for current month
    supabase
      .from('budgets')
      .select('*')
      .eq('household_id', householdId)
      .eq('month', monthKey),
  ])

  if (!household) {
    redirect('/setup')
  }

  return (
    <Dashboard
      household={household}
      currentUser={profile}
      members={members ?? []}
      categories={categories ?? []}
      recentTransactions={recentTransactions ?? []}
      currentMonthTx={currentMonthTx ?? []}
      prevMonthTx={prevMonthTx ?? []}
      budgets={budgets ?? []}
      monthKey={monthKey}
    />
  )
}
