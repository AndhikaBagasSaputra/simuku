import type { ResolvedTheme } from '../hooks/useTheme'
import { CHART_COLORS } from './categories'

/**
 * Versi gelap dari palet grafik (urutan sama), sudah divalidasi
 * kontras >= 3:1 dan aman buta warna terhadap latar #151e2e.
 */
const DARK_CHART_COLORS = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767']

/** Ubah warna kategori ke versi tema yang aktif */
export function themedColor(color: string, theme: ResolvedTheme) {
  if (theme === 'light') return color
  const index = CHART_COLORS.indexOf(color)
  return index >= 0 ? DARK_CHART_COLORS[index] : color
}

/** Warna "kerangka" grafik (garis bantu, sumbu, celah antar potongan) per tema */
export function chartChrome(theme: ResolvedTheme) {
  return theme === 'dark'
    ? { surface: '#151e2e', grid: '#2a3850', axis: '#3d4d66', tick: '#94a3b8', cursor: '#1e293b', income: '#199e70', expense: '#e66767' }
    : { surface: '#ffffff', grid: '#e1e0d9', axis: '#c3c2b7', tick: '#898781', cursor: '#f1f5f9', income: '#1baf7a', expense: '#e34948' }
}
