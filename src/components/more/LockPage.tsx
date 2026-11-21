import { useState } from 'react'
import { useAppLock } from '../../hooks/useAppLock'
import { checkPin, getLockConfig, PIN_LENGTH, PIN_LENGTHS, TIMEOUT_OPTIONS } from '../../lib/appLock'
import { dangerButtonClass, primaryButtonClass, segmentClass } from '../../lib/ui'
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
  new: 'Masukkan PIN baru',
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
  // Panjang PIN baru (4 atau 6 angka); default mengikuti PIN yang sekarang
  const [pinLength, setPinLength] = useState<number>(() => getLockConfig()?.length ?? PIN_LENGTH)

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
          </section>

          <section className="rounded-2xl bg-surface p-4 shadow-sm">
            <p className="font-semibold text-slate-800">Matikan kunci</p>
            <button type="button" onClick={() => start('disable')} className={`mt-3 w-full ${dangerButtonClass}`}>
              Matikan kunci PIN
            </button>
          </section>
        </>
      )}

      <p className="px-1 text-xs text-amber-800">PIN tidak bisa dipulihkan. Kalau lupa, data di perangkat ini harus dihapus.</p>

      {flow && (
        <Sheet title={FLOW_TITLE[flow]} onClose={close}>
          <p className="mb-4 text-center text-sm font-medium text-slate-600">{STEP_TEXT[step]}</p>
          {step === 'new' && (
            <div className="mx-auto mb-5 grid max-w-64 grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Panjang PIN">
              {PIN_LENGTHS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPinLength(n)}
                  aria-pressed={pinLength === n}
                  className={segmentClass(pinLength === n)}
                >
                  {n} angka
                </button>
              ))}
            </div>
          )}
          <PinPad
            // key: kosongkan isian saat panjang atau langkahnya berganti
            key={`${step}-${step === 'current' ? 'cur' : pinLength}`}
            length={step === 'current' ? (getLockConfig()?.length ?? PIN_LENGTH) : pinLength}
            onComplete={handlePin}
            error={error}
          />
        </Sheet>
      )}
    </div>
  )
}
