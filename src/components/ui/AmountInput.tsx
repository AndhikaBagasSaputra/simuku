import { formatNumber } from '../../lib/format'

interface Props {
  value: number
  onChange: (value: number) => void
  autoFocus?: boolean
  size?: 'lg' | 'md'
  /** false = tanpa jarak atas (untuk dipakai di baris/grid) */
  spaced?: boolean
}

/** Input nominal Rupiah dengan titik ribuan otomatis */
export function AmountInput({ value, onChange, autoFocus, size = 'lg', spaced = true }: Props) {
  function handleChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 13)
    onChange(digits ? Number(digits) : 0)
  }

  return (
    <div className={`${spaced ? 'mt-1' : ''} flex min-w-0 items-center rounded-xl border border-slate-200 px-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100`}>
      <span className="font-semibold text-slate-400">Rp</span>
      <input
        inputMode="numeric"
        autoFocus={autoFocus}
        placeholder="0"
        value={value ? formatNumber(value) : ''}
        onChange={(e) => handleChange(e.target.value)}
        className={`w-full min-w-0 px-2 font-bold text-slate-800 outline-none ${
          size === 'lg' ? 'py-3 text-2xl' : 'py-2.5 text-lg'
        }`}
      />
    </div>
  )
}
