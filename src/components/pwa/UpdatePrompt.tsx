import { RefreshCw, WifiOff, X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Mendaftarkan service worker (yang membuat aplikasi bisa offline) dan memberi tahu user:
 * - saat aplikasi pertama kali siap dipakai offline
 * - saat ada versi baru (user memilih kapan memuat ulang, supaya tidak mengganggu yang sedang diisi)
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Cek versi baru setiap 1 jam selama aplikasi terbuka
      if (registration) setInterval(() => registration.update(), 60 * 60 * 1000)
    },
  })

  if (!needRefresh && !offlineReady) return null

  function close() {
    setNeedRefresh(false)
    setOfflineReady(false)
  }

  function reload() {
    updateServiceWorker(true)
    // Pengaman: kalau browser tidak memuat ulang sendiri dalam 3 detik, muat ulang manual
    setTimeout(() => window.location.reload(), 3000)
  }

  return (
    <div className="fixed inset-x-0 top-3 z-[70] flex justify-center px-4 lg:pl-64" role="status" aria-live="polite">
      <div className="flex max-w-md items-center gap-3 rounded-xl bg-surface px-4 py-3 text-sm shadow-lg ring-1 ring-slate-200">
        {needRefresh ? (
          <>
            <RefreshCw className="h-5 w-5 shrink-0 text-emerald-600" />
            <span className="text-slate-700">Versi baru Simuku tersedia.</span>
            <button
              type="button"
              onClick={reload}
              className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover"
            >
              Muat ulang
            </button>
          </>
        ) : (
          <>
            <WifiOff className="h-5 w-5 shrink-0 text-emerald-600" />
            <span className="text-slate-700">Simuku siap dipakai tanpa internet.</span>
          </>
        )}
        <button
          type="button"
          onClick={close}
          className="shrink-0 rounded p-1 text-slate-400 hover:text-slate-600"
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
