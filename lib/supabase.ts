import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Singleton service client — reutiliza la misma instancia en todas las requests.
 * Evita crear miles de conexiones bajo carga (5K+ usuarios).
 */
let _serviceClient: SupabaseClient | null = null

export function getServiceClient(): SupabaseClient {
  if (!_serviceClient) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    _serviceClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return _serviceClient
}

/**
 * Paginated fetch to bypass Supabase's 1000-row default limit.
 * Fetches all rows in batches of 1000 using .range().
 */
const PAGE_SIZE = 1000

export async function fetchAllRows(
  client: SupabaseClient,
  table: string,
  select: string,
  filters?: { eq?: Record<string, string>; in?: { column: string; values: string[] } },
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all: any[] = []
  let from = 0
  while (true) {
    let query = client.from(table).select(select).range(from, from + PAGE_SIZE - 1)
    if (filters?.eq) {
      for (const [k, v] of Object.entries(filters.eq)) {
        query = query.eq(k, v)
      }
    }
    if (filters?.in) {
      query = query.in(filters.in.column, filters.in.values)
    }
    const { data, error } = await query
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return all
}
