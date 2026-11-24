import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { getCategory } from '../../lib/categories'
import { formatRupiah, formatShortDate, todayISO } from '../../lib/format'
import { cycleOf, paydayOf, salaryDatesOf, shiftCycle, shiftDays } from '../../lib/payday'
import { buildReport } from '../../lib/report'
import type { Debt, RecurringBill, Transaction } from '../../types'
import { CategoryBreakdown } from './CategoryBreakdown'

interface Props {
  transactions: Transaction[]
  bills: RecurringBill[]
  debts: Debt[]
  /** Buka form transaksi untuk mencatat gaji */
  onRecordSalary: () => void
  /** Ganti catatan beberapa transaksi sekaligus (memperbaiki typo) */
  onRenameNote: (ids: string[], note: string) => void
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-surface p-4 shadow-sm">
      <h2 className="mb-3 font-semibold text-slate-800">{title}</h2>
      {children}
    </section>
  )
}

function Row({ label, value, tone }: { label: ReactNode; value: string; tone?: 'in' | 'out' }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
      <span className="min-w-0 truncate text-slate-600">{label}</span>
      <span
        className={`shrink-0 font-semibold tabular-nums ${
          tone === 'in' ? 'text-emerald-700' : tone === 'out' ? 'text-rose-600' : 'text-slate-800'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

/** Laporan per periode gajian */
export function ReportPage({ transactions, bills, debts, onRecordSalary, onRenameNote }: Props) {
  const today = todayISO()
  // 0 = periode berjalan; ikut bergeser otomatis kalau gaji baru dicatat
  const [offset, setOffset] = useState(0)
  const salaryDates = salaryDatesOf(transactions)
  const cycle = shiftCycle(cycleOf(today, salaryDates), offset)
  const report = buildReport(cycle, { transactions, bills, debts })
  const isLatest = offset >= 0
  const periodTxs = transactions.filter((t) => t.date >= report.start && t.date <= report.end)

  // Gaji yang membuka periode berjalan belum dicatat?
  const salaryDay = paydayOf(shiftCycle(cycle, -1), salaryDates)
  const salaryMissing =
    report.current &&
    salaryDates.length > 0 &&
    !salaryDates.some((d) => d >= shiftDays(salaryDay, -10) && d <= shiftDays(salaryDay, 5))

  const arrow =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-200 disabled:opacity-30'

  return (
    <div className="space-y-4 lg:max-w-2xl">
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => setOffset(offset - 1)} aria-label="Periode sebelumnya" className={arrow}>
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <p className="min-w-0 flex-1 truncate text-center font-semibold text-slate-800">
          {formatShortDate(report.start)} – {formatShortDate(report.end)}
        </p>
        <button
          type="button"
          onClick={() => setOffset(offset + 1)}
          disabled={isLatest}
          aria-label="Periode berikutnya"
          className={arrow}
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {salaryMissing && (
        <button
          type="button"
          onClick={onRecordSalary}
          className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 text-left text-sm font-semibold text-amber-900 hover:bg-amber-100"
        >
          Gaji periode ini belum dicatat
          <span className="shrink-0 text-emerald-700">Catat gaji</span>
        </button>
      )}

      <Card title="Ringkasan">
        <Row label="Pemasukan" value={`+${formatRupiah(report.income)}`} tone="in" />
        <Row label="Pengeluaran" value={`−${formatRupiah(report.expense)}`} tone="out" />
        <div className="my-1 border-t border-slate-100" />
        <Row label="Sisa" value={`${report.balance < 0 ? '−' : ''}${formatRupiah(Math.abs(report.balance))}`} />
        <Row label="Rata-rata pengeluaran per hari" value={formatRupiah(Math.round(report.perDay))} />
        {report.expenseChange !== null && (
          <Row
            label="Pengeluaran dibanding periode lalu"
            value={
              Math.round(report.expenseChange) === 0
                ? 'sama'
                : `${report.expenseChange > 0 ? 'naik' : 'turun'} ${Math.abs(Math.round(report.expenseChange))}%`
            }
            tone={Math.round(report.expenseChange) === 0 ? undefined : report.expenseChange > 0 ? 'out' : 'in'}
          />
        )}
      </Card>

      <Card title="Ke mana uangnya">
        {report.topCategories.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada pengeluaran.</p>
        ) : (
          <CategoryBreakdown
            lines={report.topCategories}
            transactions={periodTxs.filter((t) => t.type === 'expense')}
            onRenameNote={onRenameNote}
          />
        )}
        {report.risingCategory && (
          <p className="mt-3 text-sm text-slate-600">
            Naik paling banyak: <b className="text-slate-800">{report.risingCategory.name}</b> (+
            {formatRupiah(report.risingCategory.increase)})
          </p>
        )}
      </Card>

      {report.incomeCategories.length > 0 && (
        <Card title="Dari mana uangnya">
          <CategoryBreakdown
            lines={report.incomeCategories}
            transactions={periodTxs.filter((t) => t.type === 'income')}
            onRenameNote={onRenameNote}
          />
        </Card>
      )}

      {report.biggestExpenses.length > 0 && (
        <Card title="Pengeluaran terbesar">
          {report.biggestExpenses.map((t) => (
            <Row
              key={t.id}
              label={
                <>
                  {t.note || getCategory(t.categoryId).name}
                  <span className="text-slate-400"> · {formatShortDate(t.date)}</span>
                </>
              }
              value={`−${formatRupiah(t.amount)}`}
              tone="out"
            />
          ))}
          {report.busiestDay && (
            <p className="mt-2 text-sm text-slate-600">
              Hari paling boros: <b className="text-slate-800">{formatShortDate(report.busiestDay.date)}</b> (
              {formatRupiah(report.busiestDay.amount)})
            </p>
          )}
        </Card>
      )}

      {(report.billsPaid.length > 0 || report.billsMissed.length > 0) && (
        <Card title="Tagihan rutin">
          {report.billsPaid.map((b, i) => (
            <Row key={`p${i}`} label={`${b.name} · ${formatShortDate(b.paidDate)}`} value={formatRupiah(b.amount)} />
          ))}
          {report.billsPaid.length > 0 && (
            <>
              <div className="my-1 border-t border-slate-100" />
              <Row label="Total dibayar" value={formatRupiah(report.billsPaidTotal)} />
            </>
          )}
          {report.billsMissed.length > 0 && (
            <div className="mt-2 rounded-xl bg-rose-50 px-3 py-1">
              {report.billsMissed.map((b, i) => (
                <Row key={`m${i}`} label={`Belum dibayar: ${b.name} · ${formatShortDate(b.dueDate)}`} value={formatRupiah(b.amount)} tone="out" />
              ))}
            </div>
          )}
        </Card>
      )}

      <Card title="Hutang & piutang">
        <Row label="Piutang belum kembali" value={formatRupiah(report.receivable)} tone={report.receivable ? 'in' : undefined} />
        <Row label="Hutang belum dibayar" value={formatRupiah(report.payable)} tone={report.payable ? 'out' : undefined} />
        {report.settledDebts.length > 0 && (
          <p className="mt-2 text-sm text-slate-600">
            Lunas periode ini:{' '}
            {report.settledDebts
              .map((d) => (d.direction === 'owed_to_me' ? `${d.person} (piutang)` : `${d.person} (hutang)`))
              .join(', ')}
          </p>
        )}
      </Card>
    </div>
  )
}
