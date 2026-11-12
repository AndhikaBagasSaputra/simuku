import { useState, type FormEvent } from 'react'
import { getCategoriesByType } from '../lib/categories'
import { addDays, todayISO } from '../lib/format'
import { dangerButtonClass, inputClass, labelClass, primaryButtonClass } from '../lib/ui'
import type { Transaction, TransactionInput, TransactionType } from '../types'
import { AmountInput } from './ui/AmountInput'
import { CategoryIcon } from './ui/CategoryIcon'
import { Sheet } from './ui/Sheet'

interface Props {
  /** Diisi saat mode edit, kosong saat tambah baru */
  initial?: Transaction
  onSubmit: (input: TransactionInput) => void
  onDelete?: () => void
  onClose: () => void
}

const FORM_ID = 'transaction-form'

type Errors = { amount?: string; category?: string; date?: string }

/** Pilihan jenis: warna aktifnya sama dengan warna di bagian lain aplikasi dan lolos kontras */
const TYPES = [
  ['expense', 'Pengeluaran', 'bg-alert'],
  ['income', 'Pemasukan', 'bg-primary'],
] as const

export function TransactionForm({ initial, onSubmit, onDelete, onClose }: Props) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense')
  const [amount, setAmount] = useState(initial?.amount ?? 0)
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '')
  const [date, setDate] = useState(initial?.date ?? todayISO())
  const [note, setNote] = useState(initial?.note ?? '')
  const [errors, setErrors] = useState<Errors>({})

  const categories = getCategoriesByType(type)
  const isEdit = Boolean(initial)
  const today = todayISO()
  const yesterday = addDays(today, -1)

  // Ada isian yang belum disimpan? Dipakai supaya form tidak tertutup tanpa sengaja
  const dirty = initial
    ? type !== initial.type ||
      amount !== initial.amount ||
      categoryId !== initial.categoryId ||
      date !== initial.date ||
      note.trim() !== initial.note
    : amount > 0 || categoryId !== '' || note.trim() !== '' || date !== today

  function clearError(field: keyof Errors) {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  function changeType(newType: TransactionType) {
    if (newType === type) return
    setType(newType)
    setCategoryId('') // kategori pemasukan & pengeluaran berbeda
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next: Errors = {}
    if (amount <= 0) next.amount = 'Isi nominalnya dulu'
    if (!categoryId) next.category = 'Pilih salah satu kategori'
    if (!date) next.date = 'Tanggal wajib diisi'
    setErrors(next)
    if (next.amount) return document.getElementById('tx-amount')?.focus()
    if (next.category || next.date) return
    onSubmit({ type, amount, categoryId, date, note: note.trim() })
  }

  const footer = (
    <div className="flex gap-2">
      {isEdit && onDelete && (
        // Hapus bisa dibatalkan lewat tombol "Batalkan" di notifikasi
        <button type="button" onClick={onDelete} className={dangerButtonClass}>
          Hapus
        </button>
      )}
      <button type="submit" form={FORM_ID} className={`flex-1 ${primaryButtonClass}`}>
        {isEdit ? 'Simpan Perubahan' : 'Simpan'}
      </button>
    </div>
  )

  return (
    <Sheet title={isEdit ? 'Edit Transaksi' : 'Tambah Transaksi'} onClose={onClose} footer={footer} dirty={dirty}>
      <form id={FORM_ID} onSubmit={handleSubmit} noValidate>
        {/* Jenis transaksi */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Jenis transaksi">
          {TYPES.map(([value, label, activeColor]) => (
            <button
              key={value}
              type="button"
              onClick={() => changeType(value)}
              aria-pressed={type === value}
              className={`flex min-h-9 items-center justify-center rounded-lg text-sm font-semibold transition pointer-coarse:min-h-11 ${
                type === value ? `${activeColor} text-white shadow-sm` : 'text-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <label htmlFor="tx-amount" className={labelClass}>
            Nominal
          </label>
          <AmountInput
            id="tx-amount"
            value={amount}
            onChange={(v) => {
              setAmount(v)
              if (v > 0) clearError('amount')
            }}
            autoFocus={!isEdit}
            invalid={Boolean(errors.amount)}
            describedBy={errors.amount ? 'tx-amount-error' : undefined}
          />
          {errors.amount && (
            <p id="tx-amount-error" role="alert" className="mt-1.5 text-sm font-medium text-rose-600">
              {errors.amount}
            </p>
          )}
        </div>

        <fieldset className="mt-4">
          <legend className={labelClass}>Kategori</legend>
          <div className="mt-1 grid grid-cols-4 gap-2">
            {categories.map((c) => {
              const selected = categoryId === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCategoryId(c.id)
                    clearError('category')
                  }}
                  aria-pressed={selected}
                  className={`flex min-w-0 flex-col items-center gap-1 rounded-xl border p-2 text-xs transition ${
                    selected
                      ? 'border-emerald-600 bg-emerald-50 font-semibold text-emerald-700'
                      : errors.category
                        ? 'border-rose-200 text-slate-600 hover:bg-slate-50'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CategoryIcon categoryId={c.id} />
                  <span className="w-full text-center leading-tight break-words hyphens-auto" lang="id">
                    {c.name}
                  </span>
                </button>
              )
            })}
          </div>
          {errors.category && (
            <p role="alert" className="mt-1.5 text-sm font-medium text-rose-600">
              {errors.category}
            </p>
          )}
        </fieldset>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="tx-date" className={labelClass}>
              Tanggal
            </label>
            {/* Pintasan supaya tidak perlu membuka kalender untuk hari ini / kemarin */}
            <div className="flex gap-1.5">
              {(
                [
                  [today, 'Hari ini'],
                  [yesterday, 'Kemarin'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setDate(value)
                    clearError('date')
                  }}
                  aria-pressed={date === value}
                  className={`inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-semibold transition pointer-coarse:min-h-10 ${
                    date === value
                      ? 'border-primary bg-primary text-white'
                      : 'border-slate-200 bg-surface text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <input
            id="tx-date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              if (e.target.value) clearError('date')
            }}
            aria-invalid={Boolean(errors.date) || undefined}
            className={inputClass}
          />
          {errors.date && (
            <p role="alert" className="mt-1.5 text-sm font-medium text-rose-600">
              {errors.date}
            </p>
          )}
          {date > today && (
            <p className="mt-1.5 text-xs text-amber-800">Tanggal ini di masa depan. Pastikan sudah benar.</p>
          )}
        </div>

        <label className="mt-4 block">
          <span className={labelClass}>Catatan (opsional)</span>
          <input
            type="text"
            placeholder="Contoh: makan siang di kantor"
            maxLength={100}
            enterKeyHint="done"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
          />
        </label>
      </form>
    </Sheet>
  )
}
