/**
 * Pencarian sederhana tanpa library:
 * setiap data diubah jadi satu teks berisi semua kata kunci (catatan, nominal, tanggal dalam
 * berbagai format), lalu setiap kata yang diketik user harus ada di teks itu.
 */

function parseDate(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** "2026-11-02" -> semua cara orang biasa menulis tanggal itu */
export function dateTerms(date: string) {
  if (!date) return ''
  const d = parseDate(date)
  const day = d.getDate()
  const month = d.getMonth() + 1
  const year = d.getFullYear()
  const pad = (n: number) => String(n).padStart(2, '0')
  return [
    date,
    `${day}/${month}/${year}`,
    `${pad(day)}/${pad(month)}/${year}`,
    `${day}/${month}`,
    `${pad(day)}/${pad(month)}`,
    `${day}-${month}-${year}`,
    `${pad(day)}-${pad(month)}-${year}`,
    // "senin, 2 november 2026" dan "2 nov 2026"
    d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
  ].join(' ')
}

/** Gabungkan semua bagian jadi teks pencarian (diawali spasi supaya pencocokan awal kata bisa dicek) */
export function buildHaystack(parts: { text?: string[]; amounts?: number[]; dates?: string[] }) {
  return (
    ' ' +
    [
      ...(parts.text ?? []),
      ...(parts.amounts ?? []).map((a) => String(Math.round(a))),
      ...(parts.dates ?? []).map(dateTerms),
    ]
      .join(' ')
      .toLowerCase()
  )
}

/** Singkatan bulan sesuai format Indonesia (agustus -> agu) */
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des']
const DAY_MONTH = /(?:^|\s)(\d{1,2})\s+(jan|feb|mar|apr|mei|jun|jul|agu|agt|aug|sep|okt|oct|nov|des|dec)[a-z]*/g

/**
 * Ambil pola "tanggal bulan" (misal "5 nov", "12 desember") sebagai satu frasa utuh,
 * supaya angka 5 tidak ikut mencocokkan nominal seperti 150.000.
 */
function extractDayMonth(query: string) {
  const alias: Record<string, string> = { agt: 'agu', aug: 'agu', oct: 'okt', dec: 'des' }
  const phrases: string[] = []
  const rest = query.replace(DAY_MONTH, (_, day: string, month: string) => {
    const mon = alias[month] ?? month
    if (MONTHS.includes(mon)) phrases.push(` ${Number(day)} ${mon}`)
    return ' '
  })
  return { phrases, rest }
}

/** Pecah kata kunci. "Rp 54.000" / "54,000" -> "54000" supaya cocok dengan nominal */
function tokenize(query: string) {
  return query
    .split(/\s+/)
    .map((t) => (/^(rp)?[\d.,]+$/.test(t) ? t.replace(/[^\d]/g, '') : t))
    .filter((t) => t && t !== 'rp')
}

export function matchesSearch(haystack: string, query: string) {
  const { phrases, rest } = extractDayMonth(query.toLowerCase())
  return phrases.every((p) => haystack.includes(p)) && tokenize(rest).every((t) => haystack.includes(t))
}
