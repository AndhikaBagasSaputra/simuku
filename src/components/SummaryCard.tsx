import { formatRupiah } from '../lib/format'
import type { Transaction } from '../types'

interface Props {
  transactions: Transaction[]
  label?: string
}

export function SummaryCard({ transactions, label = 'Selisih bulan ini' }: Props) {
  let income = 0
  let expense = 0
  for (const t of transactions) {
    if (t.type === 'income') income += t.amount
    else expense += t.amount
  }
  const balance = income - expense

  return (
    <div className="rounded-2xl bg-primary p-5 text-white shadow-sm">
      <p className="text-sm text-white/80">{label}</p>
      <p className="mt-1 text-3xl font-bold">
        {balance < 0 && '-'}
        {formatRupiah(Math.abs(balance))}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/15 p-3">
          <p className="text-xs text-white/80">⬇ Pemasukan</p>
          <p className="mt-0.5 font-semibold">{formatRupiah(income)}</p>
        </div>
        <div className="rounded-xl bg-white/15 p-3">
          <p className="text-xs text-white/80">⬆ Pengeluaran</p>
          <p className="mt-0.5 font-semibold">{formatRupiah(expense)}</p>
        </div>
      </div>
    </div>
  )
}
