import { BarChart3, List } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { getCategory } from '../../lib/categories'
import { formatRupiah } from '../../lib/format'
import { getEndMonth, type Period } from '../../lib/period'
import { buildHaystack, matchesSearch } from '../../lib/search'
import { segmentClass } from '../../lib/ui'
import type { RecurringBill, Transaction, TransactionType } from '../../types'
import { UpcomingBillsCard } from '../bills/UpcomingBillsCard'
import { PeriodPicker } from '../PeriodPicker'
import { SummaryCard } from '../SummaryCard'
import { TransactionList } from '../TransactionList'
import { SearchBar } from '../ui/SearchBar'
import { TodayCard } from './TodayCard'

const StatisticsPage = lazy(() => import('../StatisticsPage'))

interface Props {
  isDesktop: boolean
  /** Semua transaksi (untuk grafik tren) */
  transactions: Transaction[]
  /** Transaksi dalam periode terpilih, sudah urut terbaru */
  periodTransactions: Transaction[]
  period: Period
  onPeriodChange: (period: Period) => void
  summaryLabel: string
  bills: RecurringBill[]
  onSelectBill: (bill: RecurringBill) => void
  onSeeAllBills: () => void
  onAddBill: () => void
  onSelectTransaction: (transaction: Transaction) => void
}

type TypeFilter = 'all' | TransactionType

function transactionHaystack(t: Transaction) {
  const category = getCategory(t.categoryId)
  return buildHaystack({
    text: [t.note, category.name, t.type === 'income' ? 'pemasukan' : 'pengeluaran'],
    amounts: [t.amount],
    dates: [t.date],
  })
}

export function HomePage(props: Props) {
  const { isDesktop, period, onPeriodChange, periodTransactions } = props
  const [view, setView] = useState<'riwayat' | 'statistik'>('riwayat')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  const isFiltering = query.trim() !== '' || typeFilter !== 'all'
  const results = periodTransactions.filter(
    (t) => (typeFilter === 'all' || t.type === typeFilter) && matchesSearch(transactionHaystack(t), query),
  )
  const resultIncome = results.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const resultExpense = results.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const billsCard = (
    <UpcomingBillsCard
      bills={props.bills}
      onSelect={props.onSelectBill}
      onSeeAll={props.onSeeAllBills}
      onAdd={props.onAddBill}
    />
  )

  const statistics = (
    <Suspense fallback={<p className="py-10 text-center text-sm text-slate-500">Memuat grafik…</p>}>
      <StatisticsPage
        transactions={props.transactions}
        periodTransactions={periodTransactions}
        endMonth={getEndMonth(period)}
      />
    </Suspense>
  )

  const history = (
    <section className="space-y-3">
      <SearchBar value={query} onChange={setQuery} placeholder="Cari catatan, nominal, tanggal, kategori…" />

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ['all', 'Semua'],
            ['expense', 'Pengeluaran'],
            ['income', 'Pemasukan'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTypeFilter(value)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              typeFilter === value
                ? 'border-primary bg-primary text-white'
                : 'border-slate-200 bg-surface text-slate-600 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
        {!query && <span className="text-xs text-slate-400">Contoh: makan · 50000 · 12 nov</span>}
      </div>

      {isFiltering && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-xs text-slate-600 shadow-sm">
          <span>
            <b className="text-slate-800">{results.length}</b> transaksi ditemukan
            {resultExpense > 0 && <> · keluar <b className="text-rose-600">{formatRupiah(resultExpense)}</b></>}
            {resultIncome > 0 && <> · masuk <b className="text-emerald-700">{formatRupiah(resultIncome)}</b></>}
          </span>
          {period.preset !== 'all' && (
            <button
              type="button"
              onClick={() => onPeriodChange({ ...period, preset: 'all' })}
              className="font-semibold text-emerald-700 hover:underline"
            >
              Cari di semua periode
            </button>
          )}
        </div>
      )}

      {isFiltering && results.length === 0 ? (
        <div className="rounded-2xl bg-surface p-8 text-center shadow-sm">
          <p className="text-4xl">🔍</p>
          <p className="mt-2 font-medium text-slate-700">Tidak ada yang cocok</p>
          <p className="mt-1 text-sm text-slate-500">Coba kata kunci lain atau ubah periodenya.</p>
        </div>
      ) : (
        <TransactionList
          // Ganti periode / pencarian = mulai lagi dari halaman 1
          key={`${JSON.stringify(period)}|${query}|${typeFilter}`}
          transactions={results}
          onSelect={props.onSelectTransaction}
          expandAll={isFiltering}
        />
      )}
    </section>
  )

  // ===== Desktop: dua kolom, riwayat & statistik tampil bersamaan =====
  if (isDesktop) {
    return (
      <div className="grid grid-cols-[minmax(0,1fr)_400px] items-start gap-6">
        <div className="space-y-4">
          <TodayCard transactions={props.transactions} />
          <div className="rounded-2xl bg-surface p-2 shadow-sm">
            <PeriodPicker period={period} onChange={onPeriodChange} />
          </div>
          <SummaryCard transactions={periodTransactions} label={props.summaryLabel} />
          {history}
        </div>
        <div className="space-y-4">
          {billsCard}
          {statistics}
        </div>
      </div>
    )
  }

  // ===== HP: satu kolom dengan pilihan Riwayat / Statistik =====
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-200/70 p-1">
        <button type="button" onClick={() => setView('riwayat')} className={`${segmentClass(view === 'riwayat')} flex items-center justify-center gap-1.5`}>
          <List className="h-4 w-4" /> Riwayat
        </button>
        <button type="button" onClick={() => setView('statistik')} className={`${segmentClass(view === 'statistik')} flex items-center justify-center gap-1.5`}>
          <BarChart3 className="h-4 w-4" /> Statistik
        </button>
      </div>
      {billsCard}
      <TodayCard transactions={props.transactions} />
      <PeriodPicker period={period} onChange={onPeriodChange} />
      <SummaryCard transactions={periodTransactions} label={props.summaryLabel} />
      {view === 'riwayat' ? history : statistics}
    </div>
  )
}
