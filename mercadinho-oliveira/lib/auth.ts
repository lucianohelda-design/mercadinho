import { supabase } from '@/lib/supabase'

export async function requireUser() {
  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    location.href = '/'
    return null
  }
  return data.user
}
