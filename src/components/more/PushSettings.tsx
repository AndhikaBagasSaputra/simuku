import { BellRing } from 'lucide-react'
import { useEffect, useState } from 'react'
import { disablePush, enablePush, getPushState, sendTestPush, type PushState } from '../../lib/push'
import { primaryButtonClass } from '../../lib/ui'

const STATE_TEXT: Record<PushState, string> = {
  unsupported: 'Browser ini belum mendukung notifikasi. Coba buka Simuku yang sudah di-install, atau pakai Chrome.',
  'needs-install':
    'Di iPhone/iPad, notifikasi hanya bisa dipakai setelah Simuku ditambahkan ke Layar Utama (Bagikan → Tambahkan ke Layar Utama), lalu dibuka dari ikonnya.',
  'not-configured': 'Notifikasi belum diatur di server.',
  denied:
    'Izin notifikasi untuk Simuku diblokir. Izinkan lewat pengaturan browser atau HP (bagian Notifikasi), lalu buka lagi halaman ini.',
  off: 'Dapatkan pengingat di HP sehari sebelum tagihan jatuh tempo, di hari H, dan sehari setelahnya, walau aplikasi sedang ditutup.',
  on: 'Aktif di perangkat ini. Pengingat dikirim tiap pagi kalau ada tagihan yang jatuh tempo.',
}

/** Pengaturan notifikasi pengingat tagihan (hanya tampil saat sudah masuk akun) */
export function PushSettings() {
  const [state, setState] = useState<PushState | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getPushState()
      .then((s) => active && setState(s))
      .catch(() => active && setState('unsupported'))
    return () => {
      active = false
    }
  }, [])

  async function run(action: () => Promise<void>, success: string) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await action()
      setMessage(success)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan')
    } finally {
      setState(await getPushState().catch(() => 'unsupported' as const))
      setBusy(false)
    }
  }

  if (!state) return null

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          <BellRing className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800">Pengingat tagihan</p>
          <p className="text-xs text-slate-500">{state === 'on' ? 'Aktif' : 'Notifikasi ke HP'}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-600">{STATE_TEXT[state]}</p>

      {state === 'off' && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void run(enablePush, 'Notifikasi aktif. Coba kirim notifikasi uji.')}
          className={`mt-3 w-full ${primaryButtonClass}`}
        >
          {busy ? 'Mengaktifkan…' : 'Aktifkan notifikasi'}
        </button>
      )}

      {state === 'on' && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(sendTestPush, 'Notifikasi uji dikirim. Seharusnya muncul dalam beberapa detik.')}
            className="rounded-xl border border-slate-200 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Kirim uji
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(disablePush, 'Notifikasi dimatikan di perangkat ini.')}
            className="rounded-xl border border-slate-200 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Matikan
          </button>
        </div>
      )}

      {message && (
        <p role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-rose-600">
          {error}
        </p>
      )}
    </section>
  )
}
