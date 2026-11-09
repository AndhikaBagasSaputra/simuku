import { addDays, addMonths, formatMonth, formatShortDate, todayISO, toMonthKey } from './format'

export type PresetId = 'month' | '7d' | '14d' | '30d' | '3m' | '6m' | 'year' | 'all' | 'custom'

export interface Period {
  preset: PresetId
  /** Dipakai saat preset = 'month' (format YYYY-MM) */
  month: string
  /** Dipakai saat preset = 'custom' (format YYYY-MM-DD) */
  start: string
  end: string
}

/** null = tanpa batas */
export interface DateRange {
  start: string | null
  end: string | null
}

export const PRESETS: { id: PresetId; label: string }[] = [
  { id: 'month', label: 'Per bulan' },
  { id: '7d', label: '7 hari terakhir' },
  { id: '14d', label: '2 minggu terakhir' },
  { id: '30d', label: '30 hari terakhir' },
  { id: '3m', label: '3 bulan terakhir' },
  { id: '6m', label: '6 bulan terakhir' },
  { id: 'year', label: 'Tahun ini' },
  { id: 'all', label: 'Semua' },
  { id: 'custom', label: 'Pilih tanggal sendiri' },
]

export function defaultPeriod(): Period {
  const today = todayISO()
  return { preset: 'month', month: toMonthKey(today), start: addDays(today, -6), end: today }
}

/** Ubah pilihan periode menjadi rentang tanggal (inklusif) */
export function getRange(period: Period): DateRange {
  const today = todayISO()
  switch (period.preset) {
    case 'month':
      // "YYYY-MM-31" aman untuk perbandingan string di semua bulan
      return { start: `${period.month}-01`, end: `${period.month}-31` }
    case '7d':
      return { start: addDays(today, -6), end: today }
    case '14d':
      return { start: addDays(today, -13), end: today }
    case '30d':
      return { start: addDays(today, -29), end: today }
    case '3m':
      return { start: addDays(addMonths(today, -3), 1), end: today }
    case '6m':
      return { start: addDays(addMonths(today, -6), 1), end: today }
    case 'year':
      return { start: `${today.slice(0, 4)}-01-01`, end: `${today.slice(0, 4)}-12-31` }
    case 'all':
      return { start: null, end: null }
    case 'custom': {
      const [start, end] = [period.start, period.end].sort()
      return { start, end }
    }
  }
}

export function isInRange(date: string, range: DateRange) {
  return (!range.start || date >= range.start) && (!range.end || date <= range.end)
}

/** Teks rentang, misalnya "27 Okt 2026 – 9 Nov 2026" */
export function describeRange(period: Period) {
  if (period.preset === 'month') return formatMonth(period.month)
  if (period.preset === 'all') return 'Semua transaksi'
  const { start, end } = getRange(period)
  if (!start || !end) return ''
  return start === end ? formatShortDate(start) : `${formatShortDate(start)} – ${formatShortDate(end)}`
}

export function getPresetLabel(preset: PresetId) {
  return PRESETS.find((p) => p.id === preset)?.label ?? ''
}

/** Bulan terakhir di periode ini (untuk grafik tren) */
export function getEndMonth(period: Period) {
  if (period.preset === 'month') return period.month
  const { end } = getRange(period)
  const today = todayISO()
  return toMonthKey(end && end < today ? end : today)
}
