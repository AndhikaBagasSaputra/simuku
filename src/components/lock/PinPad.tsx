import { Delete } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { PIN_LENGTH } from '../../lib/appLock'

interface Props {
  /** Dipanggil saat semua digit terisi. Titik-titik dikosongkan lagi setelah selesai */
  onComplete: (pin: string) => void | Promise<void>
  error?: string
  disabled?: boolean
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

/** Titik PIN + tombol angka. Bisa juga diketik dari keyboard */
export function PinPad({ onComplete, error, disabled = false }: Props) {
  const [digits, setDigits] = useState('')
  const [busy, setBusy] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const blocked = disabled || busy

  // Simpan nilai terbaru di ref supaya pendengar keyboard cukup dipasang sekali
  const stateRef = useRef({ digits, blocked, onComplete })
  useEffect(() => {
    stateRef.current = { digits, blocked, onComplete }
  })

  async function press(digit: string) {
    const { digits: currentDigits, blocked: isBlocked, onComplete: complete } = stateRef.current
    if (isBlocked || currentDigits.length >= PIN_LENGTH) return
    const next = currentDigits + digit
    stateRef.current.digits = next
    setDigits(next)
    if (next.length < PIN_LENGTH) return

    setBusy(true)
    try {
      await complete(next)
    } finally {
      stateRef.current.digits = ''
      setDigits('')
      setBusy(false)
    }
  }

  function erase() {
    if (stateRef.current.blocked) return
    const next = stateRef.current.digits.slice(0, -1)
    stateRef.current.digits = next
    setDigits(next)
  }

  const handlers = useRef({ press, erase })
  useEffect(() => {
    handlers.current = { press, erase }
  })

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Abaikan kalau papan ini sedang tertutup layar kunci (induknya inert)
      if (e.ctrlKey || e.metaKey || e.altKey || rootRef.current?.closest("[inert]")) return
      if (/^\d$/.test(e.key)) {
        e.preventDefault()
        void handlers.current.press(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        handlers.current.erase()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const keyClass =
    'flex h-14 items-center justify-center rounded-2xl bg-slate-100 text-xl font-semibold text-slate-800 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40'

  return (
    <div ref={rootRef} className="mx-auto w-full max-w-64">
      <div
        className="flex justify-center gap-3"
        role="status"
        aria-label={`${digits.length} dari ${PIN_LENGTH} digit terisi`}
      >
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span
            key={i}
            className={`h-3.5 w-3.5 rounded-full border-2 ${
              i < digits.length ? 'border-primary bg-primary' : 'border-slate-300'
            }`}
          />
        ))}
      </div>

      <p role="alert" className="mt-3 min-h-10 text-center text-sm font-medium text-rose-600">
        {error}
      </p>

      <div className="mt-1 grid grid-cols-3 gap-2.5">
        {KEYS.map((k) => (
          <button key={k} type="button" disabled={blocked} onClick={() => void press(k)} className={keyClass}>
            {k}
          </button>
        ))}
        <span />
        <button type="button" disabled={blocked} onClick={() => void press('0')} className={keyClass}>
          0
        </button>
        <button
          type="button"
          disabled={blocked || digits.length === 0}
          onClick={erase}
          aria-label="Hapus satu digit"
          className={`${keyClass} bg-transparent hover:bg-slate-100`}
        >
          <Delete className="h-6 w-6" />
        </button>
      </div>
    </div>
  )
}
