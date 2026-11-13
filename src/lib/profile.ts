/**
 * Nama tampilan pengguna (misalnya "Andhika").
 * Disimpan di perangkat supaya bisa dipakai tanpa login, dan di akun Supabase (user metadata)
 * supaya ikut ke perangkat lain.
 */
const NAME_KEY = 'keuangan:display-name'
export const MAX_NAME_LENGTH = 30

export function loadDisplayName() {
  try {
    return localStorage.getItem(NAME_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveDisplayName(name: string) {
  try {
    if (name) localStorage.setItem(NAME_KEY, name)
    else localStorage.removeItem(NAME_KEY)
  } catch {
    // abaikan kalau penyimpanan diblokir
  }
}

export function cleanName(name: string) {
  return name.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH)
}
