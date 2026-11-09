import { formatRupiah, formatShortDate, todayISO } from '../../lib/format'
import { describeDue, getBillStatus, isAttention } from '../../lib/recurring'
import type { RecurringBill } from '../../types'

interface Props {
  bills: RecurringBill[]
  onSelect: (bill: RecurringBill) => void
  onSeeAll: () => void
  onAdd: () => void
}

/** Maksimal baris yang ditampilkan di dashboard (yang perlu dibayar selalu tampil semua) */
const MAX_ROWS = 3

/** Kartu tagihan di dashboard utama: yang perlu dibayar + jadwal berikutnya */
export function UpcomingBillsCard({ bills, onSelect, onSeeAll, onAdd }: Props) {
  const today = todayISO()

  if (bills.length === 0) {
    return (
      <section className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm">
        <span className="text-2xl">🔔</span>
        <p className="min-w-0 flex-1 text-sm text-slate-600">
          Catat langganan & cicilan supaya kamu diingatkan sebelum jatuh tempo.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="shrink-0 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
        >
          + Tagihan
        </button>
      </section>
    )
  }

  const active = bills
    .map((b) => ({ bill: b, status: getBillStatus(b, today) }))
    .filter((x) => x.status.state !== 'finished')
    .sort((a, b) => (a.status.nextDue ?? '').localeCompare(b.status.nextDue ?? ''))
  if (active.length === 0) return null

  const attentionCount = active.filter((x) => isAttention(x.status.state)).length
  const shown = active.slice(0, Math.max(attentionCount, MAX_ROWS))
  const hidden = active.length - shown.length
  const urgent = attentionCount > 0

  return (
    <section
      className={`rounded-2xl p-4 ${urgent ? 'border border-amber-200 bg-amber-50' : 'bg-surface shadow-sm'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className={`font-semibold ${urgent ? 'text-amber-900' : 'text-slate-800'}`}>
          {urgent ? `🔔 Tagihan perlu dibayar (${attentionCount})` : '🔔 Tagihan berikutnya'}
        </h2>
        <button
          type="button"
          onClick={onSeeAll}
          className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
        >
          Lihat semua ›
        </button>
      </div>

      <ul className="mt-2 space-y-2">
        {shown.map(({ bill, status }) => {
          const due = describeDue(status)
          const needsPay = isAttention(status.state)
          return (
            <li key={bill.id}>
              <button
                type="button"
                onClick={() => onSelect(bill)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-slate-50 ${
                  urgent ? 'bg-surface shadow-sm' : 'border border-slate-100'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-slate-800">{bill.name}</span>
                  <span className={`block text-xs font-medium ${due.className}`}>
                    {due.icon} {status.state === 'upcoming' ? due.text : `${due.text} · ${formatShortDate(status.nextDue ?? '')}`}
                  </span>
                </span>
                <span className="shrink-0 font-semibold text-slate-800">{formatRupiah(bill.amount)}</span>
                {needsPay && (
                  <span className="shrink-0 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-white">
                    Bayar
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {hidden > 0 && (
        <p className="mt-2 text-center text-xs text-slate-500">+{hidden} tagihan lainnya</p>
      )}
    </section>
  )
}
