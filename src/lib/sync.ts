/**
 * Sinkron data antara perangkat ini dan Supabase.
 *
 * Data tetap disimpan lokal (aplikasi tetap bisa dipakai offline). Untuk tiap akun disimpan
 * "bayangan": sidik data terakhir yang sudah sama dengan server. Selisih antara data sekarang
 * dan bayangan = perubahan lokal yang belum terkirim.
 *
 * Urutan sinkron: kirim perubahan lokal dulu, lalu tarik perubahan dari server.
 * Kalau data yang sama diubah di dua perangkat, yang sinkron terakhir yang menang.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { BackupData, BackupKey } from './backup'
import { loadFromStorage, saveToStorage, storageKeys } from './storage'

const TABLE = 'items'
const PAGE_SIZE = 1000
const PUSH_CHUNK = 500
/** Tarik ulang sedikit ke belakang, jaga-jaga ada perubahan yang tersimpan hampir bersamaan */
const PULL_OVERLAP_MS = 30_000
const STATE_PREFIX = 'keuangan:sync:'

/** Kunci penyimpanan lokal tiap jenis data (harus sama dengan yang dipakai di hooks) */
const DATA_KEYS: Record<BackupKey, string> = {
  transactions: 'keuangan:transactions',
  debts: 'keuangan:debts',
  splitBills: 'keuangan:split-bills',
  goals: 'keuangan:savings',
  bills: 'keuangan:recurring-bills',
}
const COLLECTIONS = Object.keys(DATA_KEYS) as BackupKey[]

type Item = { id: string }
type Shadow = Record<BackupKey, Record<string, string>>

interface SyncState {
  /** updated_at terakhir yang sudah ditarik dari server */
  cursor: string | null
  /** Sidik tiap data yang sudah sama dengan server: jenis -> id -> sidik */
  shadow: Shadow
}

interface RemoteRow {
  collection: string
  id: string
  data: Item | null
  deleted: boolean
  updated_at: string
}

export interface SyncResult {
  pushed: number
  pulled: number
}

function emptyShadow(): Shadow {
  return { transactions: {}, debts: {}, splitBills: {}, goals: {}, bills: {} }
}

function loadState(userId: string): SyncState {
  const raw = loadFromStorage<Partial<SyncState>>(STATE_PREFIX + userId, {})
  return {
    cursor: typeof raw.cursor === 'string' ? raw.cursor : null,
    shadow: { ...emptyShadow(), ...(raw.shadow ?? {}) },
  }
}

function saveState(userId: string, state: SyncState) {
  saveToStorage(STATE_PREFIX + userId, state)
}

/** JSON dengan urutan kunci tetap, supaya data yang sama selalu menghasilkan teks yang sama */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const obj = value as Record<string, unknown>
  const parts: string[] = []
  for (const k of Object.keys(obj).sort()) {
    if (obj[k] !== undefined) parts.push(`${JSON.stringify(k)}:${stableStringify(obj[k])}`)
  }
  return `{${parts.join(',')}}`
}

/** Sidik pendek dari sebuah data (cyrb53), cukup untuk tahu "berubah atau tidak" */
function fingerprint(item: unknown) {
  const text = stableStringify(item)
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

/**
 * Pengaman, dipanggil sekali sebelum aplikasi tampil.
 * Kalau data lokal hilang (penyimpanan browser dibersihkan sebagian) tapi bayangannya masih ada,
 * selisihnya akan terbaca sebagai "semua dihapus" dan ikut terhapus di server.
 * Jadi dalam keadaan itu bayangan dibuang: sinkron berikutnya menarik ulang semuanya.
 */
export function prepareSyncStorage() {
  try {
    const dataMissing = Object.values(DATA_KEYS).some((key) => localStorage.getItem(key) === null)
    if (!dataMissing) return
    for (const key of storageKeys(STATE_PREFIX)) localStorage.removeItem(key)
  } catch {
    // abaikan kalau penyimpanan diblokir
  }
}

function isCollection(value: string): value is BackupKey {
  return (COLLECTIONS as string[]).includes(value)
}

export async function runSync(
  client: SupabaseClient,
  userId: string,
  /** Ambil data terbaru (bisa berubah selama sinkron berjalan) */
  getData: () => BackupData,
  applyData: (next: BackupData) => void,
): Promise<SyncResult> {
  const state = loadState(userId)

  // ===== 1. Kirim perubahan lokal =====
  const snapshot = getData()
  const upserts: { user_id: string; collection: BackupKey; id: string; data: Item; deleted: false }[] = []
  const deletes: { user_id: string; collection: BackupKey; id: string; deleted: true }[] = []
  const sent: { collection: BackupKey; id: string; print: string | null }[] = []

  for (const collection of COLLECTIONS) {
    const shadow = state.shadow[collection]
    const present = new Set<string>()
    for (const item of snapshot[collection] as Item[]) {
      present.add(item.id)
      const print = fingerprint(item)
      if (shadow[item.id] === print) continue
      upserts.push({ user_id: userId, collection, id: item.id, data: item, deleted: false })
      sent.push({ collection, id: item.id, print })
    }
    for (const id of Object.keys(shadow)) {
      if (present.has(id)) continue
      // Hanya ditandai terhapus; isi datanya dibiarkan di server sebagai cadangan
      deletes.push({ user_id: userId, collection, id, deleted: true })
      sent.push({ collection, id, print: null })
    }
  }

  for (let i = 0; i < upserts.length; i += PUSH_CHUNK) {
    const { error } = await client.from(TABLE).upsert(upserts.slice(i, i + PUSH_CHUNK))
    if (error) throw error
  }
  for (let i = 0; i < deletes.length; i += PUSH_CHUNK) {
    const { error } = await client.from(TABLE).upsert(deletes.slice(i, i + PUSH_CHUNK))
    if (error) throw error
  }

  for (const s of sent) {
    if (s.print === null) delete state.shadow[s.collection][s.id]
    else state.shadow[s.collection][s.id] = s.print
  }
  if (sent.length) saveState(userId, state)

  // ===== 2. Tarik perubahan dari server =====
  const since = state.cursor ? new Date(new Date(state.cursor).getTime() - PULL_OVERLAP_MS).toISOString() : null
  const rows: RemoteRow[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    let query = client
      .from(TABLE)
      .select('collection,id,data,deleted,updated_at')
      .order('updated_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
    if (since) query = query.gt('updated_at', since)
    const { data, error } = await query
    if (error) throw error
    rows.push(...((data ?? []) as RemoteRow[]))
    if (!data || data.length < PAGE_SIZE) break
  }

  // Terapkan ke data TERBARU, bukan ke salinan di awal: user bisa saja mengubah sesuatu selama menunggu
  const current = getData()
  const maps = Object.fromEntries(
    COLLECTIONS.map((c) => [c, new Map((current[c] as Item[]).map((item) => [item.id, item]))]),
  ) as Record<BackupKey, Map<string, Item>>
  let pulled = 0

  for (const row of rows) {
    if (!isCollection(row.collection)) continue
    const shadow = state.shadow[row.collection]
    const map = maps[row.collection]
    const local = map.get(row.id)
    const localPrint = local ? fingerprint(local) : undefined
    // Berubah di perangkat ini sejak sinkron terakhir -> jangan ditimpa, nanti dikirim
    const dirty = localPrint !== shadow[row.id]

    if (row.deleted || !row.data) {
      if (!local) {
        delete shadow[row.id]
      } else if (!dirty) {
        map.delete(row.id)
        delete shadow[row.id]
        pulled++
      }
      continue
    }

    const remotePrint = fingerprint(row.data)
    if (localPrint === remotePrint) {
      shadow[row.id] = remotePrint
    } else if (!dirty) {
      map.set(row.id, row.data)
      shadow[row.id] = remotePrint
      pulled++
    }
  }

  if (rows.length) state.cursor = rows[rows.length - 1].updated_at
  if (pulled) {
    applyData(Object.fromEntries(COLLECTIONS.map((c) => [c, [...maps[c].values()]])) as unknown as BackupData)
  }
  saveState(userId, state)

  return { pushed: sent.length, pulled }
}
