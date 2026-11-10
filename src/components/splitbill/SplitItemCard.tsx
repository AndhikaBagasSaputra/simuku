import { formatRupiah } from '../../lib/format'
import { inputClass, labelClass, segmentClass } from '../../lib/ui'
import type { SplitItem, SplitParticipant } from '../../types'
import { AmountInput } from '../ui/AmountInput'
import { Stepper } from '../ui/Stepper'

interface Props {
  item: SplitItem
  index: number
  participants: SplitParticipant[]
  onChange: (patch: Partial<SplitItem>) => void
  onRemove?: () => void
}

export function SplitItemCard({ item, index, participants, onChange, onRemove }: Props) {
  const taken = participants.reduce((sum, p) => sum + (item.allocations[p.id] ?? 0), 0)
  const left = item.qty - taken

  function setAllocation(participantId: string, value: number) {
    onChange({ allocations: { ...item.allocations, [participantId]: value } })
  }

  function changeMode(mode: SplitItem['mode']) {
    if (mode === item.mode) return
    // Mode patungan: default semua orang ikut. Mode porsi: mulai dari kosong.
    const allocations =
      mode === 'shared' ? Object.fromEntries(participants.map((p) => [p.id, 1])) : {}
    onChange({ mode, allocations })
  }

  return (
    <div className="rounded-2xl border border-slate-200 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400">ITEM {index + 1}</span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-md px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
          >
            Hapus item
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Nama item, contoh: Ayam bakar"
        maxLength={50}
        value={item.name}
        onChange={(e) => onChange({ name: e.target.value })}
        className={inputClass}
      />

      <div className="mt-2 flex items-end gap-3">
        <label className="block flex-1">
          <span className={labelClass}>Harga satuan</span>
          <AmountInput value={item.price} onChange={(price) => onChange({ price })} size="md" />
        </label>
        <div>
          <span className={labelClass}>Jumlah</span>
          <div className="mt-1">
            <Stepper value={item.qty} min={1} onChange={(qty) => onChange({ qty })} label="jumlah" />
          </div>
        </div>
      </div>
      {item.qty > 1 && item.price > 0 && (
        <p className="mt-1 text-xs text-slate-500">
          {item.qty} x {formatRupiah(item.price)} = {formatRupiah(item.qty * item.price)}
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
        <button type="button" onClick={() => changeMode('qty')} className={segmentClass(item.mode === 'qty')}>
          Per porsi
        </button>
        <button type="button" onClick={() => changeMode('shared')} className={segmentClass(item.mode === 'shared')}>
          Patungan
        </button>
      </div>

      {item.mode === 'qty' ? (
        <div className="mt-2">
          <p className="text-xs text-slate-500">Siapa ambil berapa?</p>
          <ul className="mt-1 divide-y divide-slate-100">
            {participants.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-slate-700">{p.name}</span>
                <Stepper
                  value={item.allocations[p.id] ?? 0}
                  onChange={(v) => setAllocation(p.id, v)}
                  label={p.name}
                />
              </li>
            ))}
          </ul>
          <p
            className={`mt-1 text-xs font-semibold ${
              left === 0 ? 'text-emerald-700' : left > 0 ? 'text-amber-700' : 'text-rose-600'
            }`}
          >
            {left === 0
              ? '✓ Semua sudah terbagi'
              : left > 0
                ? `${left} lagi belum ada yang ambil`
                : `Kelebihan ${-left}, jumlah item cuma ${item.qty}`}
          </p>
        </div>
      ) : (
        <div className="mt-2">
          <p className="text-xs text-slate-500">Siapa yang ikut patungan? (dibagi rata)</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {participants.map((p) => {
              const active = (item.allocations[p.id] ?? 0) > 0
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setAllocation(p.id, active ? 0 : 1)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                    active
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-500'
                  }`}
                >
                  {active ? '✓ ' : ''}
                  {p.name}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
