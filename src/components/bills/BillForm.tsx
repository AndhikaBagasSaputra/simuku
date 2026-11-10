import { useState, type FormEvent } from 'react'
import { getCategoriesByType } from '../../lib/categories'
import { todayISO } from '../../lib/format'
import { FREQUENCY_LABEL } from '../../lib/recurring'
import { inputClass, labelClass, primaryButtonClass, segmentClass } from '../../lib/ui'
import type { BillFrequency, RecurringBill, RecurringBillInput } from '../../types'
import { AmountInput } from '../ui/AmountInput'
import { Sheet } from '../ui/Sheet'
import { Stepper } from '../ui/Stepper'

interface Props {
  initial?: RecurringBill
  onSubmit: (input: RecurringBillInput) => void
  onClose: () => void
}

export function BillForm({ initial, onSubmit, onClose }: Props) {
  const [kind, setKind] = useState<RecurringBill['kind']>(initial?.kind ?? 'subscription')
  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(initial?.amount ?? 0)
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? 'tagihan')
  const [frequency, setFrequency] = useState<BillFrequency>(initial?.frequency ?? 'monthly')
  const [firstDueDate, setFirstDueDate] = useState(initial?.firstDueDate ?? todayISO())
  const [installments, setInstallments] = useState(initial?.installments || 12)
  const [note, setNote] = useState(initial?.note ?? '')
  const [error, setError] = useState('')

  const paidCount = initial?.payments.length ?? 0

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Nama tagihan wajib diisi')
    if (amount <= 0) return setError('Nominal harus lebih dari 0')
    if (!firstDueDate) return setError('Tanggal jatuh tempo wajib diisi')
    onSubmit({
      kind,
      name: name.trim(),
      amount,
      categoryId,
      frequency,
      firstDueDate,
      installments: kind === 'installment' ? installments : 0,
      note: note.trim(),
    })
  }

  return (
    <Sheet title={initial ? 'Edit Tagihan' : 'Tagihan Rutin Baru'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          <button type="button" onClick={() => setKind('subscription')} className={segmentClass(kind === 'subscription')}>
            Langganan
          </button>
          <button type="button" onClick={() => setKind('installment')} className={segmentClass(kind === 'installment')}>
            Cicilan
          </button>
        </div>

        <label className="mt-4 block">
          <span className={labelClass}>Nama tagihan</span>
          <input
            type="text"
            placeholder={kind === 'installment' ? 'Contoh: Cicilan HP' : 'Contoh: Netflix, WiFi, Kos'}
            maxLength={50}
            autoFocus={!initial}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="mt-4 block">
          <span className={labelClass}>Nominal per tagihan</span>
          <AmountInput value={amount} onChange={setAmount} />
        </label>

        <div className="mt-4">
          <span className={labelClass}>Frekuensi</span>
          <div className="mt-1 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
            {(['weekly', 'monthly', 'yearly'] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFrequency(f)} className={segmentClass(frequency === f)}>
                {FREQUENCY_LABEL[f]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className={labelClass}>{initial ? 'Jatuh tempo pertama' : 'Jatuh tempo berikutnya'}</span>
            <input
              type="date"
              value={firstDueDate}
              onChange={(e) => setFirstDueDate(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Kategori</span>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={`${inputClass} bg-surface`}>
              {getCategoriesByType('expense').map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {kind === 'installment' && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
            <div>
              <p className={labelClass}>{initial ? 'Total cicilan' : 'Sisa cicilan'}</p>
              <p className="text-xs text-slate-500">
                {initial
                  ? `Sudah dibayar ${paidCount} kali`
                  : 'Berapa kali lagi yang harus dibayar'}
              </p>
            </div>
            <Stepper value={installments} min={Math.max(1, paidCount)} max={360} onChange={setInstallments} label="cicilan" />
          </div>
        )}

        <label className="mt-4 block">
          <span className={labelClass}>Catatan (opsional)</span>
          <input type="text" maxLength={100} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
        </label>

        {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}

        <button type="submit" className={`mt-5 w-full ${primaryButtonClass}`}>
          {initial ? 'Simpan Perubahan' : 'Simpan'}
        </button>
      </form>
    </Sheet>
  )
}
