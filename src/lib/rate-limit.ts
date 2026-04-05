import { SupabaseClient } from '@supabase/supabase-js'

export async function isRateLimited(
  supabase: SupabaseClient,
  table: string,
  deviceIdField: string,
  deviceId: string,
  minMs: number,
  extraFilters?: Record<string, string>,
): Promise<boolean> {
  let query = supabase
    .from(table)
    .select('created_at')
    .eq(deviceIdField, deviceId)

  if (extraFilters) {
    for (const [key, value] of Object.entries(extraFilters)) {
      query = query.eq(key, value)
    }
  }

  const { data } = await query
    .order('id', { ascending: false })
    .limit(1)
    .single()

  if (!data?.created_at) return false

  const lastTime = new Date(data.created_at.replace(' ', 'T'))
  return Date.now() - lastTime.getTime() < minMs
}
