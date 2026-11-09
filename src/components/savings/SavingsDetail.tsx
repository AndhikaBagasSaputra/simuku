import { useState, type FormEvent } from 'react'
import { formatRupiah, formatShortDate, todayISO } from '../../lib/format'
import { getSavingsStats } from '../../lib/savings'
import { dangerButtonClass, inputClass, labelClass, primaryButtonClass, segmentClass } from '../../lib/ui'
import type { SavingsEntryInput, SavingsGoal } from '../../types'
import { AmountInput } from '../ui/AmountInput'
import { Sheet } from '../ui/Sheet'

interface Props {
  goal: SavingsGoal
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onAddEntry: (input: SavingsEntryInput) => void
  onDeleteEntry: (entryId: string) => void
}

export function SavingsDetail({ goal, onClose, onEdit, onDelete, onAddEntry, onDeleteEntry }: Props) {
  const today = todayISO()
  const stats = getSavingsStats(goal, today)
  const [kind, setKind] = useState<'deposit' | 'withdraw'>('deposit')
  const [amount, setAmount] = useState(0)
  const [date, setDate] = useState(today)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const entries = [...goal.entries].sort((a, b) => b.date.localeCompare(a.date))

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (amount <= 0) return setError('Nominal harus lebih dari 0')
    if (kind === 'withdraw' && amount > stats.saved) {
      return setError(`Tidak bisa ambil lebih dari yang terkumpul (${formatRupiah(stats.saved)})`)
    }
    if (!date) return setError('Tanggal wajib diisi')
    onAddEntry({ kind, amount, date, note: note.trim() })
    setAmount(0)
    setNote('')
    setError('')
  }

  return (
    <Sheet title={`${goal.icon} ${goal.name}`} onClose={onClose}>
      <div className="rounded-2xl bg-slate-50 p-4">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-xs text-slate-500">Terkumpul</p>
            <p className="text-2xl font-bold text-slate-800">{formatRupiah(stats.saved)}</p>
          </div>
          <p className="text-sm text-slate-500">dari {formatRupiah(goal.target)}</p>
        </div>
        <div className="mt-3 h-2.5 rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${stats.progress}%` }} />
        </div>
        <p className="mt-2 text-sm font-semibold text-emerald-700">{Math.floor(stats.progress)}% tercapai</p>

        {stats.achieved ? (
          <p className="mt-3 rounded-xl bg-emerald-100 p-3 text-sm font-semibold text-emerald-800">
            🎉 Selamat! Target sudah tercapai.
          </p>
        ) : (
          <div className="mt-3 space-y-1 text-sm text-slate-600">
            <p>
              Kurang <b>{formatRupiah(stats.remaining)}</b>
            </p>
            {goal.deadline && stats.daysLeft !== null && (
              <p>
                📅 Tenggat {formatShortDate(goal.deadline)}{' '}
                {stats.daysLeft >= 0 ? `(${stats.daysLeft} hari lagi)` : '(sudah lewat)'}
              </p>
            )}
            {stats.perMonth > 0 && (
              <p className="rounded-xl bg-surface p-3 text-slate-700">
                💡 Supaya tercapai tepat waktu, nabung sekitar <b>{formatRupiah(stats.perMonth)}/bulan</b> atau{' '}
                <b>{formatRupiah(stats.perWeek)}/minggu</b>.
              </p>
            )}
          </div>
        )}
        {goal.note && <p className="mt-2 text-xs text-slate-500">📝 {goal.note}</p>}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 rounded-2xl border border-slate-200 p-4">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          <button type="button" onClick={() => setKind('deposit')} className={segmentClass(kind === 'deposit')}>
            💰 Nabung
          </button>
          <button type="button" onClick={() => setKind('withdraw')} className={segmentClass(kind === 'withdraw')}>
            📤 Ambil
          </button>
        </div>

        <label className="mt-3 block">
          <span className={labelClass}>Nominal</span>
          <AmountInput value={amount} onChange={setAmount} size="md" />
        </label>
        {kind === 'deposit' && stats.remaining > 0 && (
          <button
            type="button"
            onClick={() => setAmount(stats.remaining)}
            className="mt-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            Isi kekurangan ({formatRupiah(stats.remaining)})
          </button>
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
          {kind === 'deposit' ? 'Simpan Tabungan' : 'Simpan Pengambilan'}
        </button>
      </form>

      <div className="mt-4">
        <p className="font-semibold text-slate-800">Riwayat</p>
        {entries.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Belum ada tabungan.</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100">
            {entries.map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                <span className="text-lg">{e.kind === 'deposit' ? '💰' : '📤'}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-slate-700">
                    {e.kind === 'deposit' ? 'Nabung' : 'Ambil'} · {formatShortDate(e.date)}
                  </span>
                  {e.note && <span className="block truncate text-xs text-slate-500">{e.note}</span>}
                </span>
                <span className={`font-semibold ${e.kind === 'deposit' ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {e.kind === 'deposit' ? '+' : '-'}
                  {formatRupiah(e.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteEntry(e.id)}
                  className="h-7 w-7 shrink-0 rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Hapus catatan"
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
