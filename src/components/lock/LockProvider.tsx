import { useEffect, useState, type ReactNode } from 'react'
import { AppLockContext } from '../../hooks/useAppLock'
import { DEFAULT_TIMEOUT_MIN, getLockConfig, removeLock, savePin, saveTimeout } from '../../lib/appLock'
import { LockScreen } from './LockScreen'

/**
 * Menutupi aplikasi dengan layar PIN saat dibuka dan setelah ditinggal.
 * Aplikasi di belakangnya tetap terpasang (tidak di-unmount), jadi form yang sedang diisi tidak hilang.
 */
export function LockProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState(getLockConfig)
  const [locked, setLocked] = useState(() => getLockConfig() !== null)

  // Kunci otomatis: setelah aplikasi ditinggal (pindah tab / layar mati) atau tidak disentuh
  useEffect(() => {
    if (!config || locked) return
    const limit = config.timeoutMin * 60_000
    let lastActive = Date.now()
    let hiddenAt: number | null = document.hidden ? Date.now() : null

    function touch() {
      lastActive = Date.now()
    }
    function handleVisibility() {
      if (document.hidden) {
        hiddenAt = Date.now()
        return
      }
      if (hiddenAt !== null && Date.now() - hiddenAt >= limit) setLocked(true)
      hiddenAt = null
      lastActive = Date.now()
    }

    // Jeda "Langsung" hanya mengunci saat aplikasi ditinggal, bukan saat sedang dilihat
    const timer =
      limit > 0
        ? setInterval(() => {
            if (Date.now() - lastActive >= limit) setLocked(true)
          }, 10_000)
        : undefined

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('pointerdown', touch)
    window.addEventListener('keydown', touch)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('pointerdown', touch)
      window.removeEventListener('keydown', touch)
    }
  }, [config, locked])

  const value = {
    enabled: config !== null,
    timeoutMin: config?.timeoutMin ?? DEFAULT_TIMEOUT_MIN,
    async setPin(pin: string) {
      setConfig(await savePin(pin))
    },
    setTimeoutMin(minutes: number) {
      setConfig(saveTimeout(minutes))
    },
    disable() {
      removeLock()
      setConfig(null)
    },
    lockNow() {
      if (config) setLocked(true)
    },
  }

  return (
    <AppLockContext.Provider value={value}>
      <div inert={locked} aria-hidden={locked || undefined}>
        {children}
      </div>
      {locked && <LockScreen onUnlock={() => setLocked(false)} />}
    </AppLockContext.Provider>
  )
}
