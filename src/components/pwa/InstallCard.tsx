import { Download, Share } from 'lucide-react'
import { useInstallPrompt } from '../../hooks/useInstallPrompt'

interface Props {
  /** compact = versi kecil untuk sidebar */
  variant?: 'card' | 'compact'
}

/** Ajakan install aplikasi. Tidak tampil kalau sudah ter-install atau browser tidak mendukung. */
export function InstallCard({ variant = 'card' }: Props) {
  const { isInstalled, canInstall, needsIOSGuide, install } = useInstallPrompt()
  if (isInstalled || (!canInstall && !needsIOSGuide)) return null

  if (variant === 'compact') {
    if (!canInstall) return null
    return (
      <button
        type="button"
        onClick={install}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
      >
        <Download className="h-4 w-4" /> Install aplikasi
      </button>
    )
  }

  return (
    <section className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <img src="/pwa-192x192.png" alt="" className="h-12 w-12 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-800">Install Simuku</p>
        {canInstall ? (
          <>
            <p className="mt-0.5 text-sm text-slate-600">
              Buka langsung dari layar utama seperti aplikasi biasa, dan tetap bisa dipakai tanpa internet.
            </p>
            <button
              type="button"
              onClick={install}
              className="mt-3 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              <Download className="h-4 w-4" /> Install sekarang
            </button>
          </>
        ) : (
          <p className="mt-0.5 text-sm text-slate-600">
            Di Safari, ketuk tombol <Share className="inline h-4 w-4 align-text-bottom" /> <b>Bagikan</b>, lalu pilih{' '}
            <b>"Tambah ke Layar Utama"</b>.
          </p>
        )}
      </div>
    </section>
  )
}
