/**
 * Simpan/ambil data dari localStorage dengan aman.
 * (Nanti diganti Supabase saat fitur login dibuat.)
 */
export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Penyimpanan browser penuh / diblokir: abaikan
  }
}
