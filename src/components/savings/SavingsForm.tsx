import { GoalIcon } from '../ui/GoalIcon'
import { GOAL_ICONS, goalIconKey } from '../../lib/goalIcons'
import { useState, type FormEvent } from 'react'
import { inputClass, labelClass, primaryButtonClass } from '../../lib/ui'
import type { SavingsGoal, SavingsGoalInput } from '../../types'
import { AmountInput } from '../ui/AmountInput'
import { Sheet } from '../ui/Sheet'

interface Props {
  initial?: SavingsGoal
  onSubmit: (input: SavingsGoalInput) => void
  onClose: () => void
}

export function SavingsForm({ initial, onSubmit, onClose }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [icon, setIcon] = useState(initial ? goalIconKey(initial.icon) : 'target')
  const [target, setTarget] = useState(initial?.target ?? 0)
  const [deadline, setDeadline] = useState(initial?.deadline ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [error, setError] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Nama target wajib diisi')
    if (target <= 0) return setError('Nominal target harus lebih dari 0')
    onSubmit({ name: name.trim(), icon, target, deadline, note: note.trim() })
  }

  return (
    <Sheet title={initial ? 'Edit Target' : 'Target Tabungan Baru'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <label className="block">
          <span className={labelClass}>Nama target</span>
          <input
            type="text"
            placeholder="Contoh: Laptop baru"
            maxLength={50}
            autoFocus={!initial}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </label>

        <div className="mt-4">
          <span className={labelClass}>Ikon</span>
          <div className="mt-1 grid grid-cols-6 gap-2">
            {Object.keys(GOAL_ICONS).map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIcon(i)}
                aria-label={i}
                aria-pressed={icon === i}
                className={`flex items-center justify-center rounded-xl border py-2.5 ${
                  icon === i
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <GoalIcon icon={i} />
              </button>
            ))}
          </div>
        </div>

        <label className="mt-4 block">
          <span className={labelClass}>Nominal target</span>
          <AmountInput value={target} onChange={setTarget} />
        </label>

        <label className="mt-4 block">
          <span className={labelClass}>Tenggat (opsional)</span>
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass} />
          <span className="mt-1 block text-xs text-slate-500">
            Kalau diisi, aplikasi akan menghitung harus nabung berapa per bulan.
          </span>
        </label>

        <label className="mt-4 block">
          <span className={labelClass}>Catatan (opsional)</span>
          <input
            type="text"
            maxLength={100}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
          />
        </label>

        {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}

        <button type="submit" className={`mt-5 w-full ${primaryButtonClass}`}>
          {initial ? 'Simpan Perubahan' : 'Simpan'}
        </button>
      </form>
    </Sheet>
  )
}
