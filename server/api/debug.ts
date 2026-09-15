import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Using anon client, but maybe it needs to fetch without RLS
  // For debug, let's just see what's in profiles
  const client = await serverSupabaseClient(event)
  const { data: profiles, error: pError } = await client.from('profiles').select('*')
  
  return { profiles, pError }
})
