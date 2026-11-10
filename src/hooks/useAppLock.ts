import { createContext, useContext } from 'react'

export interface AppLockContextValue {
  /** Kunci PIN sedang aktif */
  enabled: boolean
  /** Menit ditinggal sebelum terkunci lagi (0 = langsung) */
  timeoutMin: number
  /** Pasang PIN baru atau ganti PIN lama */
  setPin: (pin: string) => Promise<void>
  setTimeoutMin: (minutes: number) => void
  /** Matikan kunci PIN */
  disable: () => void
  lockNow: () => void
}

export const AppLockContext = createContext<AppLockContextValue | null>(null)

export function useAppLock() {
  const value = useContext(AppLockContext)
  if (!value) throw new Error('useAppLock harus dipakai di dalam LockProvider')
  return value
}
