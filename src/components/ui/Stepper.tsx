interface Props {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
}

/** Tombol − angka + */
export function Stepper({ value, onChange, min = 0, max = 999, label }: Props) {
  const buttonClass =
    'h-8 w-8 text-lg font-bold text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:text-slate-300 disabled:hover:bg-transparent'
  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-200">
      <button
        type="button"
        className={buttonClass}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label={`Kurangi ${label ?? ''}`}
      >
        −
      </button>
      <span className="w-8 text-center font-semibold text-slate-800 tabular-nums">{value}</span>
      <button
        type="button"
        className={buttonClass}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label={`Tambah ${label ?? ''}`}
      >
        +
      </button>
    </div>
  )
}
