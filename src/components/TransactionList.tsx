import { CategoryIcon } from './ui/CategoryIcon'
import { BellRing, ChevronDown, ChevronLeft, ChevronRight, NotebookPen, ReceiptText } from 'lucide-react'
import { useRef, useState } from 'react'
import { getCategory } from '../lib/categories'
import { formatDate, formatRupiah } from '../lib/format'
import type { Transaction } from '../types'

interface Props {
  transactions: Transaction[]
  onSelect: (transaction: Transaction) => void
  /** Buka semua hari sekaligus (dipakai saat mencari/menyaring, supaya hasilnya langsung terlihat) */
  expandAll?: boolean
}

export function TransactionList({ transactions, onSelect, expandAll = false }: Props) {
  // Hari yang dibuka/ditutup manual. Yang belum pernah diklik mengikuti bawaan.
  const [toggled, setToggled] = useState<Record<string, boolean>>({})
  const [page, setPage] = useState(1)
  const topRef = useRef<HTMLDivElement>(null)

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl bg-surface p-8 text-center shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <NotebookPen className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="mt-3 font-medium text-slate-700">Belum ada transaksi</p>
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
  const newestDate = transactions[0].date

  // Lebih dari 7 hari: dibagi per halaman supaya riwayat tidak terlalu panjang
  const days = [...groups.entries()]
  const pageCount = Math.ceil(days.length / DAYS_PER_PAGE)
  const current = Math.min(page, pageCount)
  const visibleDays = days.slice((current - 1) * DAYS_PER_PAGE, current * DAYS_PER_PAGE)

  function goToPage(next: number) {
    setPage(next)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    topRef.current?.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  return (
    <div ref={topRef} className="scroll-mt-4 space-y-2">
      {visibleDays.map(([date, items]) => {
        // Bawaan: hanya hari terbaru yang terbuka, sisanya dibuka saat diklik
        const open = expandAll || (toggled[date] ?? date === newestDate)
        let income = 0
        let expense = 0
        for (const t of items) {
          if (t.type === 'income') income += t.amount
          else expense += t.amount
        }

        return (
          <section key={date} className="overflow-hidden rounded-2xl bg-surface shadow-sm">
            <h3>
              <button
                type="button"
                onClick={() => setToggled((prev) => ({ ...prev, [date]: !open }))}
                disabled={expandAll}
                aria-expanded={open}
                className="flex w-full items-center gap-3 p-3 text-left hover:bg-slate-50 disabled:hover:bg-transparent"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-800">{formatDate(date)}</span>
                  <span className="block text-xs text-slate-500">{items.length} transaksi</span>
                </span>
                <span className="shrink-0 text-right text-xs font-semibold">
                  {income > 0 && <span className="block text-emerald-700">+{formatRupiah(income)}</span>}
                  {expense > 0 && <span className="block text-rose-600">-{formatRupiah(expense)}</span>}
                </span>
                {!expandAll && (
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                )}
              </button>
            </h3>

            {open && (
              <ul className="divide-y divide-slate-100 border-t border-slate-100">
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
                        <CategoryIcon categoryId={t.categoryId} />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-slate-800">
                            {category.name}
                            {t.splitBillId && (
                              <span className="ml-1.5 inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 align-middle text-xs font-medium text-slate-600">
                                <ReceiptText className="h-3 w-3" aria-hidden="true" /> Split bill
                              </span>
                            )}
                            {t.recurringBillId && (
                              <span className="ml-1.5 inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 align-middle text-xs font-medium text-slate-600">
                                <BellRing className="h-3 w-3" aria-hidden="true" /> Tagihan
                              </span>
                            )}
                          </span>
                          {t.note && <span className="block truncate text-sm text-slate-500">{t.note}</span>}
                        </span>
                        <span
                          className={`shrink-0 font-semibold ${isIncome ? 'text-emerald-700' : 'text-rose-600'}`}
                        >
                          {isIncome ? '+' : '-'}
                          {formatRupiah(t.amount)}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}

      {pageCount > 1 && (
        <nav aria-label="Halaman riwayat" className="flex flex-wrap items-center justify-center gap-1 pt-2">
          <button
            type="button"
            onClick={() => goToPage(current - 1)}
            disabled={current === 1}
            aria-label="Halaman sebelumnya"
            className={pageButtonClass(false)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pageNumbers(current, pageCount).map((n, i) =>
            n === null ? (
              <span key={`gap-${i}`} className="px-1 text-sm text-slate-500">
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                onClick={() => goToPage(n)}
                aria-current={n === current ? 'page' : undefined}
                aria-label={`Halaman ${n}`}
                className={pageButtonClass(n === current)}
              >
                {n}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() => goToPage(current + 1)}
            disabled={current === pageCount}
            aria-label="Halaman berikutnya"
            className={pageButtonClass(false)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  )
}

const DAYS_PER_PAGE = 7

function pageButtonClass(active: boolean) {
  return `flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-semibold disabled:opacity-40 pointer-coarse:h-11 pointer-coarse:min-w-11 ${
    active
      ? 'border-primary bg-primary text-white'
      : 'border-slate-200 bg-surface text-slate-600 hover:bg-slate-50 disabled:hover:bg-surface'
  }`
}

/**
 * Nomor halaman yang ditampilkan. null = "…".
 * Paling banyak 5 nomor, atau awal · aktif · akhir, supaya tombol 44px tetap muat satu baris di HP 360px.
 */
function pageNumbers(current: number, total: number): (number | null)[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  const shown = [1, current, total]
  const result: (number | null)[] = []
  for (const n of [...new Set(shown)]) {
    const last = result[result.length - 1]
    if (typeof last === 'number' && n - last > 1) result.push(null)
    result.push(n)
  }
  return result
}
