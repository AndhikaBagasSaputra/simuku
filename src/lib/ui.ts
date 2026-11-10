/** Class Tailwind yang dipakai berulang */

/** Kotak input tanpa margin (untuk dipakai di baris/grid) */
export const fieldClass =
  'w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'

/** Kotak input di bawah label */
export const inputClass = `mt-1 ${fieldClass}`

export const labelClass = 'text-sm font-medium text-slate-600'

export const primaryButtonClass =
  'rounded-xl bg-primary py-3 font-semibold text-white hover:bg-primary-hover active:bg-primary-active disabled:opacity-50'

export const dangerButtonClass =
  'rounded-xl border border-rose-200 px-4 py-3 font-semibold text-rose-600 hover:bg-rose-50'

export function segmentClass(active: boolean) {
  return `flex min-h-9 items-center justify-center rounded-lg px-2 text-sm font-semibold transition pointer-coarse:min-h-11 ${
    active ? 'bg-surface text-slate-800 shadow-sm' : 'text-slate-500'
  }`
}
