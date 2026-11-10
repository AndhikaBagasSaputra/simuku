import { CircleCheck, Inbox, SearchX } from 'lucide-react'
import { EmptyIcon } from '../ui/EmptyIcon'
import { useState } from 'react'
import { getDebtStats, isActive } from '../../lib/debt'
import { formatRupiah, formatShortDate, todayISO } from '../../lib/format'
import { buildHaystack, matchesSearch } from '../../lib/search'
import { segmentClass } from '../../lib/ui'
import type { Debt, DebtDirection } from '../../types'
import { SearchBar } from '../ui/SearchBar'
import { DebtStatusBadge } from './DebtStatusBadge'

function debtHaystack(d: Debt) {
  return buildHaystack({
    text: [d.person, d.note, ...d.payments.map((p) => p.note)],
    amounts: [d.amount, ...d.payments.map((p) => p.amount)],
    dates: [d.date, d.dueDate, ...d.payments.map((p) => p.date)],
  })
}

type StatusFilter = 'active' | 'done' | 'all'

interface Props {
  debts: Debt[]
  direction: DebtDirection
  onDirectionChange: (direction: DebtDirection) => void
  onSelect: (debt: Debt) => void
}

export function DebtsPage({ debts, direction, onDirectionChange, onSelect }: Props) {
  const [filter, setFilter] = useState<StatusFilter>('active')
  const [query, setQuery] = useState('')
  const today = todayISO()

  // Total sisa per arah (semua hutang yang belum lunas)
  let owedToMe = 0
  let iOwe = 0
  for (const d of debts) {
    const { remaining } = getDebtStats(d)
    if (d.direction === 'owed_to_me') owedToMe += remaining
    else iOwe += remaining
  }

  const list = debts
    .filter((d) => d.direction === direction && matchesSearch(debtHaystack(d), query))
    .map((d) => ({ debt: d, stats: getDebtStats(d) }))
    .filter(({ stats }) =>
      filter === 'all' ? true : filter === 'active' ? isActive(stats.status) : !isActive(stats.status),
    )
    .sort((a, b) => b.debt.date.localeCompare(a.debt.date) || b.debt.createdAt.localeCompare(a.debt.createdAt))

  return (
    <div className="space-y-4">
      {/* Ringkasan */}
      <div className="grid grid-cols-2 gap-3 lg:max-w-2xl">
        <button
          type="button"
          onClick={() => onDirectionChange('owed_to_me')}
          className={`rounded-2xl p-4 text-left shadow-sm transition ${
            direction === 'owed_to_me' ? 'bg-primary text-white' : 'bg-surface text-slate-800'
          }`}
        >
          <p className={`text-xs ${direction === 'owed_to_me' ? 'text-white/80' : 'text-slate-500'}`}>
            Piutang (orang ke kamu)
          </p>
          <p className="mt-1 text-lg font-bold">{formatRupiah(owedToMe)}</p>
        </button>
        <button
          type="button"
          onClick={() => onDirectionChange('i_owe')}
          className={`rounded-2xl p-4 text-left shadow-sm transition ${
            direction === 'i_owe' ? 'bg-rose-600 text-white' : 'bg-surface text-slate-800'
          }`}
        >
          <p className={`text-xs ${direction === 'i_owe' ? 'text-white/80' : 'text-slate-500'}`}>
            Hutang kamu
          </p>
          <p className="mt-1 text-lg font-bold">{formatRupiah(iOwe)}</p>
        </button>
      </div>

      {/* Filter status + pencarian */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-200/70 p-1 lg:w-80">
          {(
            [
              ['active', 'Belum lunas'],
              ['done', 'Lunas'],
              ['all', 'Semua'],
            ] as const
          ).map(([value, label]) => (
            <button key={value} type="button" onClick={() => setFilter(value)} className={segmentClass(filter === value)}>
              {label}
            </button>
          ))}
        </div>
        <div className="lg:flex-1">
          <SearchBar value={query} onChange={setQuery} placeholder="Cari nama, nominal, tanggal, catatan…" />
        </div>
      </div>

      {/* Daftar */}
      {list.length === 0 ? (
        <div className="rounded-2xl bg-surface p-8 text-center shadow-sm">
          <EmptyIcon icon={query ? SearchX : filter === 'done' ? Inbox : CircleCheck} />
          <p className="mt-3 font-medium text-slate-700">
            {query ? 'Tidak ada yang cocok' : filter === 'active' ? 'Tidak ada yang belum lunas' : 'Belum ada data'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {query ? 'Coba kata kunci lain atau ubah filter status.' : 'Tekan tombol + untuk mencatat hutang baru.'}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {list.map(({ debt, stats }) => {
            const overdue = isActive(stats.status) && debt.dueDate && debt.dueDate < today
            return (
              <li key={debt.id}>
                <button
                  type="button"
                  onClick={() => onSelect(debt)}
                  className="h-full w-full rounded-2xl bg-surface p-4 text-left shadow-sm hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">
                      {debt.person.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-slate-800">{debt.person}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {formatShortDate(debt.date)}
                        {debt.note && ` · ${debt.note}`}
                      </span>
                    </span>
                    <DebtStatusBadge status={stats.status} />
                  </div>

                  <div className="mt-3 h-1.5 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${stats.progress}%` }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      {formatRupiah(stats.paid)} / {formatRupiah(debt.amount)}
                    </span>
                    {stats.status === 'overpaid' ? (
                      <span className="font-semibold text-sky-700">Lebih {formatRupiah(stats.overpaid)}</span>
                    ) : stats.remaining > 0 ? (
                      <span className="font-semibold text-slate-800">Sisa {formatRupiah(stats.remaining)}</span>
                    ) : null}
                  </div>

                  {overdue && (
                    <p className="mt-2 text-xs font-semibold text-rose-600">
                      Lewat jatuh tempo ({formatShortDate(debt.dueDate)})
                    </p>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
