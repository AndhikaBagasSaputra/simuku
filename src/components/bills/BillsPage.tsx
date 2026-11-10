import { BellRing } from 'lucide-react'
import { EmptyIcon } from '../ui/EmptyIcon'
import { CategoryIcon } from '../ui/CategoryIcon'
import { formatRupiah, todayISO } from '../../lib/format'
import { describeDue, FREQUENCY_LABEL, getBillStatus, monthlyEstimate } from '../../lib/recurring'
import type { RecurringBill } from '../../types'

interface Props {
  bills: RecurringBill[]
  onSelect: (bill: RecurringBill) => void
}

export function BillsPage({ bills, onSelect }: Props) {
  const today = todayISO()

  if (bills.length === 0) {
    return (
      <div className="rounded-2xl bg-surface p-8 text-center shadow-sm">
        <EmptyIcon icon={BellRing} />
        <p className="mt-3 font-medium text-slate-700">Belum ada tagihan rutin</p>
        <p className="mt-1 text-sm text-slate-500">
          Tekan tombol <b>+</b> untuk menambah langganan (Netflix, internet, kos) atau cicilan.
        </p>
      </div>
    )
  }

  const list = bills
    .map((b) => ({ bill: b, status: getBillStatus(b, today) }))
    // Yang paling dekat jatuh tempo di atas, yang sudah lunas paling bawah
    .sort((a, b) => (a.status.nextDue ?? '9999').localeCompare(b.status.nextDue ?? '9999'))
  const perMonth = list
    .filter((x) => x.status.state !== 'finished')
    .reduce((sum, x) => sum + monthlyEstimate(x.bill), 0)

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-surface p-4 shadow-sm lg:max-w-md">
        <p className="text-sm text-slate-500">Perkiraan tagihan per bulan</p>
        <p className="mt-1 text-2xl font-bold text-slate-800">{formatRupiah(Math.round(perMonth))}</p>
      </div>

      <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {list.map(({ bill, status }) => {
          const due = describeDue(status)
          return (
            <li key={bill.id}>
              <button
                type="button"
                onClick={() => onSelect(bill)}
                className="h-full w-full rounded-2xl bg-surface p-4 text-left shadow-sm hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <CategoryIcon categoryId={bill.categoryId} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-slate-800">{bill.name}</span>
                    <span className="block text-xs text-slate-500">
                      {bill.kind === 'installment' ? 'Cicilan' : 'Langganan'} · {FREQUENCY_LABEL[bill.frequency]}
                      {bill.kind === 'installment' &&
                        bill.installments > 0 &&
                        ` · ${status.paidCount}/${bill.installments}`}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold text-slate-800">{formatRupiah(bill.amount)}</span>
                </div>
                <p className={`mt-2 text-sm font-medium ${due.className}`}>
                  {due.text}
                </p>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
