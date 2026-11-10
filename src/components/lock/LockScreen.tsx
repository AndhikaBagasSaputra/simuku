import { Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { checkPin, clearFailures, getLockoutUntil, registerFailure, wipeAllData } from '../../lib/appLock'
import { dangerButtonClass, inputClass } from '../../lib/ui'
import { PinPad } from './PinPad'

interface Props {
  onUnlock: () => void
}

const WIPE_WORD = 'HAPUS'

/** Layar penuh yang menutupi aplikasi sampai PIN yang benar dimasukkan */
export function LockScreen({ onUnlock }: Props) {
  const [error, setError] = useState('')
  const [lockoutUntil, setLockoutUntil] = useState(getLockoutUntil)
  const [now, setNow] = useState(Date.now)
  const [forgot, setForgot] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const waitSeconds = Math.max(0, Math.ceil((lockoutUntil - now) / 1000))

  // Hitung mundur selama harus menunggu
  useEffect(() => {
    if (!lockoutUntil) return
    const timer = setInterval(() => {
      setNow(Date.now())
      if (Date.now() >= lockoutUntil) setLockoutUntil(0)
    }, 500)
    return () => clearInterval(timer)
  }, [lockoutUntil])

  async function handlePin(pin: string) {
    try {
      if (await checkPin(pin)) {
        clearFailures()
        onUnlock()
        return
      }
    } catch (e) {
      return setError(e instanceof Error ? e.message : 'PIN tidak bisa diperiksa')
    }
    const left = registerFailure()
    if (left === 0) {
      setNow(Date.now())
      setLockoutUntil(getLockoutUntil())
      setError('')
    } else {
      setError(`PIN salah. Sisa ${left} percobaan sebelum harus menunggu.`)
    }
  }

  function handleWipe() {
    wipeAllData()
    // Muat ulang supaya aplikasi mulai dari keadaan kosong
    window.location.reload()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Aplikasi terkunci"
      className="fixed inset-0 z-[100] flex flex-col items-center overflow-y-auto bg-slate-50 px-6 py-10"
    >
      <div className="my-auto w-full max-w-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-center text-xl font-bold text-slate-800">Simuku terkunci</h1>

        {forgot ? (
          <div className="mt-4 rounded-2xl bg-surface p-4 shadow-sm">
            <p className="font-semibold text-slate-800">Lupa PIN?</p>
            <p className="mt-1 text-sm text-slate-600">
              PIN tidak bisa dipulihkan. Satu-satunya cara adalah menghapus <b>semua data</b> di perangkat ini,
              termasuk PIN-nya. Setelah itu kamu bisa memulihkan data dari file backup lewat menu Backup &amp;
              Restore.
            </p>
            <label className="mt-3 block">
              <span className="text-sm font-medium text-slate-600">
                Ketik <b>{WIPE_WORD}</b> untuk melanjutkan
              </span>
              <input
                type="text"
                autoComplete="off"
                autoCapitalize="characters"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className={inputClass}
              />
            </label>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setForgot(false)
                  setConfirmText('')
                }}
                className="flex-1 rounded-xl border border-slate-200 py-3 font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={confirmText.trim().toUpperCase() !== WIPE_WORD}
                onClick={handleWipe}
                className={`flex-1 disabled:opacity-40 ${dangerButtonClass}`}
              >
                Hapus semua data
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-1 mb-5 text-center text-sm text-slate-500">Masukkan PIN untuk membuka</p>
            <PinPad
              onComplete={handlePin}
              disabled={waitSeconds > 0}
              error={waitSeconds > 0 ? `Terlalu banyak percobaan. Coba lagi dalam ${waitSeconds} detik.` : error}
            />
            <button
              type="button"
              onClick={() => setForgot(true)}
              className="mx-auto mt-6 block rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
            >
              Lupa PIN?
            </button>
          </>
        )}
      </div>
    </div>
  )
}
