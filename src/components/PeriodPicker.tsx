import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { formatMonth, shiftMonth } from '../lib/format'
import { describeRange, getPresetLabel, getRange, PRESETS, type Period, type PresetId } from '../lib/period'
import { Sheet } from './ui/Sheet'

interface Props {
  period: Period
  onChange: (period: Period) => void
}

export function PeriodPicker({ period, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [customStart, setCustomStart] = useState(period.start)
  const [customEnd, setCustomEnd] = useState(period.end)

  function openSheet() {
    // Isi tanggal custom dengan rentang yang sedang aktif
    const { start, end } = getRange(period)
    if (start && end) {
      setCustomStart(start)
      setCustomEnd(end)
    }
    setShowCustom(period.preset === 'custom')
    setOpen(true)
  }

  function selectPreset(preset: PresetId) {
    if (preset === 'custom') return setShowCustom(true)
    onChange({ ...period, preset })
    setOpen(false)
  }

  function applyCustom() {
    if (!customStart || !customEnd) return
    onChange({ ...period, preset: 'custom', start: customStart, end: customEnd })
    setOpen(false)
  }

  const arrowClass =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-200 active:bg-slate-300'
  const isMonth = period.preset === 'month'

  return (
    <>
      <div className="flex items-center gap-1">
        {isMonth && (
          <button
            type="button"
            className={arrowClass}
            onClick={() => onChange({ ...period, month: shiftMonth(period.month, -1) })}
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        )}

        <button
          type="button"
          onClick={openSheet}
          className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-1.5 hover:bg-slate-200/70"
        >
          <CalendarDays className="h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
          <span className="min-w-0 text-center">
            <span className="block truncate font-semibold text-slate-800">
              {isMonth ? formatMonth(period.month) : getPresetLabel(period.preset)}
            </span>
            {!isMonth && period.preset !== 'all' && (
              <span className="block truncate text-xs text-slate-500">{describeRange(period)}</span>
            )}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
        </button>

        {isMonth && (
          <button
            type="button"
            className={arrowClass}
            onClick={() => onChange({ ...period, month: shiftMonth(period.month, 1) })}
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {open && (
        <Sheet title="Pilih Periode" onClose={() => setOpen(false)}>
            <ul className="space-y-1">
              {PRESETS.map((p) => {
                const active = p.id === 'custom' ? showCustom : !showCustom && period.preset === p.id
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => selectPreset(p.id)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left ${
                        active ? 'bg-emerald-50 font-semibold text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {p.label}
                      {active && <span className="font-bold">✓</span>}
                    </button>
                  </li>
                )
              })}
            </ul>

            {showCustom && (
              <div className="mt-3 rounded-xl border border-slate-200 p-3">
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-xs font-medium text-slate-500">Dari</span>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:border-emerald-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-slate-500">Sampai</span>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:border-emerald-500"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={applyCustom}
                  disabled={!customStart || !customEnd}
                  className="mt-3 w-full rounded-xl bg-primary py-2.5 font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
                >
                  Terapkan
                </button>
              </div>
            )}
        </Sheet>
      )}
    </>
  )
}
