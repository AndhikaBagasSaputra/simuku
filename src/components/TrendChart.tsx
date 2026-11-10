import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTheme } from '../hooks/useTheme'
import { chartChrome } from '../lib/chartTheme'
import { formatCompact, formatMonth, formatMonthShort, formatRupiah, shiftMonth, toMonthKey } from '../lib/format'
import type { Transaction } from '../types'

const MONTH_COUNT = 6

interface Props {
  /** Semua transaksi (bukan hanya bulan terpilih) */
  transactions: Transaction[]
  /** Bulan terakhir yang ditampilkan */
  month: string
}

interface MonthData {
  month: string
  label: string
  income: number
  expense: number
}

export function TrendChart({ transactions, month }: Props) {
  const [showTable, setShowTable] = useState(false)
  const chrome = chartChrome(useTheme().resolved)
  const INCOME_COLOR = chrome.income
  const EXPENSE_COLOR = chrome.expense

  // 6 bulan terakhir, berakhir di bulan terpilih
  const data: MonthData[] = Array.from({ length: MONTH_COUNT }, (_, i) => {
    const key = shiftMonth(month, i - (MONTH_COUNT - 1))
    return { month: key, label: formatMonthShort(key), income: 0, expense: 0 }
  })
  const byMonth = new Map(data.map((d) => [d.month, d]))
  for (const t of transactions) {
    const row = byMonth.get(toMonthKey(t.date))
    if (row) row[t.type] += t.amount
  }

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-slate-800">Tren 6 Bulan</h2>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="rounded-md px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
        >
          {showTable ? 'Lihat grafik' : 'Lihat tabel'}
        </button>
      </div>

      {/* Legenda */}
      <div className="mt-2 flex gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: INCOME_COLOR }} />
          Pemasukan
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: EXPENSE_COLOR }} />
          Pengeluaran
        </span>
      </div>

      {showTable ? (
        <table className="mt-3 w-full text-sm tabular-nums">
          <thead>
            <tr className="text-left text-xs text-slate-500">
              <th className="py-1.5 font-medium">Bulan</th>
              <th className="py-1.5 text-right font-medium">Masuk</th>
              <th className="py-1.5 text-right font-medium">Keluar</th>
              <th className="py-1.5 text-right font-medium">Sisa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((d) => {
              const diff = d.income - d.expense
              return (
                <tr key={d.month}>
                  <td className="py-2 text-slate-700">{d.label}</td>
                  <td className="py-2 text-right text-slate-800">{formatCompact(d.income)}</td>
                  <td className="py-2 text-right text-slate-800">{formatCompact(d.expense)}</td>
                  <td
                    className={`py-2 text-right font-semibold ${diff < 0 ? 'text-rose-600' : 'text-emerald-700'}`}
                  >
                    {diff < 0 ? '-' : ''}
                    {formatCompact(Math.abs(diff))}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ) : (
        <div className="mt-3 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={2} barCategoryGap="25%" margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke={chrome.grid} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: chrome.axis }}
                tick={{ fill: chrome.tick, fontSize: 12 }}
              />
              <YAxis
                tickFormatter={formatCompact}
                tickLine={false}
                axisLine={false}
                width={44}
                tick={{ fill: chrome.tick, fontSize: 11 }}
              />
              <Tooltip
                cursor={{ fill: chrome.cursor }}
                content={({ active, payload }) => {
                  const row = payload?.[0]?.payload as MonthData | undefined
                  if (!active || !row) return null
                  const diff = row.income - row.expense
                  return (
                    <div className="rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg ring-1 ring-white/15">
                      <p className="mb-1 font-semibold">{formatMonth(row.month)}</p>
                      <p>Masuk: +{formatRupiah(row.income)}</p>
                      <p>Keluar: −{formatRupiah(row.expense)}</p>
                      <p className="mt-1 border-t border-white/20 pt-1 font-semibold">
                        Sisa: {diff < 0 ? '−' : ''}
                        {formatRupiah(Math.abs(diff))}
                      </p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="income" name="Pemasukan" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false} />
              <Bar dataKey="expense" name="Pengeluaran" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
