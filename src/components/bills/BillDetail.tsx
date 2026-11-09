import { useState, type FormEvent } from 'react'
import { getCategory } from '../../lib/categories'
import { formatRupiah, formatShortDate, todayISO } from '../../lib/format'
import { describeDue, FREQUENCY_LABEL, getBillStatus } from '../../lib/recurring'
import { dangerButtonClass, inputClass, labelClass, primaryButtonClass } from '../../lib/ui'
import type { RecurringBill } from '../../types'
import { AmountInput } from '../ui/AmountInput'
import { Sheet } from '../ui/Sheet'

export interface BillPayInput {
  dueDate: string
  paidDate: string
  amount: number
  recordExpense: boolean
}

interface Props {
  bill: RecurringBill
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onPay: (input: BillPayInput) => void
  onDeletePayment: (paymentId: string) => void
}

export function BillDetail({ bill, onClose, onEdit, onDelete, onPay, onDeletePayment }: Props) {
  const today = todayISO()
  const status = getBillStatus(bill, today)
  const due = describeDue(status)
  const category = getCategory(bill.categoryId)

  const [amount, setAmount] = useState(bill.amount)
  const [paidDate, setPaidDate] = useState(today)
  const [recordExpense, setRecordExpense] = useState(true)
  const [error, setError] = useState('')

  const payments = [...bill.payments].sort((a, b) => b.dueDate.localeCompare(a.dueDate))

  function handlePay(e: FormEvent) {
    e.preventDefault()
    if (!status.nextDue) return
    if (amount <= 0) return setError('Nominal harus lebih dari 0')
    if (!paidDate) return setError('Tanggal bayar wajib diisi')
    onPay({ dueDate: status.nextDue, paidDate, amount, recordExpense })
    setAmount(bill.amount)
    setError('')
  }

  return (
    <Sheet title={bill.name} onClose={onClose}>
      <div className="rounded-2xl bg-slate-50 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-slate-500">
              {bill.kind === 'installment' ? 'Cicilan' : 'Langganan'} · {FREQUENCY_LABEL[bill.frequency]}
            </p>
            <p className="text-2xl font-bold text-slate-800">{formatRupiah(bill.amount)}</p>
          </div>
          <span className="text-sm text-slate-500">
            {category.icon} {category.name}
          </span>
        </div>

        <p className={`mt-3 font-semibold ${due.className}`}>
          {due.icon} {status.nextDue ? `${formatShortDate(status.nextDue)} · ${due.text}` : due.text}
        </p>

        {bill.kind === 'installment' && bill.installments > 0 && (
          <>
            <div className="mt-3 h-2 rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${Math.min((status.paidCount / bill.installments) * 100, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Cicilan ke-{status.paidCount} dari {bill.installments} · sisa{' '}
              {formatRupiah(Math.max(bill.installments - status.paidCount, 0) * bill.amount)}
            </p>
          </>
        )}
        {bill.note && <p className="mt-2 text-xs text-slate-500">📝 {bill.note}</p>}
      </div>

      {status.nextDue && (
        <form onSubmit={handlePay} className="mt-4 rounded-2xl border border-slate-200 p-4">
          <p className="font-semibold text-slate-800">
            ✅ Bayar tagihan {formatShortDate(status.nextDue)}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelClass}>Nominal</span>
              <AmountInput value={amount} onChange={setAmount} size="md" />
            </label>
            <label className="block">
              <span className={labelClass}>Tanggal bayar</span>
              <input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} className={inputClass} />
            </label>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={recordExpense}
              onChange={(e) => setRecordExpense(e.target.checked)}
              className="h-4 w-4 accent-emerald-600"
            />
            Catat juga sebagai pengeluaran
          </label>
          {error && <p className="mt-2 text-sm font-medium text-rose-600">⚠ {error}</p>}
          <button type="submit" className={`mt-3 w-full ${primaryButtonClass}`}>
            Tandai Sudah Dibayar
          </button>
        </form>
      )}

      <div className="mt-4">
        <p className="font-semibold text-slate-800">Riwayat pembayaran</p>
        {payments.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Belum ada pembayaran.</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                <span className="text-lg">✅</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-slate-700">Jatuh tempo {formatShortDate(p.dueDate)}</span>
                  <span className="block text-xs text-slate-500">
                    Dibayar {formatShortDate(p.paidDate)}
                    {p.transactionId ? ' · tercatat di pengeluaran' : ''}
                  </span>
                </span>
                <span className="font-semibold text-slate-800">{formatRupiah(p.amount)}</span>
                <button
                  type="button"
                  onClick={() => onDeletePayment(p.id)}
                  className="h-7 w-7 shrink-0 rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Batalkan pembayaran"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onDelete}
          className={dangerButtonClass}
        >
          Hapus
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 rounded-xl border border-slate-200 py-3 font-semibold text-slate-700 hover:bg-slate-50"
        >
          ✏️ Edit
        </button>
      </div>
    </Sheet>
  )
}
