import { useState } from 'react'
import { formatRupiah, formatShortDate } from '../../lib/format'
import { buildHaystack, matchesSearch } from '../../lib/search'
import { calculateSplit, getPayerName, toSplitInput } from '../../lib/splitBill'
import type { SplitBill } from '../../types'
import { SearchBar } from '../ui/SearchBar'

interface Props {
  splitBills: SplitBill[]
  onSelect: (bill: SplitBill) => void
}

export function SplitBillsPage({ splitBills, onSelect }: Props) {
  const [query, setQuery] = useState('')

  if (splitBills.length === 0) {
    return (
      <div className="rounded-2xl bg-surface p-8 text-center shadow-sm">
        <p className="text-4xl">🧾</p>
        <p className="mt-2 font-medium text-slate-700">Belum ada split bill</p>
        <p className="mt-1 text-sm text-slate-500">
          Tekan tombol <b>+</b> untuk membagi tagihan bareng teman.
        </p>
      </div>
    )
  }

  const list = [...splitBills]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .map((bill) => {
      const input = toSplitInput(bill)
      const calc = calculateSplit(input)
      const haystack = buildHaystack({
        text: [bill.title, ...bill.participants.map((p) => p.name), ...bill.items.map((i) => i.name)],
        amounts: [calc.grandTotal, ...calc.shares.map((s) => s.total), ...bill.items.map((i) => i.price)],
        dates: [bill.date],
      })
      return { bill, input, calc, haystack }
    })
    .filter((x) => matchesSearch(x.haystack, query))

  return (
    <div className="space-y-4">
      <div className="lg:max-w-xl">
        <SearchBar value={query} onChange={setQuery} placeholder="Cari judul, nama teman, item, nominal, tanggal…" />
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl bg-surface p-8 text-center shadow-sm">
          <p className="text-4xl">🔍</p>
          <p className="mt-2 font-medium text-slate-700">Tidak ada yang cocok</p>
          <p className="mt-1 text-sm text-slate-500">Coba kata kunci lain.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {list.map(({ bill, input, calc }) => (
            <li key={bill.id}>
              <button
                type="button"
                onClick={() => onSelect(bill)}
                className="h-full w-full rounded-2xl bg-surface p-4 text-left shadow-sm hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-slate-800">{bill.title}</span>
                    <span className="block text-xs text-slate-500">
                      {formatShortDate(bill.date)} · {bill.participants.length} orang · dibayar {getPayerName(input)}
                    </span>
                  </span>
                  <span className="shrink-0 font-bold text-slate-800">{formatRupiah(calc.grandTotal)}</span>
                </div>
                <p className="mt-2 truncate text-xs text-slate-500">{bill.participants.map((p) => p.name).join(', ')}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
