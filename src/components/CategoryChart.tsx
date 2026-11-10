import { segmentClass } from '../lib/ui'
import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useTheme } from '../hooks/useTheme'
import { getCategoriesByType } from '../lib/categories'
import { chartChrome, themedColor } from '../lib/chartTheme'
import { formatRupiah } from '../lib/format'
import type { Transaction, TransactionType } from '../types'

interface Props {
  /** Transaksi dalam periode terpilih */
  transactions: Transaction[]
}

interface Slice {
  id: string
  name: string
  color: string
  value: number
  percent: number
}

export function CategoryChart({ transactions }: Props) {
  const [type, setType] = useState<TransactionType>('expense')
  const { resolved: theme } = useTheme()
  const chrome = chartChrome(theme)

  // Hitung total per kategori. Urutan potongan donat mengikuti urutan kategori
  // (bukan ranking), supaya warna tiap kategori selalu konsisten.
  const totals = new Map<string, number>()
  for (const t of transactions) {
    if (t.type === type) totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount)
  }
  const total = [...totals.values()].reduce((sum, v) => sum + v, 0)
  const slices: Slice[] = getCategoriesByType(type)
    .map((c) => {
      const value = totals.get(c.id) ?? 0
      return { ...c, color: themedColor(c.color, theme), value, percent: total ? (value / total) * 100 : 0 }
    })
    .filter((s) => s.value > 0)
  const ranked = [...slices].sort((a, b) => b.value - a.value)

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-slate-800">Per Kategori</h2>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Jenis">
          {(
            [
              ['expense', 'Pengeluaran'],
              ['income', 'Pemasukan'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              aria-pressed={type === value}
              className={`${segmentClass(type === value)} px-2.5`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          Belum ada {type === 'expense' ? 'pengeluaran' : 'pemasukan'} di periode ini.
        </p>
      ) : (
        <>
          <div className="relative mx-auto mt-2 h-52 w-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="68%"
                  outerRadius="100%"
                  startAngle={90}
                  endAngle={-270}
                  stroke={chrome.surface}
                  strokeWidth={2}
                  cornerRadius={3}
                  isAnimationActive={false}
                >
                  {slices.map((s) => (
                    <Cell key={s.id} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    const slice = payload?.[0]?.payload as Slice | undefined
                    if (!active || !slice) return null
                    return (
                      <div className="rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg ring-1 ring-white/15">
                        <p className="font-semibold">
                          {slice.name}
                        </p>
                        <p>
                          {formatRupiah(slice.value)} · {slice.percent.toFixed(1)}%
                        </p>
                      </div>
                    )
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Total di tengah donat */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-slate-500">Total</span>
              <span className="text-lg font-bold text-slate-800">{formatRupiah(total)}</span>
            </div>
          </div>

          {/* Daftar ranking: legenda + angka (bisa dibaca tanpa hover) */}
          <ul className="mt-4 space-y-3">
            {ranked.map((s) => (
              <li key={s.id}>
                <div className="flex items-center gap-2 text-sm">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="flex-1 text-slate-700">
                    {s.name}
                  </span>
                  <span className="text-xs text-slate-500 tabular-nums">
                    {s.percent.toFixed(1)}%
                  </span>
                  <span className="w-28 text-right font-semibold text-slate-800 tabular-nums">
                    {formatRupiah(s.value)}
                  </span>
                </div>
                <div className="mt-1.5 ml-4.5 h-1.5 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${s.percent}%`, backgroundColor: s.color }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
