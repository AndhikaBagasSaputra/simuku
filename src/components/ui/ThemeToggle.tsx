import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type ThemePreference } from '../../hooks/useTheme'

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Terang', icon: Sun },
  { value: 'dark', label: 'Gelap', icon: Moon },
  { value: 'system', label: 'Sistem', icon: Monitor },
]

/** Pilihan tema: Terang / Gelap / Ikuti sistem */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme()
  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1" role="radiogroup" aria-label="Tema tampilan">
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = preference === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setPreference(value)}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition ${
              active ? 'bg-surface text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        )
      })}
    </div>
  )
}

/** Tombol cepat ganti terang/gelap (untuk header di HP) */
export function ThemeQuickButton() {
  const { resolved, setPreference } = useTheme()
  const isDark = resolved === 'dark'
  return (
    <button
      type="button"
      onClick={() => setPreference(isDark ? 'light' : 'dark')}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-slate-600 shadow-sm hover:bg-slate-100"
      aria-label={isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
      title={isDark ? 'Mode terang' : 'Mode gelap'}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  )
}
