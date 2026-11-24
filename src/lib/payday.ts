/**
 * Periode gajian: gaji masuk tiap tanggal 28; kalau tanggal 28 jatuh di Sabtu, Minggu, atau hari libur
 * nasional / cuti bersama, gajian dimajukan ke hari kerja sebelumnya.
 *
 * "Periode November" = dari gajian Oktober sampai sehari sebelum gajian November.
 * Kalau gaji sudah dicatat (kategori Gaji), tanggal sebenarnya yang dipakai, bukan perkiraan.
 *
 * Sengaja tanpa import supaya logika yang sama bisa disalin ke server (api/push.ts).
 */

export const PAYDAY_DATE = 28
export const SALARY_CATEGORY = 'gaji'

/**
 * Libur nasional & cuti bersama (SKB 3 Menteri). Perbarui tiap tahun setelah SKB tahun berikutnya terbit.
 * 2026: setneg.go.id (SKB 19 Sep 2025) · 2027: SKB 15 Sep 2026 (detik.com, mengutip Kemenko PMK)
 */
export const HOLIDAYS = new Set([
  // 2025 (hanya akhir tahun, untuk periode Januari 2026)
  '2025-12-25', '2025-12-26',
  // 2026
  '2026-01-01', '2026-01-16', '2026-02-16', '2026-02-17', '2026-03-18', '2026-03-19', '2026-03-20',
  '2026-03-21', '2026-03-22', '2026-03-23', '2026-03-24', '2026-04-03', '2026-04-05', '2026-05-01',
  '2026-05-14', '2026-05-15', '2026-05-27', '2026-05-28', '2026-05-31', '2026-06-01', '2026-06-16',
  '2026-08-17', '2026-08-25', '2026-12-24', '2026-12-25',
  // 2027
  '2027-01-01', '2027-01-05', '2027-02-05', '2027-02-06', '2027-03-08', '2027-03-09', '2027-03-10',
  '2027-03-11', '2027-03-12', '2027-03-15', '2027-03-25', '2027-03-26', '2027-03-28', '2027-05-01',
  '2027-05-06', '2027-05-17', '2027-05-18', '2027-05-19', '2027-05-20', '2027-06-01', '2027-06-06',
  '2027-08-15', '2027-08-17', '2027-12-24', '2027-12-25', '2027-12-26',
])

const DAY_MS = 86_400_000

function parse(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}
function iso(ms: number) {
  return new Date(ms).toISOString().slice(0, 10)
}
export function shiftDays(date: string, days: number) {
  return iso(parse(date) + days * DAY_MS)
}
/** "2026-11" + n bulan */
export function shiftCycle(monthKey: string, n: number) {
  const [y, m] = monthKey.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + n, 1))
  return d.toISOString().slice(0, 7)
}
export function isDayOff(date: string) {
  const day = new Date(parse(date)).getUTCDay()
  return day === 0 || day === 6 || HOLIDAYS.has(date)
}

/** Perkiraan tanggal gajian di bulan tertentu (YYYY-MM) */
export function expectedPayday(monthKey: string) {
  let date = `${monthKey}-${PAYDAY_DATE}`
  while (isDayOff(date)) date = shiftDays(date, -1)
  return date
}

/** Tanggal-tanggal gaji yang sudah dicatat (pemasukan berkategori Gaji), urut */
export function salaryDatesOf(transactions: { type: string; categoryId: string; date: string }[]) {
  return transactions
    .filter((t) => t.type === 'income' && t.categoryId === SALARY_CATEGORY)
    .map((t) => t.date)
    .sort()
}

/**
 * Tanggal gajian sebenarnya kalau gaji bulan itu sudah dicatat, kalau belum pakai perkiraan.
 * Kalau ada beberapa pemasukan Gaji di sekitar tanggal gajian (misalnya bonus atau kerja sampingan),
 * yang dipakai adalah yang paling dekat dengan perkiraan.
 */
export function paydayOf(monthKey: string, salaryDates: readonly string[] = []) {
  const expected = expectedPayday(monthKey)
  const from = shiftDays(expected, -10)
  const to = shiftDays(expected, 5)
  let best: string | null = null
  let bestGap = Infinity
  for (const d of salaryDates) {
    if (d < from || d > to) continue
    const gap = Math.abs(parse(d) - parse(expected))
    if (gap < bestGap) {
      best = d
      bestGap = gap
    }
  }
  return best ?? expected
}

/** Rentang periode gajian (inklusif). Kunci = bulan gajian yang menutup periode */
export function cycleRange(monthKey: string, salaryDates: readonly string[] = []) {
  return {
    start: paydayOf(shiftCycle(monthKey, -1), salaryDates),
    end: shiftDays(paydayOf(monthKey, salaryDates), -1),
  }
}

/** Periode gajian yang memuat tanggal tertentu (juga saat gaji masuk lebih awal atau terlambat) */
export function cycleOf(date: string, salaryDates: readonly string[] = []) {
  const month = date.slice(0, 7)
  for (const key of [month, shiftCycle(month, 1), shiftCycle(month, -1), shiftCycle(month, 2)]) {
    const { start, end } = cycleRange(key, salaryDates)
    if (date >= start && date <= end) return key
  }
  return month
}

/** Selisih dua kunci periode dalam bulan (b - a) */
export function cycleDistance(a: string, b: string) {
  const [ya, ma] = a.split('-').map(Number)
  const [yb, mb] = b.split('-').map(Number)
  return (yb - ya) * 12 + (mb - ma)
}

/** Hari menuju gajian berikutnya dari tanggal tertentu */
export function daysUntilPayday(today: string, salaryDates: readonly string[] = []) {
  const next = paydayOf(cycleOf(today, salaryDates), salaryDates)
  return Math.round((parse(next) - parse(today)) / DAY_MS)
}
