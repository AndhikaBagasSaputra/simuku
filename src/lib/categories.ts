import type { Category, TransactionType } from '../types'

/**
 * Palet grafik (sudah divalidasi aman untuk buta warna).
 * Urutan warna sengaja dibuat tetap, jangan diacak.
 */
export const CHART_COLORS = [
  '#2a78d6', // biru
  '#eb6834', // oranye
  '#1baf7a', // hijau tosca
  '#eda100', // kuning
  '#e87ba4', // magenta
  '#008300', // hijau
  '#6250d6', // ungu
  '#e34948', // merah
]

export const CATEGORIES: Category[] = [
  // Pengeluaran
  { id: 'makan', name: 'Makan & Minum', icon: '🍔', type: 'expense', color: CHART_COLORS[0] },
  { id: 'transportasi', name: 'Transportasi', icon: '🚗', type: 'expense', color: CHART_COLORS[1] },
  { id: 'belanja', name: 'Belanja', icon: '🛍️', type: 'expense', color: CHART_COLORS[2] },
  { id: 'tagihan', name: 'Tagihan', icon: '🧾', type: 'expense', color: CHART_COLORS[3] },
  { id: 'hiburan', name: 'Hiburan', icon: '🎮', type: 'expense', color: CHART_COLORS[4] },
  { id: 'kesehatan', name: 'Kesehatan', icon: '💊', type: 'expense', color: CHART_COLORS[5] },
  { id: 'pendidikan', name: 'Pendidikan', icon: '📚', type: 'expense', color: CHART_COLORS[6] },
  { id: 'lainnya-keluar', name: 'Lainnya', icon: '📦', type: 'expense', color: CHART_COLORS[7] },
  // Pemasukan
  { id: 'gaji', name: 'Gaji', icon: '💼', type: 'income', color: CHART_COLORS[0] },
  { id: 'bonus', name: 'Bonus', icon: '🎁', type: 'income', color: CHART_COLORS[1] },
  { id: 'freelance', name: 'Freelance', icon: '💻', type: 'income', color: CHART_COLORS[2] },
  { id: 'investasi', name: 'Investasi', icon: '📈', type: 'income', color: CHART_COLORS[3] },
  { id: 'lainnya-masuk', name: 'Lainnya', icon: '💰', type: 'income', color: CHART_COLORS[4] },
]

export function getCategoriesByType(type: TransactionType) {
  return CATEGORIES.filter((c) => c.type === type)
}

export function getCategory(id: string): Category {
  return (
    CATEGORIES.find((c) => c.id === id) ?? {
      id,
      name: 'Tanpa kategori',
      icon: '❔',
      type: 'expense',
      color: '#898781',
    }
  )
}
