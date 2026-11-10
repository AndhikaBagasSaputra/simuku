import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url: string | undefined = import.meta.env.VITE_SUPABASE_URL
const key: string | undefined = import.meta.env.VITE_SUPABASE_KEY

/**
 * null kalau alamat & kunci Supabase belum diisi (lihat .env.example).
 * Tanpa itu aplikasi tetap jalan seperti biasa, hanya tanpa login & sinkron.
 */
export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: {
          // Awalan "keuangan:" supaya ikut terhapus saat data dihapus karena lupa PIN
          storageKey: 'keuangan:auth',
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null
