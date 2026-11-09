const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

/** 50000 -> "Rp 50.000" */
export function formatRupiah(amount: number) {
  return rupiahFormatter.format(amount)
}

const compactFormatter = new Intl.NumberFormat('id-ID', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

/** 1500000 -> "1,5 jt" (untuk sumbu grafik) */
export function formatCompact(amount: number) {
  return compactFormatter.format(amount)
}

/** 50000 -> "50.000" (untuk input nominal) */
export function formatNumber(amount: number) {
  return amount.toLocaleString('id-ID')
}

/** "2026-11-09" -> Date (zona waktu lokal, bukan UTC) */
function parseDate(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Date -> "2026-11-09" */
function toISODate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayISO() {
  return toISODate(new Date())
}

/** "2026-11-09" -> "Senin, 9 Nov 2026" */
export function formatDate(date: string) {
  return parseDate(date).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** "2026-11-09" -> "2026-11" */
export function toMonthKey(date: string) {
  return date.slice(0, 7)
}

/** "2026-11" -> "November 2026" */
export function formatMonth(monthKey: string) {
  return parseDate(`${monthKey}-01`).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  })
}

/** "2026-11" -> "Nov" */
export function formatMonthShort(monthKey: string) {
  return parseDate(`${monthKey}-01`).toLocaleDateString('id-ID', { month: 'short' })
}

/** "2026-11-09" -> "9 Nov 2026" */
export function formatShortDate(date: string) {
  return parseDate(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Selisih hari: ("2026-11-09", "2026-11-12") -> 3 */
export function daysBetween(from: string, to: string) {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86_400_000)
}

/** Tambah/kurangi hari: ("2026-11-09", -6) -> "2026-11-03" */
export function addDays(date: string, days: number) {
  const d = parseDate(date)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** Tambah/kurangi bulan, aman untuk tanggal 31: ("2026-03-31", -1) -> "2026-02-28" */
export function addMonths(date: string, months: number) {
  const d = parseDate(date)
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + months)
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, lastDay))
  return toISODate(d)
}

/** Geser bulan: ("2026-11", -1) -> "2026-10" */
export function shiftMonth(monthKey: string, delta: number) {
  const date = parseDate(`${monthKey}-01`)
  date.setMonth(date.getMonth() + delta)
  return toMonthKey(toISODate(date))
}
