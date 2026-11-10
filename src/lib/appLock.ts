/**
 * Kunci aplikasi dengan PIN.
 * Ini kunci layar, bukan enkripsi: data tetap tersimpan apa adanya di browser.
 * PIN tidak pernah disimpan, hanya hasil hash-nya (PBKDF2 + salt acak).
 */
import { loadFromStorage, saveToStorage, storageKeys } from './storage'

const LOCK_KEY = 'keuangan:lock'
const ATTEMPTS_KEY = 'keuangan:lock-attempts'
/** Pengaturan yang tetap disimpan walau data dihapus karena lupa PIN */
const KEEP_ON_WIPE = ['keuangan:theme']

export const PIN_LENGTH = 6
export const DEFAULT_TIMEOUT_MIN = 5
/** Salah sebanyak ini = harus menunggu dulu */
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 30_000

export const TIMEOUT_OPTIONS = [
  { value: 0, label: 'Langsung' },
  { value: 1, label: '1 menit' },
  { value: 5, label: '5 menit' },
  { value: 15, label: '15 menit' },
  { value: 30, label: '30 menit' },
]

export interface LockConfig {
  salt: string
  hash: string
  /** Menit ditinggal sebelum terkunci lagi. 0 = langsung saat aplikasi ditinggal */
  timeoutMin: number
}

export function getLockConfig(): LockConfig | null {
  const raw = loadFromStorage<Partial<LockConfig> | null>(LOCK_KEY, null)
  if (!raw || typeof raw.salt !== 'string' || typeof raw.hash !== 'string') return null
  return {
    salt: raw.salt,
    hash: raw.hash,
    timeoutMin: typeof raw.timeoutMin === 'number' ? raw.timeoutMin : DEFAULT_TIMEOUT_MIN,
  }
}

function toHex(bytes: Uint8Array) {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function fromHex(hex: string) {
  return new Uint8Array((hex.match(/../g) ?? []).map((h) => parseInt(h, 16)))
}

async function hashPin(pin: string, saltHex: string) {
  // crypto.subtle hanya ada di halaman aman (https atau localhost)
  if (!globalThis.crypto?.subtle) throw new Error('Kunci PIN butuh koneksi aman (https)')
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations: 150_000 },
    key,
    256,
  )
  return toHex(new Uint8Array(bits))
}

/** Pasang PIN baru (atau ganti yang lama). Jeda kunci otomatis yang sudah ada dipertahankan */
export async function savePin(pin: string): Promise<LockConfig> {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)))
  const config: LockConfig = {
    salt,
    hash: await hashPin(pin, salt),
    timeoutMin: getLockConfig()?.timeoutMin ?? DEFAULT_TIMEOUT_MIN,
  }
  saveToStorage(LOCK_KEY, config)
  clearFailures()
  return config
}

export async function checkPin(pin: string) {
  const config = getLockConfig()
  if (!config) return true
  return (await hashPin(pin, config.salt)) === config.hash
}

export function saveTimeout(timeoutMin: number): LockConfig | null {
  const config = getLockConfig()
  if (!config) return null
  const next = { ...config, timeoutMin }
  saveToStorage(LOCK_KEY, next)
  return next
}

export function removeLock() {
  try {
    localStorage.removeItem(LOCK_KEY)
    localStorage.removeItem(ATTEMPTS_KEY)
  } catch {
    // abaikan kalau penyimpanan diblokir
  }
}

// ----- Batas percobaan salah -----

interface Attempts {
  count: number
  /** Waktu (ms) sampai boleh mencoba lagi */
  until: number
}

function getAttempts(): Attempts {
  const raw = loadFromStorage<Partial<Attempts>>(ATTEMPTS_KEY, {})
  return { count: Number(raw.count) || 0, until: Number(raw.until) || 0 }
}

/** Waktu (ms) sampai boleh mencoba lagi. 0 = boleh sekarang */
export function getLockoutUntil() {
  const { until } = getAttempts()
  return until > Date.now() ? until : 0
}

/** Catat PIN salah. Mengembalikan sisa percobaan sebelum harus menunggu (0 = sekarang harus menunggu) */
export function registerFailure() {
  const count = getAttempts().count + 1
  const mustWait = count >= MAX_ATTEMPTS
  // Setelah batas terlewati, setiap salah berikutnya langsung menunggu lagi
  saveToStorage(ATTEMPTS_KEY, { count, until: mustWait ? Date.now() + LOCKOUT_MS : 0 })
  return mustWait ? 0 : MAX_ATTEMPTS - count
}

export function clearFailures() {
  try {
    localStorage.removeItem(ATTEMPTS_KEY)
  } catch {
    // abaikan
  }
}

/** Lupa PIN: hapus semua data aplikasi di perangkat ini, termasuk PIN-nya */
export function wipeAllData() {
  try {
    for (const key of storageKeys('keuangan:')) {
      if (!KEEP_ON_WIPE.includes(key)) localStorage.removeItem(key)
    }
  } catch {
    // abaikan
  }
}
