import { formatRupiah, formatShortDate, todayISO } from '../../lib/format'
import type { Transaction } from '../../types'

interface Props {
  /** Semua transaksi: baris ini tidak ikut periode yang dipilih */
  transactions: Transaction[]
}

/** Ringkasan hari ini dalam satu baris: cukup untuk memastikan catatan barusan sudah masuk */
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
    <section className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-sm">
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold text-slate-800">Hari ini</h2>
        <p className="truncate text-xs text-slate-500">
          {formatShortDate(today)} · {count ? `${count} transaksi` : 'belum ada transaksi'}
        </p>
      </div>
      {count > 0 && (
        <div className="shrink-0 text-right text-sm font-semibold tabular-nums">
          {income > 0 && <p className="text-emerald-700">+{formatRupiah(income)}</p>}
          {expense > 0 && <p className="text-rose-600">−{formatRupiah(expense)}</p>}
        </div>
      )}
    </section>
  )
}
