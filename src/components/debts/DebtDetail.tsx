import { useState, type FormEvent } from 'react'
import { getDebtStats } from '../../lib/debt'
import { formatRupiah, formatShortDate, todayISO } from '../../lib/format'
import { dangerButtonClass, inputClass, labelClass, primaryButtonClass } from '../../lib/ui'
import type { Debt, DebtPaymentInput } from '../../types'
import { AmountInput } from '../ui/AmountInput'
import { Sheet } from '../ui/Sheet'
import { DebtStatusBadge } from './DebtStatusBadge'

interface Props {
  debt: Debt
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onAddPayment: (input: DebtPaymentInput) => void
  onDeletePayment: (paymentId: string) => void
  /** Diisi kalau hutang ini berasal dari split bill */
  splitBillTitle?: string
  onOpenSplitBill?: () => void
}

function buildReminderText(debt: Debt, paid: number, remaining: number) {
  const lines = [
    `Halo ${debt.person} 👋`,
    `Mau mengingatkan soal hutang${debt.note ? ` (${debt.note})` : ''} tanggal ${formatShortDate(debt.date)}:`,
    '',
    `Total     : ${formatRupiah(debt.amount)}`,
    `Sudah bayar: ${formatRupiah(paid)}`,
    `Sisa      : ${formatRupiah(remaining)}`,
  ]
  if (debt.dueDate) lines.push(`Jatuh tempo: ${formatShortDate(debt.dueDate)}`)
  lines.push('', 'Terima kasih 🙏')
  return lines.join('\n')
}

export function DebtDetail({
  debt,
  onClose,
  onEdit,
  onDelete,
  onAddPayment,
  onDeletePayment,
  splitBillTitle,
  onOpenSplitBill,
}: Props) {
  const stats = getDebtStats(debt)
  const [amount, setAmount] = useState(0)
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const isOwedToMe = debt.direction === 'owed_to_me'
  const payments = [...debt.payments].sort((a, b) => b.date.localeCompare(a.date))
  const extra = stats.remaining > 0 && amount > stats.remaining ? amount - stats.remaining : 0

  function handlePayment(e: FormEvent) {
    e.preventDefault()
    if (amount <= 0) return setError('Nominal pembayaran harus lebih dari 0')
    if (!date) return setError('Tanggal wajib diisi')
    onAddPayment({ kind: 'payment', amount, date, note: note.trim() })
    setAmount(0)
    setNote('')
    setError('')
  }

  function handleRefund() {
    const message = isOwedToMe
      ? `Catat bahwa kamu sudah mengembalikan ${formatRupiah(stats.overpaid)} ke ${debt.person}?`
      : `Catat bahwa ${debt.person} sudah mengembalikan ${formatRupiah(stats.overpaid)} ke kamu?`
    if (window.confirm(message)) {
      onAddPayment({ kind: 'refund', amount: stats.overpaid, date: todayISO(), note: 'Pengembalian kelebihan bayar' })
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildReminderText(debt, stats.paid, stats.remaining))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.alert('Gagal menyalin. Coba lagi.')
    }
  }

  return (
    <Sheet title={isOwedToMe ? `${debt.person} hutang ke kamu` : `Kamu hutang ke ${debt.person}`} onClose={onClose}>
      {/* Ringkasan */}
      <div className="rounded-2xl bg-slate-50 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-slate-500">Total hutang</p>
            <p className="text-2xl font-bold text-slate-800">{formatRupiah(debt.amount)}</p>
          </div>
          <DebtStatusBadge status={stats.status} />
        </div>

        <div className="mt-3 h-2 rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${stats.progress}%` }} />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-slate-500">Sudah dibayar</p>
            <p className="font-semibold text-slate-800">{formatRupiah(stats.paid)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">{stats.status === 'overpaid' ? 'Kelebihan' : 'Sisa'}</p>
            <p className={`font-semibold ${stats.status === 'overpaid' ? 'text-sky-700' : 'text-slate-800'}`}>
              {formatRupiah(stats.status === 'overpaid' ? stats.overpaid : stats.remaining)}
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          📅 {formatShortDate(debt.date)}
          {debt.dueDate && ` · Jatuh tempo ${formatShortDate(debt.dueDate)}`}
          {debt.note && ` · ${debt.note}`}
        </p>
      </div>

      {splitBillTitle && onOpenSplitBill && (
        <button
          type="button"
          onClick={onOpenSplitBill}
          className="mt-3 flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-left text-sm hover:bg-slate-50"
        >
          <span>
            🧾 Dari split bill: <b>{splitBillTitle}</b>
          </span>
          <span className="text-slate-400">›</span>
        </button>
      )}

      {/* Kelebihan bayar */}
      {stats.status === 'overpaid' && (
        <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
          <p>
            ⚠️ {isOwedToMe ? `${debt.person} membayar` : 'Kamu membayar'} lebih{' '}
            <b>{formatRupiah(stats.overpaid)}</b>.
          </p>
          <button
            type="button"
            onClick={handleRefund}
            className="mt-2 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500"
          >
            Catat sudah dikembalikan
          </button>
        </div>
      )}

      {/* Form pembayaran */}
      {stats.remaining > 0 && (
        <form onSubmit={handlePayment} className="mt-4 rounded-2xl border border-slate-200 p-4">
          <p className="font-semibold text-slate-800">
            {isOwedToMe ? '💵 Terima pembayaran' : '💸 Bayar hutang'}
          </p>

          <label className="mt-3 block">
            <span className={labelClass}>Nominal</span>
            <AmountInput value={amount} onChange={setAmount} size="md" />
          </label>
          <button
            type="button"
            onClick={() => setAmount(stats.remaining)}
            className="mt-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            Lunasi semua ({formatRupiah(stats.remaining)})
          </button>
          {extra > 0 && (
            <p className="mt-2 text-xs text-sky-700">
              ℹ️ Melebihi sisa. Akan tercatat lebih bayar {formatRupiah(extra)}.
            </p>
          )}

          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelClass}>Tanggal</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Catatan</span>
              <input
                type="text"
                placeholder="Opsional"
                maxLength={60}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          {error && <p className="mt-2 text-sm font-medium text-rose-600">⚠ {error}</p>}

          <button type="submit" className={`mt-3 w-full ${primaryButtonClass}`}>
            Catat Pembayaran
          </button>
        </form>
      )}

      {/* Riwayat pembayaran */}
      <div className="mt-4">
        <p className="font-semibold text-slate-800">Riwayat pembayaran</p>
        {payments.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Belum ada pembayaran.</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                <span className="text-lg">{p.kind === 'refund' ? '↩️' : '💰'}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-slate-700">
                    {p.kind === 'refund' ? 'Pengembalian' : 'Pembayaran'} · {formatShortDate(p.date)}
                  </span>
                  {p.note && <span className="block truncate text-xs text-slate-500">{p.note}</span>}
                </span>
                <span className={`font-semibold ${p.kind === 'refund' ? 'text-sky-700' : 'text-emerald-700'}`}>
                  {p.kind === 'refund' ? '-' : '+'}
                  {formatRupiah(p.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => onDeletePayment(p.id)}
                  className="h-7 w-7 shrink-0 rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Hapus pembayaran"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Aksi */}
      <div className="mt-5 flex flex-wrap gap-2">
        {isOwedToMe && stats.remaining > 0 && (
          <button
            type="button"
            onClick={handleCopy}
            className="w-full rounded-xl border border-emerald-200 py-3 font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            {copied ? '✅ Tersalin!' : '📋 Salin teks pengingat'}
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className={dangerButtonClass}
        >
          Hapus
        </button>
        <button
          type="button"
          // Nominal hutang dari split bill diatur lewat split bill-nya
          onClick={splitBillTitle && onOpenSplitBill ? onOpenSplitBill : onEdit}
          className="flex-1 rounded-xl border border-slate-200 py-3 font-semibold text-slate-700 hover:bg-slate-50"
        >
          {splitBillTitle ? '✏️ Edit lewat split bill' : '✏️ Edit'}
        </button>
      </div>
    </Sheet>
  )
}
