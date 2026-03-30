import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsView from './settings-view'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, display_name, household_id, created_at')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) redirect('/setup')

  const [{ data: categories }, { data: household }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, household_id, name, icon, color, is_default')
      .eq('household_id', profile.household_id)
      .order('name'),
    supabase
      .from('households')
      .select('id, name, invite_code, created_at')
      .eq('id', profile.household_id)
      .single(),
  ])

  return (
    <SettingsView
      profile={profile}
      categories={categories ?? []}
      household={household!}
    />
  )
}
