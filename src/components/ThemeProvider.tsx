import { useEffect, useState, type ReactNode } from 'react'
import { ThemeContext, type ResolvedTheme, type ThemePreference } from '../hooks/useTheme'

const STORAGE_KEY = 'keuangan:theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function loadPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  } catch {
    return 'system'
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(loadPreference)
  const [systemDark, setSystemDark] = useState(() => window.matchMedia(DARK_QUERY).matches)
  const resolved: ResolvedTheme = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  // Ikuti perubahan tema sistem (misalnya HP otomatis gelap di malam hari)
  useEffect(() => {
    const mq = window.matchMedia(DARK_QUERY)
    const update = () => setSystemDark(mq.matches)
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Terapkan ke <html> supaya semua warna ikut berubah
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
    // Warna bilah status HP mengikuti latar halaman (bukan hijau), untuk tema terang maupun gelap
    for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
      meta.setAttribute('content', resolved === 'dark' ? '#0b1220' : '#f8fafc')
    }
  }, [resolved])

  function setPreference(next: ThemePreference) {
    setPreferenceState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // abaikan kalau penyimpanan diblokir
    }
  }

  return <ThemeContext.Provider value={{ preference, resolved, setPreference }}>{children}</ThemeContext.Provider>
}
