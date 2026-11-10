import { formatRupiah } from '../lib/format'
import type { Transaction } from '../types'

interface Props {
  transactions: Transaction[]
  label?: string
}

/** Kartu utama: sisa uang di periode terpilih, dengan rincian masuk & keluar dalam satu baris */
export function SummaryCard({ transactions, label = 'Sisa bulan ini' }: Props) {
  let income = 0
  let expense = 0
  for (const t of transactions) {
    if (t.type === 'income') income += t.amount
    else expense += t.amount
  }
  const balance = income - expense
  const minus = balance < 0

  return (
    <section className="rounded-2xl bg-primary px-5 py-4 text-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 className="text-sm font-medium">{label}</h2>
        {/* Saat minus kartu tetap hijau; tandanya label terang ini, bukan teks merah di atas hijau */}
        {minus && (
          <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-rose-700">
            Pengeluaran melebihi pemasukan
          </span>
        )}
      </div>
      <p className="mt-1 text-3xl font-bold tabular-nums">
        {minus && '−'}
        {formatRupiah(Math.abs(balance))}
      </p>
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-sm tabular-nums">
        <span>
          <span className="font-semibold">+{formatRupiah(income)}</span> masuk
        </span>
        <span>
          <span className="font-semibold">−{formatRupiah(expense)}</span> keluar
        </span>
      </p>
    </section>
  )
}
