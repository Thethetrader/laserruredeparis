import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let safeClient: SupabaseClient | null = null

// Crée le client seulement si les variables sont définies (évite erreur de build)
if (supabaseUrl && supabaseAnonKey) {
  safeClient = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: 'propulsemysite' } })
}

export const supabase = safeClient as SupabaseClient 