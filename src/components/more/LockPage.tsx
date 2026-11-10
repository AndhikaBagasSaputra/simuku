import { useState } from 'react'
import { useAppLock } from '../../hooks/useAppLock'
import { checkPin, PIN_LENGTH, TIMEOUT_OPTIONS } from '../../lib/appLock'
import { dangerButtonClass, primaryButtonClass } from '../../lib/ui'
import { PinPad } from '../lock/PinPad'
import { Sheet } from '../ui/Sheet'

type Flow = 'set' | 'change' | 'disable'
type Step = 'current' | 'new' | 'confirm'

const FLOW_TITLE: Record<Flow, string> = {
  set: 'Buat PIN',
  change: 'Ubah PIN',
  disable: 'Matikan kunci PIN',
}

const STEP_TEXT: Record<Step, string> = {
  current: 'Masukkan PIN saat ini',
  new: `Masukkan PIN baru (${PIN_LENGTH} angka)`,
  confirm: 'Ulangi PIN baru',
}

interface Props {
  onNotify: (message: string) => void
}

/** Pengaturan kunci aplikasi: buat, ubah, atau matikan PIN */
export function LockPage({ onNotify }: Props) {
  const lock = useAppLock()
  const [flow, setFlow] = useState<Flow | null>(null)
  const [step, setStep] = useState<Step>('new')
  const [firstPin, setFirstPin] = useState('')
  const [error, setError] = useState('')

  function start(next: Flow) {
    setFlow(next)
    setStep(next === 'set' ? 'new' : 'current')
    setFirstPin('')
    setError('')
  }

  function close() {
    setFlow(null)
  }

  async function handlePin(pin: string) {
    setError('')
    try {
      if (step === 'current') {
        if (!(await checkPin(pin))) return setError('PIN salah, coba lagi.')
        if (flow === 'disable') {
          lock.disable()
          close()
          return onNotify('Kunci PIN dimatikan')
        }
        return setStep('new')
      }
      if (step === 'new') {
        setFirstPin(pin)
        return setStep('confirm')
      }
      if (pin !== firstPin) {
        setStep('new')
        return setError('PIN tidak sama. Ulangi dari awal.')
      }
      await lock.setPin(pin)
      close()
      onNotify(flow === 'change' ? 'PIN berhasil diubah' : 'Kunci PIN aktif')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PIN tidak bisa disimpan')
    }
  }

  return (
    <div className="space-y-4 lg:max-w-xl">
      <section className="rounded-2xl bg-surface p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-slate-800">Kunci PIN</p>
            <p className="text-sm text-slate-500">
              {lock.enabled
                ? 'Aktif. Aplikasi meminta PIN setiap dibuka.'
                : 'Belum aktif. Siapa pun yang membuka aplikasi ini bisa melihat datamu.'}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
              lock.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {lock.enabled ? 'Aktif' : 'Mati'}
          </span>
        </div>

        {lock.enabled ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => start('change')}
              className="rounded-xl border border-slate-200 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Ubah PIN
            </button>
            <button
              type="button"
              onClick={lock.lockNow}
              className="rounded-xl border border-slate-200 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Kunci sekarang
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => start('set')} className={`mt-4 w-full ${primaryButtonClass}`}>
            Aktifkan kunci PIN
          </button>
        )}
      </section>

      {lock.enabled && (
        <>
          <section className="rounded-2xl bg-surface p-4 shadow-sm">
            <label className="block">
              <span className="font-semibold text-slate-800">Kunci otomatis</span>
              <span className="block text-sm text-slate-500">
                Terkunci lagi setelah aplikasi ditinggal atau tidak disentuh selama:
              </span>
              <select
                value={lock.timeoutMin}
                onChange={(e) => lock.setTimeoutMin(Number(e.target.value))}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                {TIMEOUT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            {lock.timeoutMin === 0 && (
              <p className="mt-2 text-xs text-slate-500">
                "Langsung" mengunci setiap kali kamu pindah aplikasi, pindah tab, atau mematikan layar.
              </p>
            )}
          </section>

          <section className="rounded-2xl bg-surface p-4 shadow-sm">
            <p className="font-semibold text-slate-800">Matikan kunci</p>
            <p className="text-sm text-slate-500">Aplikasi bisa dibuka tanpa PIN. Datamu tidak berubah.</p>
            <button type="button" onClick={() => start('disable')} className={`mt-3 w-full ${dangerButtonClass}`}>
              Matikan kunci PIN
            </button>
          </section>
        </>
      )}

      <section className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">Yang perlu kamu tahu</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>
            <b>PIN tidak bisa dipulihkan.</b> Kalau lupa, semua data di perangkat ini harus dihapus. Rutinlah
            membuat backup supaya datanya bisa dikembalikan.
          </li>
          <li>PIN berlaku untuk perangkat ini saja. Di perangkat lain, PIN diatur sendiri.</li>
          <li>Ini kunci layar, bukan enkripsi: tujuannya mencegah orang lain mengintip saat memegang perangkatmu.</li>
        </ul>
      </section>

      {flow && (
        <Sheet title={FLOW_TITLE[flow]} onClose={close}>
          <p className="mb-5 text-center text-sm font-medium text-slate-600">{STEP_TEXT[step]}</p>
          <PinPad onComplete={handlePin} error={error} />
        </Sheet>
      )}
    </div>
  )
}
