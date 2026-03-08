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
  // 1. Obtener count total
  let countQuery = client.from(table).select('*', { count: 'exact', head: true })
  if (filters?.eq) {
    for (const [k, v] of Object.entries(filters.eq)) {
      countQuery = countQuery.eq(k, v)
    }
  }
  if (filters?.in) {
    countQuery = countQuery.in(filters.in.column, filters.in.values)
  }

  const { count, error: countError } = await countQuery
  if (countError) throw countError
  if (!count || count === 0) return []

  // 2. Fetch en paralelo
  const totalPages = Math.ceil(count / PAGE_SIZE)
  const promises = []

  for (let i = 0; i < totalPages; i++) {
    const from = i * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let query = client.from(table).select(select).range(from, to)
    if (filters?.eq) {
      for (const [k, v] of Object.entries(filters.eq)) {
        query = query.eq(k, v)
      }
    }
    if (filters?.in) {
      query = query.in(filters.in.column, filters.in.values)
    }
    promises.push(query)
  }

  const results = await Promise.all(promises)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all: any[] = []
  for (const res of results) {
    if (res.error) throw res.error
    if (res.data) all.push(...res.data)
  }

  return all
}
