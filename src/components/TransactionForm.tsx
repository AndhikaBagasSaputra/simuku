import { useState, type FormEvent } from 'react'
import { getCategoriesByType } from '../lib/categories'
import { todayISO } from '../lib/format'
import { dangerButtonClass, inputClass, labelClass, primaryButtonClass } from '../lib/ui'
import type { Transaction, TransactionInput, TransactionType } from '../types'
import { AmountInput } from './ui/AmountInput'
import { Sheet } from './ui/Sheet'

interface Props {
  /** Diisi saat mode edit, kosong saat tambah baru */
  initial?: Transaction
  onSubmit: (input: TransactionInput) => void
  onDelete?: () => void
  onClose: () => void
}

export function TransactionForm({ initial, onSubmit, onDelete, onClose }: Props) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense')
  const [amount, setAmount] = useState(initial?.amount ?? 0)
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '')
  const [date, setDate] = useState(initial?.date ?? todayISO())
  const [note, setNote] = useState(initial?.note ?? '')
  const [error, setError] = useState('')

  const categories = getCategoriesByType(type)
  const isEdit = Boolean(initial)

  function changeType(newType: TransactionType) {
    setType(newType)
    setCategoryId('') // kategori pemasukan & pengeluaran berbeda
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (amount <= 0) return setError('Nominal harus lebih dari 0')
    if (!categoryId) return setError('Pilih kategori dulu')
    if (!date) return setError('Tanggal wajib diisi')
    onSubmit({ type, amount, categoryId, date, note: note.trim() })
  }

  function handleDelete() {
    onDelete?.() // bisa dibatalkan lewat tombol "Batalkan" di notifikasi
  }

  return (
    <Sheet title={isEdit ? 'Edit Transaksi' : 'Tambah Transaksi'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {/* Jenis transaksi */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          {(
            [
              ['expense', 'Pengeluaran', 'bg-rose-500'],
              ['income', 'Pemasukan', 'bg-emerald-500'],
            ] as const
          ).map(([value, label, activeColor]) => (
            <button
              key={value}
              type="button"
              onClick={() => changeType(value)}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                type === value ? `${activeColor} text-white shadow-sm` : 'text-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="mt-4 block">
          <span className={labelClass}>Nominal</span>
          <AmountInput value={amount} onChange={setAmount} autoFocus={!isEdit} />
        </label>

        <div className="mt-4">
          <span className={labelClass}>Kategori</span>
          <div className="mt-1 grid grid-cols-4 gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-xs transition ${
                  categoryId === c.id
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-2xl">{c.icon}</span>
                <span className="text-center leading-tight">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="mt-4 block">
          <span className={labelClass}>Tanggal</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="mt-4 block">
          <span className={labelClass}>Catatan (opsional)</span>
          <input
            type="text"
            placeholder="Contoh: makan siang di kantor"
            maxLength={100}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
          />
        </label>

        {error && <p className="mt-3 text-sm font-medium text-rose-600">⚠ {error}</p>}

        <div className="mt-5 flex gap-2">
          {isEdit && onDelete && (
            <button type="button" onClick={handleDelete} className={dangerButtonClass}>
              Hapus
            </button>
          )}
          <button type="submit" className={`flex-1 ${primaryButtonClass}`}>
            {isEdit ? 'Simpan Perubahan' : 'Simpan'}
          </button>
        </div>
      </form>
    </Sheet>
  )
}
