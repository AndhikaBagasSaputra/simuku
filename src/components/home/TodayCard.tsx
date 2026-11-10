import { formatRupiah, formatShortDate, todayISO } from '../../lib/format'
import type { Transaction } from '../../types'

interface Props {
  /** Semua transaksi: kartu ini tidak ikut periode yang dipilih */
  transactions: Transaction[]
}

/** Ringkasan pemasukan & pengeluaran khusus hari ini */
export function TodayCard({ transactions }: Props) {
  const today = todayISO()
  let income = 0
  let expense = 0
  let count = 0
  for (const t of transactions) {
    if (t.date !== today) continue
    count++
    if (t.type === 'income') income += t.amount
    else expense += t.amount
  }

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-semibold text-slate-800">Hari ini</h2>
        <span className="text-xs text-slate-500">
          {formatShortDate(today)} · {count ? `${count} transaksi` : 'belum ada transaksi'}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="min-w-0 rounded-xl bg-emerald-50 p-3">
          <p className="text-xs text-slate-600">⬇ Pemasukan</p>
          <p className="mt-0.5 truncate font-semibold text-emerald-700">{formatRupiah(income)}</p>
        </div>
        <div className="min-w-0 rounded-xl bg-rose-50 p-3">
          <p className="text-xs text-slate-600">⬆ Pengeluaran</p>
          <p className="mt-0.5 truncate font-semibold text-rose-600">{formatRupiah(expense)}</p>
        </div>
      </div>
    </section>
  )
}
