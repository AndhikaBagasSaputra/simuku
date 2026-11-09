import { getCategory } from '../lib/categories'
import { formatDate, formatRupiah } from '../lib/format'
import type { Transaction } from '../types'

interface Props {
  transactions: Transaction[]
  onSelect: (transaction: Transaction) => void
}

export function TransactionList({ transactions, onSelect }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl bg-surface p-8 text-center shadow-sm">
        <p className="text-4xl">📝</p>
        <p className="mt-2 font-medium text-slate-700">Belum ada transaksi</p>
        <p className="mt-1 text-sm text-slate-500">
          Tekan tombol <b>+</b> untuk mencatat transaksi pertamamu.
        </p>
      </div>
    )
  }

  // Kelompokkan per tanggal (transaksi sudah diurutkan terbaru dulu)
  const groups = new Map<string, Transaction[]>()
  for (const t of transactions) {
    const list = groups.get(t.date) ?? []
    list.push(t)
    groups.set(t.date, list)
  }

  return (
    <div className="space-y-4">
      {[...groups.entries()].map(([date, items]) => (
        <section key={date}>
          <h3 className="mb-2 px-1 text-sm font-medium text-slate-500">{formatDate(date)}</h3>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-surface shadow-sm">
            {items.map((t) => {
              const category = getCategory(t.categoryId)
              const isIncome = t.type === 'income'
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(t)}
                    className="flex w-full items-center gap-3 p-3 text-left hover:bg-slate-50"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl">
                      {category.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-slate-800">
                        {category.name}
                        {t.splitBillId && (
                          <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">
                            🧾 Split bill
                          </span>
                        )}
                        {t.recurringBillId && (
                          <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">
                            🔔 Tagihan
                          </span>
                        )}
                      </span>
                      {t.note && (
                        <span className="block truncate text-sm text-slate-500">{t.note}</span>
                      )}
                    </span>
                    <span
                      className={`shrink-0 font-semibold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatRupiah(t.amount)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
