import { useState, type FormEvent } from 'react'
import { todayISO } from '../../lib/format'
import { inputClass, labelClass, primaryButtonClass, segmentClass } from '../../lib/ui'
import type { Debt, DebtDirection, DebtInput } from '../../types'
import { AmountInput } from '../ui/AmountInput'
import { Sheet } from '../ui/Sheet'

interface Props {
  initial?: Debt
  /** Arah default saat tambah baru */
  defaultDirection: DebtDirection
  /** Nama-nama yang pernah dipakai, untuk saran ketik */
  personSuggestions: string[]
  onSubmit: (input: DebtInput) => void
  onClose: () => void
}

export function DebtForm({ initial, defaultDirection, personSuggestions, onSubmit, onClose }: Props) {
  const [direction, setDirection] = useState<DebtDirection>(initial?.direction ?? defaultDirection)
  const [person, setPerson] = useState(initial?.person ?? '')
  const [amount, setAmount] = useState(initial?.amount ?? 0)
  const [date, setDate] = useState(initial?.date ?? todayISO())
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [error, setError] = useState('')

  const isEdit = Boolean(initial)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!person.trim()) return setError('Nama orangnya wajib diisi')
    if (amount <= 0) return setError('Nominal harus lebih dari 0')
    if (!date) return setError('Tanggal wajib diisi')
    if (dueDate && dueDate < date) return setError('Jatuh tempo tidak boleh sebelum tanggal hutang')
    onSubmit({ direction, person: person.trim(), amount, date, dueDate, note: note.trim() })
  }

  return (
    <Sheet title={isEdit ? 'Edit Hutang' : 'Catat Hutang'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setDirection('owed_to_me')}
            className={segmentClass(direction === 'owed_to_me')}
          >
            Orang hutang ke saya
          </button>
          <button
            type="button"
            onClick={() => setDirection('i_owe')}
            className={segmentClass(direction === 'i_owe')}
          >
            Saya hutang
          </button>
        </div>

        <label className="mt-4 block">
          <span className={labelClass}>
            {direction === 'owed_to_me' ? 'Siapa yang berhutang?' : 'Hutang ke siapa?'}
          </span>
          <input
            type="text"
            list="person-suggestions"
            placeholder="Contoh: Budi"
            maxLength={50}
            autoFocus={!isEdit}
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            className={inputClass}
          />
          <datalist id="person-suggestions">
            {personSuggestions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>

        <label className="mt-4 block">
          <span className={labelClass}>Nominal hutang</span>
          <AmountInput value={amount} onChange={setAmount} />
        </label>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className={labelClass}>Tanggal</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Jatuh tempo (opsional)</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className={labelClass}>Catatan (opsional)</span>
          <input
            type="text"
            placeholder="Contoh: pinjam buat bayar kos"
            maxLength={100}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
          />
        </label>

        {isEdit && (
          <p className="mt-3 text-xs text-slate-500">
            Riwayat pembayaran tetap tersimpan. Kalau nominal diubah jadi lebih kecil dari yang
            sudah dibayar, kelebihannya akan otomatis ditampilkan.
          </p>
        )}

        {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}

        <button type="submit" className={`mt-5 w-full ${primaryButtonClass}`}>
          {isEdit ? 'Simpan Perubahan' : 'Simpan'}
        </button>
      </form>
    </Sheet>
  )
}
