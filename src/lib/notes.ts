/**
 * Catatan transaksi: pengelompokan untuk rincian laporan, dan daftar saran saat mengetik.
 * Catatan dianggap sama walau beda huruf besar/kecil atau spasi berlebih.
 */
import type { Transaction } from '../types'

export function cleanNote(note: string) {
  return note.replace(/\s+/g, ' ').trim()
}

export function noteKey(note: string) {
  return cleanNote(note).toLowerCase()
}

export interface NoteGroup {
  /** Kunci pengelompokan ('' = tanpa catatan) */
  key: string
  /** Tulisan yang paling sering dipakai untuk catatan ini */
  label: string
  count: number
  amount: number
  ids: string[]
  /** Transaksi yang boleh diganti catatannya (bukan dari tagihan, hutang, atau split bill) */
  editableIds: string[]
  /** Semua tulisan asli catatan di kelompok ini (bisa beda huruf besar/kecil atau spasi) */
  rawNotes: string[]
}

/** Kelompokkan transaksi berdasarkan catatannya, nominal terbesar di atas, "tanpa catatan" paling bawah */
export function groupByNote(transactions: Transaction[]): NoteGroup[] {
  const groups = new Map<string, NoteGroup & { spellings: Map<string, number> }>()
  for (const t of transactions) {
    const key = noteKey(t.note)
    const g = groups.get(key) ?? { key, label: '', count: 0, amount: 0, ids: [] as string[], editableIds: [] as string[], rawNotes: [] as string[], spellings: new Map<string, number>() }
    g.count++
    g.amount += t.amount
    g.ids.push(t.id)
    // Transaksi otomatis diatur lewat induknya; kalau diubah di sini akan tertimpa lagi
    const linked = Boolean(t.recurringBillId || t.debtId || t.splitBillId)
    if (!linked) {
      g.editableIds.push(t.id)
      if (!g.rawNotes.includes(t.note)) g.rawNotes.push(t.note)
    }
    const spelled = cleanNote(t.note)
    g.spellings.set(spelled, (g.spellings.get(spelled) ?? 0) + 1)
    groups.set(key, g)
  }
  return [...groups.values()]
    .map(({ spellings, ...g }) => ({ ...g, label: [...spellings.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '' }))
    .sort((a, b) => (a.key === '') !== (b.key === '') ? (a.key === '' ? 1 : -1) : b.amount - a.amount)
}

/** Catatan yang pernah dipakai, paling sering di atas (untuk saran saat mengetik) */
export function noteSuggestions(transactions: Transaction[], limit = 60) {
  return groupByNote(transactions)
    .filter((g) => g.key !== '')
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((g) => g.label)
}
