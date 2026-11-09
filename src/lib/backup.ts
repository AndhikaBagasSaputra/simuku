import type { Debt, RecurringBill, SavingsGoal, SplitBill, Transaction } from '../types'
import { downloadBlob } from './download'
import { todayISO } from './format'

/** Penanda supaya file backup aplikasi lain ditolak */
const BACKUP_APP = 'keuangan'
/** Naikkan angka ini kalau struktur data berubah, supaya file lama bisa dikenali */
const BACKUP_VERSION = 1
const LAST_BACKUP_KEY = 'keuangan:last-backup'
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

export interface BackupData {
  transactions: Transaction[]
  debts: Debt[]
  splitBills: SplitBill[]
  goals: SavingsGoal[]
  bills: RecurringBill[]
}

export interface BackupFile {
  app: typeof BACKUP_APP
  version: number
  exportedAt: string
  data: BackupData
}

export type BackupKey = keyof BackupData

export const BACKUP_LABELS: Record<BackupKey, string> = {
  transactions: 'Transaksi',
  debts: 'Hutang & piutang',
  splitBills: 'Split bill',
  goals: 'Target tabungan',
  bills: 'Tagihan rutin',
}

const KEYS = Object.keys(BACKUP_LABELS) as BackupKey[]

export function countData(data: BackupData) {
  return Object.fromEntries(KEYS.map((k) => [k, data[k].length])) as Record<BackupKey, number>
}

// ===== Backup =====

export function getLastBackup(): string | null {
  try {
    return localStorage.getItem(LAST_BACKUP_KEY)
  } catch {
    return null
  }
}

export function downloadBackup(data: BackupData) {
  const file: BackupFile = { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), data }
  downloadBlob(
    new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }),
    `keuangan-backup-${todayISO()}.json`,
  )
  try {
    localStorage.setItem(LAST_BACKUP_KEY, file.exportedAt)
  } catch {
    // abaikan
  }
}

// ===== Restore: periksa isi file sebelum dipakai =====

type Rec = Record<string, unknown>
const isObj = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v)
const isStr = (v: unknown) => typeof v === 'string'
const isDate = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
const isAmount = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0

/** Syarat minimal tiap jenis data supaya aplikasi tidak error saat menampilkannya */
const VALIDATORS: Record<BackupKey, (item: Rec) => boolean> = {
  transactions: (t) =>
    isStr(t.id) && (t.type === 'income' || t.type === 'expense') && isAmount(t.amount) && isDate(t.date) && isStr(t.categoryId),
  debts: (d) =>
    isStr(d.id) &&
    (d.direction === 'owed_to_me' || d.direction === 'i_owe') &&
    isStr(d.person) &&
    isAmount(d.amount) &&
    isDate(d.date) &&
    Array.isArray(d.payments),
  splitBills: (b) =>
    isStr(b.id) && isStr(b.title) && isDate(b.date) && Array.isArray(b.participants) && Array.isArray(b.items) && isObj(b.links),
  goals: (g) => isStr(g.id) && isStr(g.name) && isAmount(g.target) && Array.isArray(g.entries),
  bills: (b) => isStr(b.id) && isStr(b.name) && isAmount(b.amount) && isDate(b.firstDueDate) && Array.isArray(b.payments),
}

export type ParseResult = { ok: true; file: BackupFile } | { ok: false; error: string }

export async function readBackupFile(file: File): Promise<ParseResult> {
  if (file.size > MAX_FILE_SIZE) return { ok: false, error: 'File terlalu besar untuk sebuah backup.' }
  let json: unknown
  try {
    json = JSON.parse(await file.text())
  } catch {
    return { ok: false, error: 'File tidak bisa dibaca. Pastikan memilih file backup (.json) dari aplikasi ini.' }
  }

  if (!isObj(json) || json.app !== BACKUP_APP || !isObj(json.data)) {
    return { ok: false, error: 'Ini bukan file backup aplikasi Keuangan.' }
  }
  if (typeof json.version !== 'number' || json.version > BACKUP_VERSION) {
    return { ok: false, error: 'File backup ini dibuat oleh versi aplikasi yang lebih baru.' }
  }

  const data = json.data
  for (const key of KEYS) {
    const list = data[key] ?? []
    if (!Array.isArray(list)) return { ok: false, error: `Bagian "${BACKUP_LABELS[key]}" di file rusak.` }
    const bad = list.filter((item) => !isObj(item) || !VALIDATORS[key](item)).length
    if (bad > 0) return { ok: false, error: `${bad} data ${BACKUP_LABELS[key].toLowerCase()} di file rusak atau tidak lengkap.` }
  }

  return {
    ok: true,
    file: {
      app: BACKUP_APP,
      version: json.version,
      exportedAt: isStr(json.exportedAt) ? (json.exportedAt as string) : '',
      data: Object.fromEntries(KEYS.map((k) => [k, data[k] ?? []])) as unknown as BackupData,
    },
  }
}

/** Gabungkan: tambahkan data dari backup yang id-nya belum ada di data sekarang */
export function mergeData(current: BackupData, incoming: BackupData): BackupData {
  const merge = <T extends { id: string }>(a: T[], b: T[]) => {
    const ids = new Set(a.map((x) => x.id))
    return [...a, ...b.filter((x) => !ids.has(x.id))]
  }
  return {
    transactions: merge(current.transactions, incoming.transactions),
    debts: merge(current.debts, incoming.debts),
    splitBills: merge(current.splitBills, incoming.splitBills),
    goals: merge(current.goals, incoming.goals),
    bills: merge(current.bills, incoming.bills),
  }
}
