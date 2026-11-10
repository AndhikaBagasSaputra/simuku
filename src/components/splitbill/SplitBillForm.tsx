import { useState, type FormEvent, type ReactNode } from 'react'
import { getCategoriesByType } from '../../lib/categories'
import { todayISO } from '../../lib/format'
import { calculateSplit, ME_ID, ME_NAME, toSplitInput } from '../../lib/splitBill'
import { fieldClass, inputClass, labelClass, primaryButtonClass, segmentClass } from '../../lib/ui'
import type { SplitBill, SplitBillInput, SplitDiscount, SplitItem } from '../../types'
import { AmountInput } from '../ui/AmountInput'
import { Sheet } from '../ui/Sheet'
import { SplitItemCard } from './SplitItemCard'
import { SplitResultView } from './SplitResultView'

interface Props {
  initial?: SplitBill
  defaultPaymentInfo: string
  personSuggestions: string[]
  onSubmit: (input: SplitBillInput) => void
  onClose: () => void
}

const FEE_PRESETS = ['Ongkir', 'Biaya layanan', 'Pajak', 'Biaya kemasan']

function newItem(): SplitItem {
  return { id: crypto.randomUUID(), name: '', price: 0, qty: 1, mode: 'qty', allocations: {} }
}

function emptyDraft(paymentInfo: string): SplitBillInput {
  return {
    title: '',
    date: todayISO(),
    categoryId: 'makan',
    payerId: ME_ID,
    participants: [{ id: ME_ID, name: ME_NAME }],
    items: [newItem()],
    fees: [],
    discount: { type: 'none', value: 0, max: 0 },
    paymentInfo,
  }
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="mb-2 font-semibold text-slate-800">{title}</h3>
      {children}
    </section>
  )
}

export function SplitBillForm({ initial, defaultPaymentInfo, personSuggestions, onSubmit, onClose }: Props) {
  const [draft, setDraft] = useState<SplitBillInput>(() =>
    initial ? toSplitInput(initial) : emptyDraft(defaultPaymentInfo),
  )
  const [newPerson, setNewPerson] = useState('')
  const [error, setError] = useState('')

  const calc = calculateSplit(draft)
  const categories = getCategoriesByType('expense')
  // Teman yang ada di daftar tapi tidak kebagian item apa pun.
  // Mereka harus dipilihkan item atau dihapus, dan tidak bisa dipilih sebagai pembayar.
  // "Saya" boleh tanpa item (misalnya cuma menalangi).
  const idlePeople = draft.participants.filter(
    (p) => p.id !== ME_ID && !calc.shares.some((s) => s.participant.id === p.id),
  )
  const idleIds = new Set(idlePeople.map((p) => p.id))

  function update(patch: Partial<SplitBillInput>) {
    setDraft((d) => ({ ...d, ...patch }))
  }

  function updateDiscount(patch: Partial<SplitDiscount>) {
    setDraft((d) => ({ ...d, discount: { ...d.discount, ...patch } }))
  }

  function updateItem(id: string, patch: Partial<SplitItem>) {
    setDraft((d) => ({ ...d, items: d.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) }))
  }

  // ----- Peserta -----
  function addPerson() {
    const name = newPerson.trim()
    if (!name) return
    if (draft.participants.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      return setError(`${name} sudah ada di daftar`)
    }
    const person = { id: crypto.randomUUID(), name }
    setDraft((d) => ({
      ...d,
      participants: [...d.participants, person],
      // Item patungan: orang baru otomatis ikut
      items: d.items.map((it) =>
        it.mode === 'shared' ? { ...it, allocations: { ...it.allocations, [person.id]: 1 } } : it,
      ),
    }))
    setNewPerson('')
    setError('')
  }

  function removePerson(id: string) {
    setDraft((d) => ({
      ...d,
      participants: d.participants.filter((p) => p.id !== id),
      payerId: d.payerId === id ? ME_ID : d.payerId,
      items: d.items.map((it) => {
        const allocations = { ...it.allocations }
        delete allocations[id]
        return { ...it, allocations }
      }),
    }))
  }

  // ----- Biaya lain -----
  function addFee(name = '') {
    update({ fees: [...draft.fees, { id: crypto.randomUUID(), name, amount: 0 }] })
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!draft.title.trim()) return setError('Judul wajib diisi')
    if (draft.participants.length < 2) return setError('Tambahkan minimal 1 teman')
    if (draft.items.some((it) => !it.name.trim() || it.price <= 0)) {
      return setError('Lengkapi nama & harga semua item')
    }
    if (calc.issues.length) return setError(calc.issues[0])
    if (idlePeople.length) {
      return setError(
        `${idlePeople.map((p) => p.name).join(', ')} belum memilih item. Pilihkan item atau hapus dari daftar.`,
      )
    }
    if (draft.discount.type === 'percent' && draft.discount.value <= 0) {
      return setError('Isi persen diskon, atau pilih "Tanpa"')
    }
    onSubmit({
      ...draft,
      title: draft.title.trim(),
      items: draft.items.map((it) => ({ ...it, name: it.name.trim() })),
      fees: draft.fees
        .filter((f) => f.amount > 0)
        .map((f) => ({ ...f, name: f.name.trim() || 'Biaya lain' })),
      paymentInfo: draft.paymentInfo.trim(),
    })
  }

  const suggestions = personSuggestions.filter(
    (name) => !draft.participants.some((p) => p.name.toLowerCase() === name.toLowerCase()),
  )

  return (
    <Sheet title={initial ? 'Edit Split Bill' : 'Split Bill Baru'} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit}>
        {/* Info */}
        <label className="block">
          <span className={labelClass}>Judul</span>
          <input
            type="text"
            placeholder="Contoh: Makan ayam bakar"
            maxLength={60}
            autoFocus={!initial}
            value={draft.title}
            onChange={(e) => update({ title: e.target.value })}
            className={inputClass}
          />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block">
            <span className={labelClass}>Tanggal</span>
            <input
              type="date"
              value={draft.date}
              onChange={(e) => update({ date: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Kategori</span>
            <select
              value={draft.categoryId}
              onChange={(e) => update({ categoryId: e.target.value })}
              className={`${inputClass} bg-surface`}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Peserta */}
        <Section title="👥 Siapa saja yang ikut?">
          <div className="flex flex-wrap gap-2">
            {draft.participants.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1.5 pr-1.5 pl-3 text-sm font-medium text-slate-700"
              >
                {p.name}
                {p.id !== ME_ID ? (
                  <button
                    type="button"
                    onClick={() => removePerson(p.id)}
                    className="h-5 w-5 rounded-full text-xs text-slate-400 hover:bg-rose-100 hover:text-rose-600"
                    aria-label={`Hapus ${p.name}`}
                  >
                    ✕
                  </button>
                ) : (
                  <span className="w-1.5" />
                )}
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              list="split-person-suggestions"
              placeholder="Nama teman"
              maxLength={40}
              value={newPerson}
              onChange={(e) => setNewPerson(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addPerson()
                }
              }}
              className={fieldClass}
            />
            <datalist id="split-person-suggestions">
              {suggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            <button
              type="button"
              onClick={addPerson}
              className="shrink-0 rounded-xl bg-gray-800 px-4 font-semibold text-white hover:bg-gray-900"
            >
              Tambah
            </button>
          </div>
        </Section>

        {/* Item */}
        <Section title="🍽️ Item yang dibeli">
          <div className="space-y-3">
            {draft.items.map((item, i) => (
              <SplitItemCard
                key={item.id}
                item={item}
                index={i}
                participants={draft.participants}
                onChange={(patch) => updateItem(item.id, patch)}
                onRemove={
                  draft.items.length > 1
                    ? () => update({ items: draft.items.filter((it) => it.id !== item.id) })
                    : undefined
                }
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => update({ items: [...draft.items, newItem()] })}
            className="mt-3 w-full rounded-xl border border-dashed border-slate-300 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            + Tambah item
          </button>
        </Section>

        {/* Diskon */}
        <Section title="🏷️ Diskon">
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
            {(
              [
                ['none', 'Tanpa'],
                ['percent', 'Persen'],
                ['fixed', 'Nominal'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => updateDiscount({ type: value, value: 0, max: 0 })}
                className={segmentClass(draft.discount.type === value)}
              >
                {label}
              </button>
            ))}
          </div>

          {draft.discount.type === 'percent' && (
            <div className="mt-3 grid grid-cols-[6rem_1fr] gap-3">
              <label className="block">
                <span className={labelClass}>Persen</span>
                <div className="mt-1 flex items-center rounded-xl border border-slate-200 px-3 focus-within:border-emerald-500">
                  <input
                    inputMode="numeric"
                    placeholder="0"
                    value={draft.discount.value || ''}
                    onChange={(e) => {
                      const n = Number(e.target.value.replace(/\D/g, '').slice(0, 3))
                      updateDiscount({ value: Math.min(n, 100) })
                    }}
                    className="w-full py-2.5 text-lg font-bold text-slate-800 outline-none"
                  />
                  <span className="font-semibold text-slate-400">%</span>
                </div>
              </label>
              <label className="block">
                <span className={labelClass}>Maks diskon (opsional)</span>
                <AmountInput value={draft.discount.max} onChange={(max) => updateDiscount({ max })} size="md" />
              </label>
            </div>
          )}

          {draft.discount.type === 'fixed' && (
            <label className="mt-3 block">
              <span className={labelClass}>Nominal diskon</span>
              <AmountInput value={draft.discount.value} onChange={(value) => updateDiscount({ value })} size="md" />
            </label>
          )}

          {draft.discount.type !== 'none' && (
            <p className="mt-2 text-xs text-slate-500">
              💡 Diskon dibagi sesuai porsi belanja: yang pesan lebih banyak dapat potongan lebih besar.
            </p>
          )}
        </Section>

        {/* Biaya lain */}
        <Section title="🛵 Biaya lain (dibagi rata per orang)">
          {draft.fees.length > 0 && (
            <div className="space-y-2">
              {draft.fees.map((fee) => (
                // Nama di atas, nominal satu baris penuh di bawah, supaya angka tidak terpotong di HP kecil
                <div key={fee.id} data-fee-row className="space-y-2 rounded-xl border border-slate-200 p-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nama biaya"
                      maxLength={30}
                      value={fee.name}
                      onChange={(e) =>
                        update({ fees: draft.fees.map((f) => (f.id === fee.id ? { ...f, name: e.target.value } : f)) })
                      }
                      className={fieldClass}
                    />
                    <button
                      type="button"
                      onClick={() => update({ fees: draft.fees.filter((f) => f.id !== fee.id) })}
                      className="h-9 w-9 shrink-0 rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Hapus biaya"
                    >
                      ✕
                    </button>
                  </div>
                  <AmountInput
                    value={fee.amount}
                    onChange={(amount) =>
                      update({ fees: draft.fees.map((f) => (f.id === fee.id ? { ...f, amount } : f)) })
                    }
                    size="md"
                    spaced={false}
                  />
                </div>
              ))}
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {FEE_PRESETS.filter((name) => !draft.fees.some((f) => f.name === name)).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => addFee(name)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                + {name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => addFee()}
              className="rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              + Lainnya
            </button>
          </div>
        </Section>

        {/* Pembayar */}
        <Section title="💳 Siapa yang bayar dulu?">
          <div className="flex flex-wrap gap-2">
            {draft.participants.map((p) => {
              const selected = draft.payerId === p.id
              // Yang belum memilih item tidak bisa dipilih sebagai pembayar
              const blocked = idleIds.has(p.id) && !selected
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={blocked}
                  title={blocked ? `${p.name} belum memilih item` : undefined}
                  onClick={() => update({ payerId: p.id })}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
                    selected
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {selected ? '✓ ' : ''}
                  {p.name}
                </button>
              )
            })}
          </div>
          {idlePeople.length > 0 && (
            <p className="mt-2 text-xs text-amber-700">
              ⚠ Yang belum memilih item tidak bisa dipilih sebagai pembayar.
            </p>
          )}
          <label className="mt-3 block">
            <span className={labelClass}>Info transfer (opsional)</span>
            <input
              type="text"
              placeholder="Contoh: BCA 1234567 a.n. Budi"
              maxLength={80}
              value={draft.paymentInfo}
              onChange={(e) => update({ paymentInfo: e.target.value })}
              className={inputClass}
            />
          </label>
          <p className="mt-2 text-xs text-slate-500">
            {draft.payerId === ME_ID
              ? '💡 Bagianmu masuk ke pengeluaran, bagian teman otomatis jadi piutang.'
              : `💡 Bagianmu masuk ke pengeluaran sekaligus jadi hutang ke ${
                  draft.participants.find((p) => p.id === draft.payerId)?.name
                }.`}
          </p>
        </Section>

        {/* Hasil */}
        <Section title="🧮 Hasil">
          {calc.issues.length > 0 && (
            <ul className="mb-3 space-y-1 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              {calc.issues.map((issue) => (
                <li key={issue}>⚠ {issue}</li>
              ))}
            </ul>
          )}
          {idlePeople.length > 0 && (
            <div role="alert" className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              <p className="font-semibold">⚠ Ada yang belum memilih item</p>
              <p className="mt-0.5 text-xs">Pilihkan item di atas, atau hapus dari daftar peserta.</p>
              <ul className="mt-2 space-y-1.5">
                {idlePeople.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate font-medium">{p.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        removePerson(p.id)
                        setError('')
                      }}
                      className="shrink-0 rounded-lg border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                    >
                      Hapus
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <SplitResultView bill={draft} calc={calc} />
        </Section>

        <div className="sticky -bottom-5 -mx-5 mt-5 border-t border-slate-100 bg-surface px-5 pt-3 pb-5 lg:-bottom-7 lg:-mx-7 lg:px-7 lg:pb-7">
          {error && <p className="mb-2 text-sm font-medium text-rose-600">⚠ {error}</p>}
          <button type="submit" className={`w-full ${primaryButtonClass}`}>
            {initial ? 'Simpan Perubahan' : 'Simpan Split Bill'}
          </button>
        </div>
      </form>
    </Sheet>
  )
}
