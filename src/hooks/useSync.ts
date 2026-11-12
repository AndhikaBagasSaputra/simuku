import { useCallback, useEffect, useRef, useState } from 'react'
import type { BackupData } from '../lib/backup'
import { supabase } from '../lib/supabase'
import { clearSyncStates, emptyData, getDataOwner, runSync, setDataOwner } from '../lib/sync'

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error'

export interface SyncAccount {
  /** false = alamat & kunci Supabase belum diisi */
  configured: boolean
  /** Masih memeriksa apakah sudah login */
  loading: boolean
  user: { id: string; email: string } | null
  status: SyncStatus
  /** Waktu (ISO) sinkron terakhir yang berhasil di sesi ini */
  lastSyncedAt: string | null
  error: string
  signIn: (email: string, password: string) => Promise<string | null>
  /** Mengembalikan pesan error, 'confirm' kalau email harus dikonfirmasi dulu, atau null kalau langsung masuk */
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  syncNow: () => void
}

const CHANGE_DELAY_MS = 2500
const INTERVAL_MS = 60_000

const AUTH_MESSAGES: [RegExp, string][] = [
  [/invalid login credentials/i, 'Email atau password salah'],
  [/email not confirmed/i, 'Email belum dikonfirmasi. Buka link di email dari Supabase, lalu masuk lagi.'],
  [/already registered|already been registered/i, 'Email ini sudah terdaftar. Silakan masuk.'],
  [/password should be at least/i, 'Password terlalu pendek'],
  [/rate limit|too many/i, 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.'],
  [/failed to fetch|network/i, 'Tidak ada koneksi internet'],
]

function describeError(e: unknown) {
  const message = e instanceof Error ? e.message : String((e as { message?: unknown })?.message ?? e)
  return AUTH_MESSAGES.find(([pattern]) => pattern.test(message))?.[1] ?? message
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

/** Teks status sinkron, dipakai juga di menu Lainnya */
export function describeSync(account: SyncAccount) {
  if (!account.configured) return 'Belum diatur'
  if (!account.user) return 'Belum masuk'
  if (account.status === 'syncing') return 'Menyinkronkan…'
  if (account.status === 'offline') return 'Offline, dikirim saat online lagi'
  if (account.status === 'error') return 'Sinkron gagal'
  return account.lastSyncedAt ? `Tersinkron ${formatTime(account.lastSyncedAt)}` : 'Masuk'
}

/**
 * Login + sinkron otomatis.
 * Sinkron jalan saat: baru login, data berubah, internet kembali, aplikasi dibuka lagi, dan tiap 1 menit.
 */
export function useSync(data: BackupData, replaceData: (next: BackupData) => void): SyncAccount {
  const [user, setUser] = useState<SyncAccount['user']>(null)
  const [loading, setLoading] = useState(supabase !== null)
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Nilai terbaru disimpan di ref supaya sinkron yang sedang berjalan selalu melihat data terkini
  const latest = useRef({ data, replaceData })
  useEffect(() => {
    latest.current = { data, replaceData }
  })

  const running = useRef<Promise<boolean> | null>(null)
  const queued = useRef(false)
  // true selama proses keluar: jangan sinkron lagi supaya data tidak tertarik balik
  const signingOut = useRef(false)
  const userId = user?.id ?? null

  // ----- Sesi login -----
  useEffect(() => {
    if (!supabase) return
    const client = supabase
    let active = true
    function apply(sessionUser: { id: string; email?: string } | null | undefined) {
      if (!active) return
      // Bandingkan id supaya penyegaran token tidak memicu sinkron ulang
      setUser((prev) =>
        sessionUser ? (prev?.id === sessionUser.id ? prev : { id: sessionUser.id, email: sessionUser.email ?? '' }) : null,
      )
      setLoading(false)
    }
    void client.auth.getSession().then(({ data: result }) => apply(result.session?.user))
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => apply(session?.user))
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  // ----- Sinkron -----
  /** Jalankan sinkron. Hasilnya true kalau berhasil sampai selesai. */
  const sync = useCallback((): Promise<boolean> => {
    if (!supabase || !userId || signingOut.current) return Promise.resolve(false)
    if (running.current) {
      queued.current = true // ada perubahan baru selama sinkron berjalan: ulangi setelah selesai
      return running.current
    }
    if (!navigator.onLine) {
      setStatus('offline')
      return Promise.resolve(false)
    }
    const client = supabase
    const id = userId

    const job = (async () => {
      setStatus('syncing')
      // Data di perangkat ini milik akun lain? Kosongkan dulu, lalu tarik data akun ini.
      // Data yang dicatat sebelum pernah masuk (belum ada pemilik) tetap ikut diunggah.
      let current: ReturnType<typeof emptyData> | null = null
      const owner = getDataOwner()
      if (owner && owner !== id) {
        clearSyncStates()
        current = emptyData()
        latest.current.replaceData(current)
      }
      setDataOwner(id)

      try {
        do {
          queued.current = false
          await runSync(
            client,
            id,
            () => current ?? latest.current.data,
            (next) => {
              if (current) current = next
              latest.current.replaceData(next)
            },
          )
        } while (queued.current && !signingOut.current)
        setLastSyncedAt(new Date().toISOString())
        setError('')
        setStatus('idle')
        return true
      } catch (e) {
        setError(describeError(e))
        setStatus(navigator.onLine ? 'error' : 'offline')
        return false
      } finally {
        running.current = null
      }
    })()
    running.current = job
    return job
  }, [userId])

  // Saat login, internet kembali, aplikasi dibuka lagi, dan berkala
  useEffect(() => {
    if (!userId) return
    signingOut.current = false
    const first = setTimeout(() => void sync(), 0)
    const onVisible = () => {
      if (!document.hidden) void sync()
    }
    const onOnline = () => void sync()
    const timer = setInterval(() => {
      if (!document.hidden) void sync()
    }, INTERVAL_MS)
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(first)
      clearInterval(timer)
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [userId, sync])

  // Saat data berubah (ditunda sebentar supaya beberapa perubahan beruntun dikirim sekaligus)
  const { transactions, debts, splitBills, goals, bills } = data
  useEffect(() => {
    if (!userId) return
    const timer = setTimeout(() => void sync(), CHANGE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [userId, sync, transactions, debts, splitBills, goals, bills])

  return {
    configured: supabase !== null,
    loading,
    user,
    status,
    lastSyncedAt,
    error,
    async signIn(email, password) {
      if (!supabase) return 'Sinkron belum diatur'
      try {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
        return authError ? describeError(authError) : null
      } catch (e) {
        return describeError(e)
      }
    },
    async signUp(email, password) {
      if (!supabase) return 'Sinkron belum diatur'
      try {
        const { data: result, error: authError } = await supabase.auth.signUp({ email, password })
        if (authError) return describeError(authError)
        return result.session ? null : 'confirm'
      } catch (e) {
        return describeError(e)
      }
    },
    async signOut() {
      // Kirim dulu perubahan terakhir supaya tidak ada yang hilang
      const synced = await sync()
      if (
        !synced &&
        !window.confirm(
          'Perubahan terakhir belum terkirim ke akun (mungkin sedang offline). Kalau tetap keluar, perubahan itu hilang dari perangkat ini. Tetap keluar?',
        )
      ) {
        return
      }
      signingOut.current = true
      await running.current
      await supabase?.auth.signOut({ scope: 'local' })
      // Data sudah aman di akun: bersihkan dari perangkat ini supaya tidak terbawa ke akun lain
      clearSyncStates()
      setDataOwner(null)
      latest.current.replaceData(emptyData())
      setStatus('idle')
      setError('')
      setLastSyncedAt(null)
    },
    syncNow: () => void sync(),
  }
}
